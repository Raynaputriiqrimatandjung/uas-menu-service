// menu-service/index.js (Versi Perbaikan & Stabil untuk Vercel)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- KONEKSI MONGODB (Dengan Pengecekan) ---
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ FATAL ERROR: MONGO_URI belum diatur di file .env atau Vercel Environtment Variables.");
}

// Opsi koneksi agar lebih stabil di Vercel
const connectDB = async () => {
    try {
        // Cek jika sudah connect (untuk mencegah koneksi ganda di serverless)
        if (mongoose.connection.readyState === 1) {
            return;
        }
        await mongoose.connect(MONGO_URI);
        console.log('✅ Menu Service: Terhubung ke MongoDB');
    } catch (err) {
        console.error('❌ Gagal konek MongoDB:', err);
    }
};

// Panggil koneksi
connectDB();

// --- MODEL DATABASE (Schema Diperketat) ---
const MenuSchema = new mongoose.Schema({
    nama: { 
        type: String, 
        required: [true, 'Nama menu wajib diisi'] 
    },
    harga: { 
        type: Number, 
        required: [true, 'Harga wajib diisi'] 
    },
    deskripsi: { 
        type: String,
        required: false // Deskripsi boleh kosong
    }
});
const Menu = mongoose.model('Menu', MenuSchema);

// --- ROUTES CRUD ---

// Health Check
app.get('/', (req, res) => {
    res.send("Menu Service is Running on Vercel!");
});

// READ (Ambil Semua Menu)
app.get('/menu', async (req, res) => {
    try {
        await connectDB(); // Pastikan koneksi aktif
        const menus = await Menu.find();
        res.json(menus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE (Tambah Menu)
app.post('/menu', async (req, res) => {
    try {
        await connectDB();
        const { nama, harga, deskripsi } = req.body;

        // Validasi manual sederhana
        if (!nama || !harga) {
            return res.status(400).json({ message: "Nama dan Harga tidak boleh kosong" });
        }

        const newMenu = new Menu({ nama, harga, deskripsi });
        await newMenu.save();
        
        console.log("Menu baru ditambahkan:", nama);
        res.json({ message: "Menu berhasil ditambahkan", data: newMenu });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE (Edit Menu)
app.put('/menu/:id', async (req, res) => {
    try {
        await connectDB();
        // { new: true } agar data yang dikembalikan adalah data SETELAH diedit
        const updatedMenu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!updatedMenu) {
            return res.status(404).json({ message: "Menu tidak ditemukan" });
        }

        res.json({ message: "Menu berhasil diupdate", data: updatedMenu });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE (Hapus Menu)
app.delete('/menu/:id', async (req, res) => {
    try {
        await connectDB();
        const deletedMenu = await Menu.findByIdAndDelete(req.params.id);

        if (!deletedMenu) {
            return res.status(404).json({ message: "Menu tidak ditemukan (Mungkin sudah dihapus)" });
        }

        res.json({ message: "Menu berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Jalankan Server (Hanya untuk Localhost)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Menu Service running on port ${PORT}`);
    });
}

// Export module untuk Vercel
module.exports = app;