const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 1. KONFIGURASI CLOUDINARY ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- 2. KONFIGURASI MULTER (Upload ke RAM sementara) ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- KONEKSI MONGODB ---
const MONGO_URI = process.env.MONGO_URI;
const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) return;
        await mongoose.connect(MONGO_URI);
        console.log('✅ Menu Service: Terhubung ke MongoDB');
    } catch (err) { console.error('❌ Gagal konek MongoDB:', err); }
};
connectDB();

// --- MODEL ---
const Menu = mongoose.model('Menu', new mongoose.Schema({
    nama: { type: String, required: true },
    harga: { type: Number, required: true },
    deskripsi: { type: String, default: '' },
    gambar: { type: String, default: '' }, 
    kategori: { type: String, default: 'Makanan' },
    status: { type: String, default: 'tersedia' }
}));

// --- HELPER: Upload ke Cloudinary ---
async function handleImageUpload(file) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "kantinku_menu" }, 
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        uploadStream.end(file.buffer);
    });
}

// --- ROUTES ---

app.get('/', (req, res) => res.send("Menu Service Upload Ready 🚀"));

app.get('/menu', async (req, res) => {
    await connectDB();
    const menus = await Menu.find().sort({ _id: -1 });
    res.json(menus);
});

// CREATE (Support File Upload)
app.post('/menu', upload.single('gambarFile'), async (req, res) => {
    try {
        await connectDB();
        let { nama, harga, deskripsi, kategori, gambarUrlManual } = req.body;
        
        let finalGambar = gambarUrlManual || 'https://placehold.co/400x300?text=Menu+Lezat';

        if (req.file) {
            console.log("📤 Mengupload gambar...");
            finalGambar = await handleImageUpload(req.file);
        }

        const newMenu = new Menu({
            nama, harga: Number(harga), deskripsi, gambar: finalGambar, kategori, status: 'tersedia'
        });

        await newMenu.save();
        res.status(201).json({ message: "Berhasil disimpan", data: newMenu });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE (Support File Upload)
app.put('/menu/:id', upload.single('gambarFile'), async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        let { nama, harga, deskripsi, kategori, status, gambarUrlManual } = req.body;
        let updateData = { nama, harga, deskripsi, kategori, status };

        if (req.file) {
            const newImageUrl = await handleImageUpload(req.file);
            updateData.gambar = newImageUrl;
        } else if (gambarUrlManual && gambarUrlManual.trim() !== "") {
            updateData.gambar = gambarUrlManual;
        }

        const updatedMenu = await Menu.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedMenu) return res.status(404).json({ message: "Menu tidak ditemukan" });
        
        res.json({ message: "Menu berhasil diperbarui", data: updatedMenu });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/menu/:id', async (req, res) => {
    await connectDB();
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: "Menu dihapus" });
});

if (require.main === module) {
    app.listen(PORT, () => console.log(`🚀 Service running on port ${PORT}`));
}
module.exports = app;