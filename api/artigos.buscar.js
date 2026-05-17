import mongoose from 'mongoose';
import Artigo from '../models/Artigo.js';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método não permitido' });
    }
    const { slug } = req.query;
    if (!slug) {
        return res.status(400).json({ message: 'Parâmetro slug é obrigatório' });
    }
    try {
        await mongoose.connect(MONGODB_URI);
        const artigo = await Artigo.findOne({ slug });
        if (!artigo) {
            return res.status(404).json({ message: 'Artigo não encontrado' });
        }
        res.status(200).json(artigo);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar artigo', error: error.message });
    }
}