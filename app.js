const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// Rotas
const artigosRouter = require('./src/routes/artigos');
const comentariosRouter = require('./src/routes/comentarios');

const app = express();
app.set('trust proxy', 1);

// ==========================================
// Seguranca: Headers HTTP
// ==========================================
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// ==========================================
// Rate Limiting global
// ==========================================
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisicoes. Tente novamente em alguns minutos.' }
}));

// ==========================================
// CORS
// ==========================================
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const allowed = [
            'https://site-yan-renat-advocacia.vercel.app',
            'http://localhost:3000',
            'http://127.0.0.1:3000'
        ];

        if (allowed.includes(origin)) return callback(null, true);
        if (origin.endsWith('-magroalbinos-projects.vercel.app')) return callback(null, true);

        console.warn(`CORS bloqueado para origem: ${origin}`);
        callback(new Error('Origem nao permitida pela politica de CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'x-autor-token'],
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ==========================================
// Body parsing
// ==========================================
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ==========================================
// Montar rotas
// ==========================================
app.use('/api/artigos', artigosRouter);
app.use('/api/comentarios', comentariosRouter);

// ==========================================
// Health check
// ==========================================
app.get('/api/health', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ status: 'ok', version: '4.0.0', database: dbStatus });
});

// ==========================================
// Favicon SVG (balanca da justica)
// ==========================================
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0F212F"/>
  <g transform="translate(32,32)" fill="#DAA14F">
    <rect x="-1.5" y="-20" width="3" height="36" rx="1.5"/>
    <rect x="-12" y="16" width="24" height="3" rx="1.5"/>
    <rect x="-18" y="-20" width="36" height="3" rx="1.5"/>
    <circle cx="-18" cy="-18.5" r="3"/>
    <circle cx="18" cy="-18.5" r="3"/>
    <line x1="-18" y1="-16" x2="-18" y2="-4" stroke="#DAA14F" stroke-width="2"/>
    <line x1="18" y1="-16" x2="18" y2="-4" stroke="#DAA14F" stroke-width="2"/>
    <path d="M-26,-4 Q-18,10 -10,-4 Z" opacity="0.9"/>
    <path d="M10,-4 Q18,10 26,-4 Z" opacity="0.9"/>
  </g>
</svg>`;

app.get('/favicon.svg', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(faviconSvg);
});

app.get('/favicon.ico', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(faviconSvg);
});

// ==========================================
// Pagina inicial da API
// ==========================================
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>API Yan Renat Advocacia</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
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
        .method.put { background: rgba(245,158,11,0.2); color: #f59e0b; }
        .method.delete { background: rgba(239,68,68,0.2); color: #ef4444; }
        .path { font-family: 'Courier New', monospace; font-size: 0.95rem; color: #DDD; }
        .tag { font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 4px; background: rgba(239,68,68,0.15); color: #ef4444; margin-left: 0.5rem; }
        .link { color: #DAA14F; text-decoration: none; font-size: 0.9rem; display: flex; align-items: center; gap: 0.3rem; transition: color 0.2s; }
        .link:hover { color: #FFF; }
        .footer { margin-top: 2rem; font-size: 0.85rem; opacity: 0.6; }
        .footer a { color: #DAA14F; text-decoration: none; font-weight: 500; }
        .footer a:hover { text-decoration: underline; }
        .section-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; opacity: 0.4; margin: 1.5rem 0 0.5rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo"><i class="fas fa-balance-scale"></i></div>
        <h1>Yan Renat Advocacia</h1>
        <div class="badge">API v4.0.0 - Online</div>
        <p>Backend juridico - artigos, comentarios, curtidas e busca textual.</p>
        <div class="endpoints">
            <div class="section-title">Sistema</div>
            <div class="endpoint"><div style="display:flex;align-items:center;"><span class="method get">GET</span><span class="path">/api/health</span></div><a href="/api/health" class="link"><i class="fas fa-external-link-alt"></i> Testar</a></div>

            <div class="section-title">Artigos</div>
            <div class="endpoint"><div style="display:flex;align-items:center;"><span class="method get">GET</span><span class="path">/api/artigos</span></div><a href="/api/artigos" class="link"><i class="fas fa-external-link-alt"></i> Listar</a></div>
            <div class="endpoint"><div style="display:flex;align-items:center;"><span class="method get">GET</span><span class="path">/api/artigos/buscar?q=</span></div><span style="opacity:0.5;font-size:0.8rem;">Busca textual</span></div>
            <div class="endpoint"><div style="display:flex;align-items:center;"><span class="method get">GET</span><span class="path">/api/artigos/:slug</span></div><span style="opacity:0.5;font-size:0.8rem;">Por slug</span></div>
            <div class="endpoint"><div style="display:flex;align-items:center;"><span class="method post">POST</span><span class="path">/api/artigos/:id/curtir</span></div><span style="opacity:0.5;font-size:0.8rem;">Curtir</span></div>
            <div class="endpoint"><div style="display:flex;align-items:center;"><span class="method post">POST</span><span class="path">/api/artigos/:id/descurtir</span></div><span style="opacity:0.5;font-size:0.8rem;">Descurtir</span></div>
            <div class="endpoint"><div style="display:flex;align-items:center;"><span class="method post">POST</span><span class="path">/api/artigos</span><span class="tag">admin</span></div><span style="opacity:0.5;font-size:0.8rem;">Criar</span></div>
            <div class="endpoint"><div style="display:flex;align-items:center;"><span class="method put">PUT</span><span class="path">/api/artigos/:id</span><span class="tag">admin</span></div><span style="opacity:0.5;font-size:0.8rem;">Editar</span></div>
            <div class="endpoint"><div style="display:flex;align-items:center;"><span class="method delete">DELETE</span><span class="path">/api/artigos/:id</span><span class="tag">admin</span></div><span style="opacity:0.5;font-size:0.8rem;">Remover</span></div>

            <div class="section-title">Comentarios</div>
            <div class="endpoint"><div style="display:flex;align-items:center;"><span class="method get">GET</span><span class="path">/api/comentarios/:slug</span></div><a href="/api/comentarios/vistos-residencia-permanente-brasil" class="link"><i class="fas fa-external-link-alt"></i> Exemplo</a></div>
            <div class="endpoint"><div style="display:flex;align-items:center;"><span class="method post">POST</span><span class="path">/api/comentarios/:slug</span></div><span style="opacity:0.5;font-size:0.8rem;">Comentar</span></div>
            <div class="endpoint"><div style="display:flex;align-items:center;"><span class="method delete">DELETE</span><span class="path">/api/comentarios/:id</span></div><span style="opacity:0.5;font-size:0.8rem;">Excluir (token/admin)</span></div>
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
    console.error('Erro nao tratado:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

module.exports = app;
