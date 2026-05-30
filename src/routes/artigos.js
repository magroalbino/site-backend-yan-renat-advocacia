const express = require('express');
const { param, query } = require('express-validator');
const Artigo = require('../models/Artigo');
const connectDB = require('../middleware/connectDB');
const validate = require('../middleware/validate');
const { requireAdmin } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisicoes de escrita. Tente novamente em alguns minutos.' }
});

// ---- Listar artigos (com paginacao) ----
router.get('/', connectDB, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [artigos, total] = await Promise.all([
            Artigo.find()
                .sort({ data: -1 })
                .skip(skip)
                .limit(limit)
                .select('titulo slug descricao data autor curtidas conteudo'),
            Artigo.countDocuments()
        ]);

        res.json({
            artigos,
            paginacao: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Erro ao listar artigos:', err.message);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ---- Buscar artigos por palavra-chave ----
router.get('/buscar',
    query('q').trim().notEmpty().withMessage('Parametro de busca "q" e obrigatorio'),
    validate,
    connectDB,
    async (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
            const skip = (page - 1) * limit;

            const filtro = { $text: { $search: req.query.q } };
            const [artigos, total] = await Promise.all([
                Artigo.find(filtro, { score: { $meta: 'textScore' } })
                    .sort({ score: { $meta: 'textScore' } })
                    .skip(skip)
                    .limit(limit)
                    .select('titulo slug descricao data autor curtidas'),
                Artigo.countDocuments(filtro)
            ]);

            res.json({
                artigos,
                paginacao: { page, limit, total, pages: Math.ceil(total / limit) }
            });
        } catch (err) {
            console.error('Erro ao buscar artigos:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// ---- Buscar artigo por slug ----
router.get('/:slug',
    param('slug').trim().notEmpty().withMessage('Slug e obrigatorio'),
    validate,
    connectDB,
    async (req, res) => {
        try {
            const artigo = await Artigo.findOne({ slug: req.params.slug });
            if (!artigo) return res.status(404).json({ error: 'Artigo nao encontrado' });
            res.json(artigo);
        } catch (err) {
            console.error('Erro ao buscar artigo:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// ---- Curtir artigo (atomico) ----
router.post('/:id/curtir',
    param('id').isMongoId().withMessage('ID invalido'),
    validate,
    writeLimiter,
    connectDB,
    async (req, res) => {
        try {
            const artigo = await Artigo.findByIdAndUpdate(
                req.params.id,
                { $inc: { curtidas: 1 } },
                { new: true }
            );
            if (!artigo) return res.status(404).json({ error: 'Artigo nao encontrado' });
            res.json({ curtidas: artigo.curtidas });
        } catch (err) {
            console.error('Erro ao curtir:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// ---- Descurtir artigo (atomico, previne negativo) ----
router.post('/:id/descurtir',
    param('id').isMongoId().withMessage('ID invalido'),
    validate,
    writeLimiter,
    connectDB,
    async (req, res) => {
        try {
            const artigo = await Artigo.findOneAndUpdate(
                { _id: req.params.id, curtidas: { $gt: 0 } },
                { $inc: { curtidas: -1 } },
                { new: true }
            );
            if (!artigo) {
                const existe = await Artigo.findById(req.params.id);
                if (!existe) return res.status(404).json({ error: 'Artigo nao encontrado' });
                return res.status(400).json({ error: 'Artigo ja esta com zero curtidas' });
            }
            res.json({ curtidas: artigo.curtidas });
        } catch (err) {
            console.error('Erro ao descurtir:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// ---- ADMIN: Criar artigo ----
router.post('/',
    requireAdmin,
    connectDB,
    async (req, res) => {
        try {
            const { titulo, slug, descricao, conteudo, autor } = req.body;
            if (!titulo || !slug || !descricao || !conteudo) {
                return res.status(400).json({ error: 'Campos obrigatorios: titulo, slug, descricao, conteudo' });
            }

            const existe = await Artigo.findOne({ slug });
            if (existe) return res.status(409).json({ error: 'Ja existe um artigo com este slug' });

            const artigo = await Artigo.create({ titulo, slug, descricao, conteudo, autor });
            res.status(201).json(artigo);
        } catch (err) {
            console.error('Erro ao criar artigo:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// ---- ADMIN: Atualizar artigo ----
router.put('/:id',
    param('id').isMongoId().withMessage('ID invalido'),
    validate,
    requireAdmin,
    connectDB,
    async (req, res) => {
        try {
            const { titulo, slug, descricao, conteudo, autor } = req.body;
            const artigo = await Artigo.findByIdAndUpdate(
                req.params.id,
                { titulo, slug, descricao, conteudo, autor },
                { new: true, runValidators: true }
            );
            if (!artigo) return res.status(404).json({ error: 'Artigo nao encontrado' });
            res.json(artigo);
        } catch (err) {
            console.error('Erro ao atualizar artigo:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

// ---- ADMIN: Deletar artigo ----
router.delete('/:id',
    param('id').isMongoId().withMessage('ID invalido'),
    validate,
    requireAdmin,
    connectDB,
    async (req, res) => {
        try {
            const artigo = await Artigo.findByIdAndDelete(req.params.id);
            if (!artigo) return res.status(404).json({ error: 'Artigo nao encontrado' });
            res.json({ message: 'Artigo removido' });
        } catch (err) {
            console.error('Erro ao deletar artigo:', err.message);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
);

module.exports = router;
