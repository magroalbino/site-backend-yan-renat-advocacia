import mongoose from 'mongoose';
import Artigo from '../models/Artigo.js';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido' });
    }
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'ID do artigo é obrigatório' });
    }
    try {
        await mongoose.connect(MONGODB_URI);
        const artigo = await Artigo.findByIdAndUpdate(
            id,
            { $inc: { curtidas: 1 } },
            { new: true }
        );
        if (!artigo) {
            return res.status(404).json({ message: 'Artigo não encontrado' });
        }
        res.status(200).json({ curtidas: artigo.curtidas });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}