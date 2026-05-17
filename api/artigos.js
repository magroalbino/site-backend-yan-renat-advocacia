import mongoose from 'mongoose';
import Artigo from '../models/Artigo.js';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método não permitido' });
    }
    try {
        await mongoose.connect(MONGODB_URI);
        const artigos = await Artigo.find()
            .sort({ data: -1 })
            .select('titulo slug descricao data autor curtidas');
        res.status(200).json(artigos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar artigos', error: error.message });
    }
}