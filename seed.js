const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Erro: MONGODB_URI não definida no arquivo .env');
    process.exit(1);
}

const Artigos = [
    {
        titulo: 'Aposentadoria por Idade: Novas Regras e Cálculo Atualizado',
        slug: 'aposentadoria-idade-novas-regras',
        descricao: 'Entenda as mudanças recentes na aposentadoria por idade e como se planejar para garantir o benefício integral.',
        conteudo: `A Reforma da Previdência trouxe alterações significativas para quem busca a aposentadoria por idade. É fundamental que o trabalhador esteja atento às novas exigências de idade mínima e tempo de contribuição.\n\nAtualmente, a idade mínima para homens é de 65 anos e para mulheres 62 anos, com pelo menos 15 anos de contribuição. No entanto, regras de transição podem beneficiar quem já estava próximo de se aposentar antes da reforma.\n\nNosso escritório realiza um planejamento previdenciário completo, analisando seu extrato CNIS para identificar períodos que podem ser aproveitados e garantir o melhor benefício possível.`,
        autor: 'Yan Renat',
        data: new Date('2026-05-01'),
        curtidas: 0
    },
    {
        titulo: 'Vistos e Residência Permanente: Guia para Estrangeiros no Brasil',
        slug: 'vistos-residencia-permanente-brasil',
        descricao: 'Conheça os principais tipos de visto e os caminhos para obter residência permanente no Brasil de forma segura e legal.',
        conteudo: `O Direito Migratório brasileiro passou por uma modernização com a Nova Lei de Migração. Hoje, o processo de regularização é mais humanizado, mas ainda exige atenção a prazos e documentação específica.\n\nExistem diversas modalidades de visto, como o VITEM (trabalho, estudo, investimento) e o VIVIS, este último voltado para assistência humanitária. Após determinado período de residência legal, é possível solicitar a naturalização ou a residência permanente.\n\nPrestamos assessoria completa em processos de imigração, desde a análise do melhor visto até o acompanhamento junto às autoridades consulares e Polícia Federal.`,
        autor: 'Yan Renat',
        data: new Date('2026-05-05'),
        curtidas: 0
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');

        // Remove todos os artigos existentes
        await mongoose.connection.db.collection('artigos').deleteMany({});
        console.log('🗑️ Artigos antigos removidos');

        // Insere os novos artigos
        const result = await mongoose.connection.db.collection('artigos').insertMany(Artigos);
        console.log(`📄 ${result.insertedCount} novos artigos inseridos:`);
        result.insertedIds.forEach((id, index) => {
            console.log(`  - ${Artigos[index].titulo} (slug: ${Artigos[index].slug})`);
        });

        await mongoose.disconnect();
        console.log('🔌 Conexão encerrada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao executar seed:', error);
        process.exit(1);
    }
}

seed();