const express = require('express');
const cors = require('cors');

const artigosRoutes = require('./routes/artigos.routes');
const comentariosRoutes = require('./routes/comentarios.routes');

const app = express();

// Middleware de CORS manual para garantir que os headers estejam presentes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Responder imediatamente para requisições OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas da API
app.use('/api/artigos', artigosRoutes);
app.use('/api/comentarios', comentariosRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API Yan Renat Advocacia operando corretamente',
        version: '2.2.0'
    });
});

// Página inicial da API
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>API Yan Renat Advocacia</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 2rem; background: #f0f2f5; color: #1a1a2e; }
        .container { max-width: 650px; margin: auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
        h1 { color: #0F212F; font-size: 2rem; margin-bottom: 0.5rem; }
        .badge { background: #DAA14F; color: white; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; display: inline-block; }
        ul { list-style: none; padding: 0; margin: 1.5rem 0; }
        li { margin: 0.7rem 0; padding: 0.5rem; background: #f8f9fa; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; }
        code { background: #e9ecef; padding: 2px 8px; border-radius: 4px; font-size: 0.9em; color: #0F212F; }
        a { color: #DAA14F; text-decoration: none; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚖️ API Yan Renat Advocacia</h1>
        <span class="badge">Versão 2.3.0 ✓ online</span>
        <p>Backend do escritório – fornece artigos, comentários e curtidas.</p>
        <h2>Endpoints disponíveis:</h2>
        <ul>
            <li><code>/api/health</code> <a href="/api/health">🔗 Testar</a></li>
            <li><code>/api/artigos</code> <a href="/api/artigos">🔗 Listar artigos</a></li>
            <li><code>/api/artigos/:id/curtir</code> (POST)</li>
            <li><code>/api/comentarios/:slug</code> (GET/POST)</li>
        </ul>
        <p><a href="https://site-yan-renat-advocacia.vercel.app">← Ir para o site principal</a></p>
    </div>
</body>
</html>`);
});

module.exports = app;
