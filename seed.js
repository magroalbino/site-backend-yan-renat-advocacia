require('dotenv').config();
const mongoose = require('mongoose');
const Artigo = require('./src/models/Artigo');
const Comentario = require('./src/models/Comentario');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI não definida no .env');
    process.exit(1);
}

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB conectado para seed');

        // Limpar coleções antes de popular
        await Artigo.deleteMany({});
        await Comentario.deleteMany({});
        console.log('🗑️ Coleções limpas');

        // Artigos de exemplo bem fundamentados
        const artigos = [
            {
                titulo: "A Importância do Planejamento Sucessório no Direito Civil",
                slug: "planejamento-sucessorio-direito-civil",
                descricao: "Entenda como o planejamento sucessório pode evitar conflitos familiares e garantir a preservação do patrimônio.",
                conteudo: "O planejamento sucessório tem se tornado um instrumento cada vez mais essencial no Direito Civil contemporâneo. Trata-se de um conjunto de estratégias jurídicas que visam a transferência do patrimônio de uma pessoa após sua morte de maneira organizada e eficiente.\n\nDentre as principais ferramentas, destacam-se o testamento, a doação em vida com reserva de usufruto e a constituição de holdings familiares. A principal vantagem é a redução de custos tributários (ITCMD) e a prevenção de litígios judiciais que podem perdurar por décadas.\n\nÉ fundamental que o planejamento respeite a 'legítima', que é a parte da herança reservada aos herdeiros necessários (descendentes, ascendentes e cônjuge), conforme estabelece o Código Civil Brasileiro.",
                autor: "Yan Renat",
                data: new Date()
            },
            {
                titulo: "Direitos do Trabalhador no Home Office: Legislação Atual",
                slug: "direitos-trabalhador-home-office",
                descricao: "Uma análise detalhada sobre as obrigações das empresas e os direitos dos empregados no regime de teletrabalho.",
                conteudo: "Com a consolidação do teletrabalho, surgiram diversas dúvidas sobre a aplicação da CLT nesse regime. A Lei 14.442/2022 trouxe atualizações importantes sobre o tema.\n\nUm dos pontos centrais é a responsabilidade pela infraestrutura. O empregador deve formalizar em contrato quem arcará com os custos de equipamentos, energia e internet. Além disso, o controle de jornada permanece obrigatório para trabalhadores que recebem por jornada, exceto em casos específicos de contratação por produção ou tarefa.\n\nO direito à desconexão também ganha relevo, garantindo que o trabalhador não seja demandado fora de seu horário de expediente, preservando sua saúde mental e convívio familiar.",
                autor: "Yan Renat",
                data: new Date()
            },
            {
                titulo: "Responsabilidade Civil Médica e o Dever de Informação",
                slug: "responsabilidade-civil-medica",
                descricao: "O papel do Termo de Consentimento Livre e Esclarecido na proteção de médicos e pacientes.",
                conteudo: "A responsabilidade civil dos profissionais de saúde não se limita apenas ao ato cirúrgico ou diagnóstico, mas estende-se ao dever ético e jurídico de informar.\n\nO Superior Tribunal de Justiça (STJ) tem reiterado que a ausência de informação clara sobre os riscos de um procedimento pode gerar o dever de indenizar, mesmo que não haja erro médico técnico. O Termo de Consentimento Livre e Esclarecido (TCLE) é o documento que formaliza essa comunicação.\n\nPara que seja válido, o TCLE não deve ser um formulário genérico, mas sim um documento personalizado que explique de forma acessível as alternativas terapêuticas e os riscos envolvidos, garantindo a autonomia da vontade do paciente.",
                autor: "Yan Renat",
                data: new Date()
            }
        ];

        const artigosCriados = await Artigo.insertMany(artigos);
        console.log(`✅ ${artigosCriados.length} artigos criados`);

        // Comentários de exemplo usando o campo 'slug' conforme o novo modelo
        const comentarios = [
            {
                slug: artigosCriados[0].slug,
                nome: "Dr. Carlos Silva",
                texto: "Excelente abordagem sobre a holding familiar. É um tema muito atual e necessário.",
                data: new Date()
            },
            {
                slug: artigosCriados[1].slug,
                nome: "Mariana Oliveira",
                texto: "Muito esclarecedor! Minha empresa não está pagando a internet, vou conversar com o RH.",
                data: new Date()
            }
        ];

        await Comentario.insertMany(comentarios);
        console.log(`✅ ${comentarios.length} comentários criados`);

        await mongoose.disconnect();
        console.log('🔌 Conexão encerrada');
    } catch (err) {
        console.error('❌ Erro durante o seed:', err);
        process.exit(1);
    }
}

seed();
