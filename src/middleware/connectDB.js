const mongoose = require('mongoose');

async function connectDB(req, res, next) {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI);
        }
        next();
    } catch (err) {
        console.error('Erro ao conectar ao MongoDB:', err.message);
        res.status(503).json({ error: 'Servico temporariamente indisponivel' });
    }
}

module.exports = connectDB;