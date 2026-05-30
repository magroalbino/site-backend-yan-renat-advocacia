const mongoose = require('mongoose');

const ArtigoSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    descricao: {
        type: String,
        required: true
    },
    conteudo: {
        type: String,
        required: true
    },
    autor: {
        type: String,
        default: 'Yan Renat'
    },
    data: {
        type: Date,
        default: Date.now,
        index: -1
    },
    curtidas: {
        type: Number,
        default: 0
    }
});

// Indice de texto para busca por palavras-chave
ArtigoSchema.index({ titulo: 'text', descricao: 'text', conteudo: 'text' }, {
    weights: { titulo: 10, descricao: 5, conteudo: 1 },
    name: 'busca_textual',
    default_language: 'portuguese'
});

module.exports = mongoose.model('Artigo', ArtigoSchema);