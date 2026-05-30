const express = require('express');
const { body, param } = require('express-validator');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const Artigo = require('../models/Artigo');
const Comentario = require('../models/Comentario');
const connectDB = require('../middleware/connectDB');
const validate = require('../middleware/validate');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisicoes de escrita. Tente novamente em alguns minutos.' }
});

// ---- Listar comentarios por slug (com paginacao) ----
router.get('/:slug',
    param('slug').trim().notEmpty().withMessage('Slug e obrigatorio'),
    validate,
    connectDB,
    async (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
            const skip = (page - 1) * limit;

            const filtro = { slug: req.params.slug };
            const [comentarios, total] = await Promise.all([
                Comentario.find(filtro)
                    .sort({ data: -1 })
                    .skip(skip)
                    .limit(limit)
                    .select('slug nome texto data _id')
                    .lean(),
                Comentario.countDocuments(filtro)
            ]);

            res.json({
                comments: comentarios,
                paginacao: { page, limit, total, pages: Math.ceil(total / limit) }
            });
        } catch (err) {
            console.error('Erro ao listar comentarios:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// ---- Criar comentario ----
// Gera um autorToken unico e retorna ao frontend.
// O frontend deve guardar esse token (localStorage) para poder deletar depois.
router.post('/:slug',
    param('slug').trim().notEmpty().withMessage('Slug e obrigatorio'),
    body('nome')
        .trim()
        .notEmpty().withMessage('Nome e obrigatorio')
        .isLength({ max: 100 }).withMessage('Nome deve ter no maximo 100 caracteres')
        .escape(),
    body('texto')
        .trim()
        .notEmpty().withMessage('Texto e obrigatorio')
        .isLength({ max: 2000 }).withMessage('Texto deve ter no maximo 2000 caracteres')
        .escape(),
    validate,
    writeLimiter,
    connectDB,
    async (req, res) => {
        try {
            // Verifica se o artigo existe
            const artigo = await Artigo.findOne({ slug: req.params.slug });
            if (!artigo) return res.status(404).json({ error: 'Artigo nao encontrado' });

            const autorToken = crypto.randomUUID();

            const comentario = await Comentario.create({
                slug: req.params.slug,
                nome: req.body.nome,
                texto: req.body.texto,
                autorToken,
                ip: req.headers['x-forwarded-for'] || req.ip || ''
            });

            // Retorna o autorToken para o frontend guardar
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
            console.error('Erro ao criar comentario:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// ---- Excluir comentario ----
// Aceita token do autor via:
//   - Header: x-autor-token
//   - Body:   autorToken
// Admin pode deletar qualquer comentario via header x-admin-key.
// Comentarios antigos (sem autorToken) so podem ser deletados pelo admin.
router.delete('/:id',
    param('id').isMongoId().withMessage('ID invalido'),
    validate,
    connectDB,
    async (req, res) => {
        try {
            const comentario = await Comentario.findById(req.params.id);
            if (!comentario) {
                return res.status(404).json({ error: 'Comentario nao encontrado' });
            }

            // Admin pode deletar qualquer comentario
            if (isAdmin(req)) {
                await Comentario.findByIdAndDelete(req.params.id);
                return res.json({ message: 'Comentario removido (admin)' });
            }

            // Busca o token do autor no header OU no body (compatibilidade)
            const autorToken = req.headers['x-autor-token'] || req.body.autorToken || '';

            // Comentarios antigos sem autorToken so podem ser apagados pelo admin
            if (!comentario.autorToken) {
                return res.status(403).json({
                    error: 'Este comentario so pode ser removido pelo administrador do site'
                });
            }

            // Sem token enviado
            if (!autorToken) {
                return res.status(401).json({
                    error: 'Token de autor ou chave de admin necessarios para excluir'
                });
            }

            // Token nao confere
            if (autorToken !== comentario.autorToken) {
                return res.status(403).json({
                    error: 'Voce nao tem permissao para excluir este comentario'
                });
            }

            await Comentario.findByIdAndDelete(req.params.id);
            res.json({ message: 'Comentario removido' });
        } catch (err) {
            console.error('Erro ao excluir comentario:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

module.exports = router;
