const mongoose = require('mongoose');

const ArtigoSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
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
        default: Date.now
    }
});

module.exports = mongoose.model('Artigo', ArtigoSchema);
