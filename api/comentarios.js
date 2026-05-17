import mongoose from 'mongoose';
import Comentario from '../models/Comentario.js';

const MONGODB_URI = process.env.MONGODB_URI;

export default async function handler(req, res) {
    await mongoose.connect(MONGODB_URI);

    if (req.method === 'GET') {
        const { slug } = req.query;
        if (!slug) return res.status(400).json({ message: 'Slug é obrigatório' });
        const comentarios = await Comentario.find({ slug }).sort({ data: -1 }).lean();
        return res.status(200).json({ comments: comentarios });
    }

    if (req.method === 'POST') {
        // Usa os mesmos nomes de campo que o frontend envia: nome, texto
        const { slug, nome, texto, autorId } = req.body;
        if (!slug || !nome || !texto) {
            return res.status(400).json({ message: 'Campos obrigatórios: slug, nome, texto' });
        }
        const comentario = await Comentario.create({
            slug,
            nome,
            texto,
            autorId: autorId || '',
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });
        return res.status(201).json({ comment: comentario });
    }

    return res.status(405).json({ message: 'Método não permitido' });
}