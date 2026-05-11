const express = require('express');
const { body, validationResult } = require('express-validator');
const Comentario = require('../models/Comentario');
const ensureDb = require('../middleware/ensureDb');

const router = express.Router();

// Aplica ensureDb a todas as rotas deste router
router.use(ensureDb);

/**
 * GET /api/comentarios/:slug
 * Retorna todos os comentários do artigo, incluindo o _id de cada um.
 */
router.get('/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;
        if (!slug) return res.status(400).json({ message: 'Slug é obrigatório' });

        const comentarios = await Comentario.find({ slug })
            .sort({ data: -1 })
            // removido .select() para retornar o documento completo (inclui _id)
            .lean();

        return res.status(200).json({ comments: comentarios });
    } catch (err) {
        console.error('Erro ao buscar comentários:', err);
        return res.status(500).json({ message: 'Erro ao buscar comentários', error: err.message });
    }
});

/**
 * POST /api/comentarios/:slug
 */
router.post(
    '/:slug',
    [
        body('nome').trim().isLength({ min: 2 }).withMessage('Nome inválido'),
        body('texto').trim().isLength({ min: 2 }).withMessage('Comentário inválido')
    ],
    async (req, res) => {
        try {
            const slug = req.params.slug;
            if (!slug) return res.status(400).json({ message: 'Slug é obrigatório' });

            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

            const payload = {
                slug,
                nome: req.body.nome,
                texto: req.body.texto,
                ip: req.ip
            };

            const comentario = await Comentario.create(payload);
            return res.status(201).json({ comment: comentario });
        } catch (err) {
            console.error('Erro ao criar comentário:', err);
            return res.status(500).json({ message: 'Erro ao criar comentário', error: err.message });
        }
    }
);

// DELETE /api/comentarios/:id
router.delete('/:id', async (req, res) => {
    try {
        const comentario = await Comentario.findByIdAndDelete(req.params.id);
        if (!comentario) {
            return res.status(404).json({ message: 'Comentário não encontrado' });
        }
        res.json({ message: 'Comentário removido com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir comentário:', err);
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;