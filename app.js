const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const Artigo = require('./src/models/Artigo');
const Comentario = require('./src/models/Comentario');

const app = express();

// ==========================================
// Rate Limiting
// ==========================================
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' }
});

const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisições de escrita. Tente novamente em alguns minutos.' }
});

app.use(generalLimiter);

// ==========================================
// Configuração de CORS
// ==========================================
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const allowed = [
            'https://site-yan-renat-advocacia.vercel.app',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];

        if (allowed.includes(origin)) {
            return callback(null, true);
        }

        if (origin.endsWith('-magroalbinos-projects.vercel.app')) {
            return callback(null, true);
        }

        console.warn(`CORS bloqueado para origem: ${origin}`);
        callback(new Error('Origem não permitida pela política de CORS'));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'x-autor-token'],
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ==========================================
// Middleware: Conexão MongoDB
// ==========================================
async function connectDB(req, res, next) {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
        }
        next();
    } catch (err) {
        console.error('Erro ao conectar ao MongoDB:', err.message);
        res.status(503).json({ error: 'Serviço temporariamente indisponível' });
    }
}

// ==========================================
// Middleware: Verificar Admin (API Key)
// ==========================================
function isAdmin(req) {
    const adminKey = req.headers['x-admin-key'];
    return adminKey && process.env.ADMIN_API_KEY && adminKey === process.env.ADMIN_API_KEY;
}

// ==========================================
// Helper: Retornar erros de validação
// ==========================================
function handleValidationErrors(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: errors.array().map(e => e.msg) });
    }
    return null;
}

// ==========================================
// Rotas de Artigos
// ==========================================

// Listar artigos
app.get('/api/artigos', connectDB, async (req, res) => {
    try {
        const artigos = await Artigo.find()
            .sort({ data: -1 })
            .select('titulo slug descricao data autor curtidas conteudo');
        res.json(artigos);
    } catch (err) {
        console.error('Erro ao listar artigos:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Buscar artigo por slug
app.get('/api/artigos/:slug',
    param('slug').trim().notEmpty().withMessage('Slug é obrigatório'),
    connectDB,
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const artigo = await Artigo.findOne({ slug: req.params.slug });
            if (!artigo) return res.status(404).json({ error: 'Artigo não encontrado' });
            res.json(artigo);
        } catch (err) {
            console.error('Erro ao buscar artigo:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// Curtir artigo (atômico)
app.post('/api/artigos/:id/curtir',
    param('id').isMongoId().withMessage('ID inválido'),
    writeLimiter,
    connectDB,
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const artigo = await Artigo.findByIdAndUpdate(
                req.params.id,
                { $inc: { curtidas: 1 } },
                { new: true }
            );
            if (!artigo) return res.status(404).json({ error: 'Artigo não encontrado' });
            res.json({ curtidas: artigo.curtidas });
        } catch (err) {
            console.error('Erro ao curtir:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// Descurtir artigo (atômico, previne negativo)
app.post('/api/artigos/:id/descurtir',
    param('id').isMongoId().withMessage('ID inválido'),
    writeLimiter,
    connectDB,
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const artigo = await Artigo.findOneAndUpdate(
                { _id: req.params.id, curtidas: { $gt: 0 } },
                { $inc: { curtidas: -1 } },
                { new: true }
            );
            if (!artigo) {
                const existe = await Artigo.findById(req.params.id);
                if (!existe) return res.status(404).json({ error: 'Artigo não encontrado' });
                return res.status(400).json({ error: 'Artigo já está com zero curtidas' });
            }
            res.json({ curtidas: artigo.curtidas });
        } catch (err) {
            console.error('Erro ao descurtir:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// ==========================================
// Rotas de Comentários
// ==========================================

// Listar comentários por slug
app.get('/api/comentarios/:slug',
    param('slug').trim().notEmpty().withMessage('Slug é obrigatório'),
    connectDB,
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const comentarios = await Comentario.find({ slug: req.params.slug })
                .sort({ data: -1 })
                .select('slug nome texto data _id')
                .lean();
            res.json({ comments: comentarios });
        } catch (err) {
            console.error('Erro ao listar comentários:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// Criar comentário — retorna autorToken para o frontend guardar
app.post('/api/comentarios/:slug',
    param('slug').trim().notEmpty().withMessage('Slug é obrigatório'),
    body('nome')
        .trim()
        .notEmpty().withMessage('Nome é obrigatório')
        .isLength({ max: 100 }).withMessage('Nome deve ter no máximo 100 caracteres')
        .escape(),
    body('texto')
        .trim()
        .notEmpty().withMessage('Texto é obrigatório')
        .isLength({ max: 2000 }).withMessage('Texto deve ter no máximo 2000 caracteres')
        .escape(),
    writeLimiter,
    connectDB,
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            // Verifica se o artigo existe antes de permitir comentário
            const artigo = await Artigo.findOne({ slug: req.params.slug });
            if (!artigo) return res.status(404).json({ error: 'Artigo não encontrado' });

            const autorToken = uuidv4();

            const comentario = await Comentario.create({
                slug: req.params.slug,
                nome: req.body.nome,
                texto: req.body.texto,
                autorToken,
                ip: req.headers['x-forwarded-for'] || req.ip || ''
            });

            // Retorna o autorToken para o frontend guardar (localStorage)
            res.status(201).json({
                comment: {
                    _id: comentario._id,
                    slug: comentario.slug,
                    nome: comentario.nome,
                    texto: comentario.texto,
                    data: comentario.data
                },
                autorToken
            });
        } catch (err) {
            console.error('Erro ao criar comentário:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// Excluir comentário — requer autorToken (header) ou admin API key
app.delete('/api/comentarios/:id',
    param('id').isMongoId().withMessage('ID inválido'),
    connectDB,
    async (req, res) => {
        const validationError = handleValidationErrors(req, res);
        if (validationError) return;

        try {
            const comentario = await Comentario.findById(req.params.id);
            if (!comentario) return res.status(404).json({ error: 'Comentário não encontrado' });

            // Admin pode deletar qualquer comentário
            if (isAdmin(req)) {
                await Comentario.findByIdAndDelete(req.params.id);
                return res.json({ message: 'Comentário removido (admin)' });
            }

            // Autor precisa enviar o token correto
            const autorToken = req.headers['x-autor-token'];
            if (!autorToken) {
                return res.status(401).json({ error: 'Token de autor ou chave de admin necessários' });
            }

            if (autorToken !== comentario.autorToken) {
                return res.status(403).json({ error: 'Você não tem permissão para excluir este comentário' });
            }

            await Comentario.findByIdAndDelete(req.params.id);
            res.json({ message: 'Comentário removido' });
        } catch (err) {
            console.error('Erro ao excluir comentário:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// ==========================================
// Health check (verifica conexão com DB)
// ==========================================
app.get('/api/health', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'ok',
        version: '3.0.0',
        database: dbStatus
    });
});

// ==========================================
// Página inicial da API
// ==========================================
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>API Yan Renat Advocacia</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0F212F 0%, #1a2a3a 100%);
            color: #FFFFFF;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        .container {
            max-width: 700px;
            width: 100%;
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px;
            padding: 3rem 2.5rem;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            text-align: center;
        }
        .logo { font-size: 4rem; margin-bottom: 1rem; color: #DAA14F; text-shadow: 0 0 20px rgba(218,161,79,0.5); }
        h1 { font-family: 'Oswald', sans-serif; font-size: 2.5rem; font-weight: 600; margin-bottom: 0.5rem; letter-spacing: 1px; }
        .badge { display: inline-block; background: rgba(218,161,79,0.15); color: #DAA14F; padding: 0.3rem 1rem; border-radius: 20px; font-size: 0.9rem; font-weight: 500; margin-bottom: 1.5rem; }
        p { opacity: 0.8; margin-bottom: 2rem; line-height: 1.6; }
        .endpoints { text-align: left; margin: 2rem 0; }
        .endpoint {
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px; padding: 1rem 1.5rem; margin-bottom: 0.8rem;
            display: flex; align-items: center; justify-content: space-between;
            transition: all 0.3s ease;
        }
        .endpoint:hover { background: rgba(218,161,79,0.08); border-color: rgba(218,161,79,0.3); transform: translateY(-2px); }
        .method { font-size: 0.8rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 4px; text-transform: uppercase; margin-right: 1rem; }
        .method.get { background: rgba(59,130,246,0.2); color: #3b82f6; }
        .method.post { background: rgba(16,185,129,0.2); color: #10b981; }
        .method.delete { background: rgba(239,68,68,0.2); color: #ef4444; }
        .path { font-family: 'Courier New', monospace; font-size: 0.95rem; color: #DDD; }
        .link { color: #DAA14F; text-decoration: none; font-size: 0.9rem; display: flex; align-items: center; gap: 0.3rem; transition: color 0.2s; }
        .link:hover { color: #FFF; }
        .footer { margin-top: 2rem; font-size: 0.85rem; opacity: 0.6; }
        .footer a { color: #DAA14F; text-decoration: none; font-weight: 500; }
        .footer a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo"><i class="fas fa-balance-scale"></i></div>
        <h1>Yan Renat Advocacia</h1>
        <div class="badge">API v3.0.0 - Online</div>
        <p>Backend juridico - fornecendo artigos, comentarios e curtidas para o site institucional.</p>
        <div class="endpoints">
            <div class="endpoint"><div style="display:flex; align-items:center;"><span class="method get">GET</span><span class="path">/api/health</span></div><a href="/api/health" class="link"><i class="fas fa-external-link-alt"></i> Testar</a></div>
            <div class="endpoint"><div style="display:flex; align-items:center;"><span class="method get">GET</span><span class="path">/api/artigos</span></div><a href="/api/artigos" class="link"><i class="fas fa-external-link-alt"></i> Listar</a></div>
            <div class="endpoint"><div style="display:flex; align-items:center;"><span class="method get">GET</span><span class="path">/api/artigos/:slug</span></div><span style="opacity:0.5;font-size:0.8rem;">Busca por slug</span></div>
            <div class="endpoint"><div style="display:flex; align-items:center;"><span class="method post">POST</span><span class="path">/api/artigos/:id/curtir</span></div><span style="opacity:0.5;font-size:0.8rem;">Curtir</span></div>
            <div class="endpoint"><div style="display:flex; align-items:center;"><span class="method post">POST</span><span class="path">/api/artigos/:id/descurtir</span></div><span style="opacity:0.5;font-size:0.8rem;">Descurtir</span></div>
            <div class="endpoint"><div style="display:flex; align-items:center;"><span class="method get">GET</span><span class="path">/api/comentarios/:slug</span></div><a href="/api/comentarios/vistos-residencia-permanente-brasil" class="link"><i class="fas fa-external-link-alt"></i> Exemplo</a></div>
            <div class="endpoint"><div style="display:flex; align-items:center;"><span class="method post">POST</span><span class="path">/api/comentarios/:slug</span></div><span style="opacity:0.5;font-size:0.8rem;">Comentar</span></div>
            <div class="endpoint"><div style="display:flex; align-items:center;"><span class="method delete">DELETE</span><span class="path">/api/comentarios/:id</span></div><span style="opacity:0.5;font-size:0.8rem;">Excluir (requer token)</span></div>
        </div>
        <div class="footer"><a href="https://site-yan-renat-advocacia.vercel.app"><i class="fas fa-arrow-left"></i> Ir para o site principal</a></div>
    </div>
</body>
</html>`);
});

// ==========================================
// Tratamento de erros global
// ==========================================
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

module.exports = app;
