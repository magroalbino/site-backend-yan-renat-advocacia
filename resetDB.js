require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function reset() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Zera curtidas de todos os artigos
    const resultArtigos = await mongoose.connection.db.collection('artigos').updateMany(
        {},
        { $set: { curtidas: 0 } }
    );
    console.log(`🔄 Curtidas zeradas em ${resultArtigos.modifiedCount} artigo(s).`);

    // Remove todos os comentários
    const resultComentarios = await mongoose.connection.db.collection('comentarios').deleteMany({});
    console.log(`🗑️ ${resultComentarios.deletedCount} comentário(s) removido(s).`);

    await mongoose.disconnect();
    console.log('🔌 Desconectado.');
    process.exit(0);
}

reset().catch(err => {
    console.error('❌ Erro:', err);
    process.exit(1);
});