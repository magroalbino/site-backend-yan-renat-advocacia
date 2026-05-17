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
        const artigo = await Artigo.findById(id);
        if (!artigo) {
            return res.status(404).json({ message: 'Artigo não encontrado' });
        }
        if (artigo.curtidas <= 0) {
            return res.status(400).json({ message: 'Não é possível descurtir, zero curtidas.' });
        }
        artigo.curtidas -= 1;
        await artigo.save();
        res.status(200).json({ curtidas: artigo.curtidas });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}