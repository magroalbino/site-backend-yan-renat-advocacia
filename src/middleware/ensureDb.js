const connectDB = require('../config/database');

const ensureDb = async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection error in middleware:', error);
        res.status(500).json({ message: 'Erro de conexão com o banco de dados' });
    }
};

module.exports = ensureDb;
