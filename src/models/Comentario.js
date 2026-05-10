const mongoose = require('mongoose');

const ComentarioSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true
    },
    nome: {
        type: String,
        required: true
    },
    texto: {
        type: String,
        required: true
    },
    data: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Comentario', ComentarioSchema);
