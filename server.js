require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

// Graceful shutdown
function shutdown(signal) {
    console.log(`${signal} recebido. Encerrando servidor...`);
    server.close(async () => {
        await mongoose.connection.close();
        console.log('Conexões encerradas.');
        process.exit(0);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
