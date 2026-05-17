import mongoose from 'mongoose';
import Comentario from '../models/Comentario.js';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Método não permitido' });
    }
    const { id, autorId } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'ID do comentário é obrigatório' });
    }
    try {
        await mongoose.connect(MONGODB_URI);
        const comentario = await Comentario.findById(id);
        if (!comentario) {
            return res.status(404).json({ message: 'Comentário não encontrado' });
        }
        if (autorId && comentario.autorId && comentario.autorId !== autorId) {
            return res.status(403).json({ message: 'Não autorizado' });
        }
        await Comentario.findByIdAndDelete(id);
        res.status(200).json({ message: 'Comentário removido' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}