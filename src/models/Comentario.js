const mongoose = require('mongoose');

const ComentarioSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        index: true
    },
    nome: {
        type: String,
        required: true,
        maxlength: 100
    },
    texto: {
        type: String,
        required: true,
        maxlength: 2000
    },
    data: {
        type: Date,
        default: Date.now
    },
    autorToken: {
        type: String,
        required: true,
        index: true
    },
    ip: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model('Comentario', ComentarioSchema);
