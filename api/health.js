export default function handler(req, res) {
    res.status(200).json({
        status: 'ok',
        message: 'API Yan Renat Advocacia operando corretamente',
        version: '2.3.1'
    });
}