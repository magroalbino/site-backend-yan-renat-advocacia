// lib/mongoose.js
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error('MONGODB_URI não definido');
}

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

async function connectToDatabase() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).then(m => m);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

module.exports = connectToDatabase;
