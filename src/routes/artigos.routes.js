const express = require('express');
const Artigo = require('../models/Artigo');
const ensureDb = require('../middleware/ensureDb');

const router = express.Router();

router.use(ensureDb);

// Listar todos os artigos (apenas campos essenciais para os cards)
router.get('/', async (req, res) => {
    try {
        const artigos = await Artigo.find()
            .sort({ data: -1 })
            .select('titulo slug descricao data autor');
        res.json(artigos);
    } catch (err) {
        console.error('Erro ao listar artigos:', err);
        res.status(500).json({ message: 'Erro ao listar artigos', error: err.message });
    }
});

// Buscar artigo por slug (retorna o documento completo)
router.get('/:slug', async (req, res) => {
    try {
        const artigo = await Artigo.findOne({ slug: req.params.slug });
        if (!artigo) {
            return res.status(404).json({ message: 'Artigo não encontrado' });
        }
        res.json(artigo);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar artigo', error: err.message });
    }
});

// Curtir um artigo (incrementa o contador)
router.post('/:id/curtir', async (req, res) => {
    try {
        const artigo = await Artigo.findByIdAndUpdate(
            req.params.id,
            { $inc: { curtidas: 1 } },
            { new: true }
        );
        if (!artigo) {
            return res.status(404).json({ message: 'Artigo não encontrado' });
        }
        res.json({ curtidas: artigo.curtidas });
    } catch (err) {
        console.error('Erro ao curtir artigo:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;