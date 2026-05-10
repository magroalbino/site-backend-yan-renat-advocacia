require('dotenv').config();
const app = require('./src/app');

// Para rodar localmente
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor local rodando na porta ${PORT}`);
    });
}

// Exporta para a Vercel
module.exports = app;
