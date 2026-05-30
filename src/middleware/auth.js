// Verifica se a requisicao vem de um admin (API Key)
function isAdmin(req) {
    const adminKey = req.headers['x-admin-key'];
    return adminKey && process.env.ADMIN_API_KEY && adminKey === process.env.ADMIN_API_KEY;
}

// Middleware que bloqueia se nao for admin
function requireAdmin(req, res, next) {
    if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Acesso restrito ao administrador' });
    }
    next();
}

module.exports = { isAdmin, requireAdmin };