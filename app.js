const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Artigo = require('./src/models/Artigo');
const Comentario = require('./src/models/Comentario');

const app = express();

// Middleware CORS
app.use(cors({ origin: 'https://site-yan-renat-advocacia.vercel.app' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de conexão com MongoDB
async function connectDB(req, res, next) {
    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI);
    }
    next();
}

// ---- Rotas de Artigos ----

// Listar artigos
app.get('/api/artigos', connectDB, async (req, res) => {
    try {
        const artigos = await Artigo.find()
            .sort({ data: -1 })
            .select('titulo slug descricao data autor curtidas conteudo');
        res.json(artigos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Buscar artigo por slug
app.get('/api/artigos/:slug', connectDB, async (req, res) => {
    try {
        const artigo = await Artigo.findOne({ slug: req.params.slug });
        if (!artigo) return res.status(404).json({ message: 'Artigo não encontrado' });
        res.json(artigo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Curtir artigo
app.post('/api/artigos/:id/curtir', connectDB, async (req, res) => {
    try {
        const artigo = await Artigo.findByIdAndUpdate(
            req.params.id,
            { $inc: { curtidas: 1 } },
            { new: true }
        );
        if (!artigo) return res.status(404).json({ message: 'Artigo não encontrado' });
        res.json({ curtidas: artigo.curtidas });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Descurtir artigo
app.post('/api/artigos/:id/descurtir', connectDB, async (req, res) => {
    try {
        const artigo = await Artigo.findById(req.params.id);
        if (!artigo) return res.status(404).json({ message: 'Artigo não encontrado' });
        if (artigo.curtidas <= 0) return res.status(400).json({ message: 'Zero curtidas' });
        artigo.curtidas -= 1;
        await artigo.save();
        res.json({ curtidas: artigo.curtidas });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---- Rotas de Comentários ----

// Listar comentários por slug
app.get('/api/comentarios/:slug', connectDB, async (req, res) => {
    try {
        const comentarios = await Comentario.find({ slug: req.params.slug })
            .sort({ data: -1 })
            .lean();
        res.json({ comments: comentarios });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Criar comentário
app.post('/api/comentarios/:slug', connectDB, async (req, res) => {
    try {
        const { nome, texto, autorId } = req.body;
        const comentario = await Comentario.create({
            slug: req.params.slug,
            nome,
            texto,
            autorId: autorId || '',
            ip: req.ip
        });
        res.status(201).json({ comment: comentario });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Excluir comentário
app.delete('/api/comentarios/:id', connectDB, async (req, res) => {
    try {
        const comentario = await Comentario.findByIdAndDelete(req.params.id);
        if (!comentario) return res.status(404).json({ message: 'Comentário não encontrado' });
        res.json({ message: 'Comentário removido' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '2.3.1' });
});

// Página inicial da API (visual aprimorado)
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
        .logo {
            font-size: 4rem;
            margin-bottom: 1rem;
            color: #DAA14F;
            text-shadow: 0 0 20px rgba(218,161,79,0.5);
        }
        h1 {
            font-family: 'Oswald', sans-serif;
            font-size: 2.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            letter-spacing: 1px;
        }
        .badge {
            display: inline-block;
            background: rgba(218,161,79,0.15);
            color: #DAA14F;
            padding: 0.3rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
            margin-bottom: 1.5rem;
        }
        p {
            opacity: 0.8;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        .endpoints {
            text-align: left;
            margin: 2rem 0;
        }
        .endpoint {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 1rem 1.5rem;
            margin-bottom: 0.8rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.3s ease;
        }
        .endpoint:hover {
            background: rgba(218,161,79,0.08);
            border-color: rgba(218,161,79,0.3);
            transform: translateY(-2px);
        }
        .method {
            font-size: 0.8rem;
            font-weight: 600;
            padding: 0.2rem 0.6rem;
            border-radius: 4px;
            text-transform: uppercase;
            margin-right: 1rem;
        }
        .method.get { background: rgba(59,130,246,0.2); color: #3b82f6; }
        .method.post { background: rgba(16,185,129,0.2); color: #10b981; }
        .method.delete { background: rgba(239,68,68,0.2); color: #ef4444; }
        .path {
            font-family: 'Courier New', monospace;
            font-size: 0.95rem;
            color: #DDD;
        }
        .link {
            color: #DAA14F;
            text-decoration: none;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.3rem;
            transition: color 0.2s;
        }
        .link:hover { color: #FFF; }
        .footer {
            margin-top: 2rem;
            font-size: 0.85rem;
            opacity: 0.6;
        }
        .footer a {
            color: #DAA14F;
            text-decoration: none;
            font-weight: 500;
        }
        .footer a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <i class="fas fa-balance-scale"></i>
        </div>
        <h1>Yan Renat Advocacia</h1>
        <div class="badge">⚡ API v2.3.1 • Online</div>
        <p>Backend jurídico – fornecendo artigos, comentários e curtidas para o site institucional.</p>
        
        <div class="endpoints">
            <div class="endpoint">
                <div style="display:flex; align-items:center;">
                    <span class="method get">GET</span>
                    <span class="path">/api/health</span>
                </div>
                <a href="/api/health" class="link"><i class="fas fa-external-link-alt"></i> Testar</a>
            </div>
            <div class="endpoint">
                <div style="display:flex; align-items:center;">
                    <span class="method get">GET</span>
                    <span class="path">/api/artigos</span>
                </div>
                <a href="/api/artigos" class="link"><i class="fas fa-external-link-alt"></i> Listar</a>
            </div>
            <div class="endpoint">
                <div style="display:flex; align-items:center;">
                    <span class="method get">GET</span>
                    <span class="path">/api/artigos?slug=exemplo</span>
                </div>
                <span style="opacity:0.5;font-size:0.8rem;">Busca por slug</span>
            </div>
            <div class="endpoint">
                <div style="display:flex; align-items:center;">
                    <span class="method post">POST</span>
                    <span class="path">/api/artigos/:id/curtir</span>
                </div>
                <span style="opacity:0.5;font-size:0.8rem;">Curtir</span>
            </div>
            <div class="endpoint">
                <div style="display:flex; align-items:center;">
                    <span class="method post">POST</span>
                    <span class="path">/api/artigos/:id/descurtir</span>
                </div>
                <span style="opacity:0.5;font-size:0.8rem;">Descurtir</span>
            </div>
            <div class="endpoint">
                <div style="display:flex; align-items:center;">
                    <span class="method get">GET</span>
                    <span class="path">/api/comentarios/:slug</span>
                </div>
                <a href="/api/comentarios/vistos-residencia-permanente-brasil" class="link"><i class="fas fa-external-link-alt"></i> Exemplo</a>
            </div>
            <div class="endpoint">
                <div style="display:flex; align-items:center;">
                    <span class="method post">POST</span>
                    <span class="path">/api/comentarios/:slug</span>
                </div>
                <span style="opacity:0.5;font-size:0.8rem;">Comentar</span>
            </div>
            <div class="endpoint">
                <div style="display:flex; align-items:center;">
                    <span class="method delete">DELETE</span>
                    <span class="path">/api/comentarios/:id</span>
                </div>
                <span style="opacity:0.5;font-size:0.8rem;">Excluir</span>
            </div>
        </div>
        <div class="footer">
            <a href="https://site-yan-renat-advocacia.vercel.app"><i class="fas fa-arrow-left"></i> Ir para o site principal</a>
        </div>
    </div>
</body>
</html>`);
});

module.exports = app;