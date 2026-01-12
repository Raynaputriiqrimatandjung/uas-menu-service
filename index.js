// menu-service/index.js (FINAL REFACTOR)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json());

// --- KONEKSI MONGODB ---
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ FATAL ERROR: MONGO_URI belum diatur.");
}

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) return;
        await mongoose.connect(MONGO_URI);
        console.log('✅ Menu Service: Terhubung ke MongoDB');
    } catch (err) {
        console.error('❌ Gagal konek MongoDB:', err);
    }
};
connectDB();

// --- MODEL DATABASE (UPDATED SCHEMA) ---
// Kita tambahkan 'gambar' dan 'kategori' agar frontend tidak error
const MenuSchema = new mongoose.Schema({
    nama: { type: String, required: true },
    harga: { type: Number, required: true },
    deskripsi: { type: String, default: '' },
    // Field Baru untuk mendukung UI/UX Modern
    gambar: { type: String, default: '' }, 
    kategori: { type: String, default: 'Makanan' },
    status: { type: String, default: 'tersedia' }
});

const Menu = mongoose.model('Menu', MenuSchema);

// --- ROUTES ---

app.get('/', (req, res) => res.send("Menu Service Ready 🚀"));

// 1. READ ALL (Diurutkan dari terbaru)
app.get('/menu', async (req, res) => {
    try {
        await connectDB();
        // sort({ _id: -1 }) agar menu baru muncul paling atas
        const menus = await Menu.find().sort({ _id: -1 });
        res.json(menus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. CREATE (Dengan Auto-Fix Data Kosong)
app.post('/menu', async (req, res) => {
    try {
        await connectDB();
        const { nama, harga, deskripsi, gambar, kategori } = req.body;

        // Validasi Dasar
        if (!nama || !harga) {
            return res.status(400).json({ message: "Nama dan Harga wajib diisi!" });
        }

        // Logic Default Value (Pencegah Crash Frontend)
        // Jika gambar kosong/pendek, pakai gambar placeholder
        const finalGambar = (gambar && gambar.length > 10) 
            ? gambar 
            : 'https://placehold.co/400x300?text=Menu+Lezat';
        
        const finalDeskripsi = deskripsi || 'Menu spesial rekomendasi kami.';
        const finalKategori = kategori || 'Makanan';

        const newMenu = new Menu({
            nama,
            harga: Number(harga),
            deskripsi: finalDeskripsi,
            gambar: finalGambar,
            kategori: finalKategori,
            status: 'tersedia'
        });

        await newMenu.save();
        res.status(201).json({ message: "Berhasil disimpan", data: newMenu });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. DELETE
app.delete('/menu/:id', async (req, res) => {
    try {
        await connectDB();
        await Menu.findByIdAndDelete(req.params.id);
        res.json({ message: "Menu dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

if (require.main === module) {
    app.listen(PORT, () => console.log(`🚀 Menu Service running on port ${PORT}`));
}

module.exports = app;