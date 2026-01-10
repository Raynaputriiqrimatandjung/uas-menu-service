// menu-service/index.js (Versi MongoDB & Vercel)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(bodyParser.json());

const MONGO_URI = process.env.MONGO_URI || "MASUKKAN_LINK_MONGODB_ANDA_DISINI";

mongoose.connect(MONGO_URI)
    .then(() => console.log('Menu Service: Terhubung ke MongoDB'))
    .catch(err => console.error('Gagal konek MongoDB:', err));

// --- MODEL MENU ---
const MenuSchema = new mongoose.Schema({
    nama: String,
    harga: Number,
    deskripsi: String
});
const Menu = mongoose.model('Menu', MenuSchema);

// --- ROUTES CRUD ---

app.get('/', (req, res) => {
    res.send("Menu Service is Running on Vercel!");
});

// READ
app.get('/menu', async (req, res) => {
    try {
        const menus = await Menu.find();
        res.json(menus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE
app.post('/menu', async (req, res) => {
    try {
        const { nama, harga, deskripsi } = req.body;
        const newMenu = new Menu({ nama, harga, deskripsi });
        await newMenu.save();
        res.json({ message: "Menu berhasil ditambahkan", data: newMenu });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE
app.put('/menu/:id', async (req, res) => {
    try {
        await Menu.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: "Menu berhasil diupdate" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE
app.delete('/menu/:id', async (req, res) => {
    try {
        await Menu.findByIdAndDelete(req.params.id);
        res.json({ message: "Menu berhasil dihapus" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Menu Service running on port ${PORT}`);
});

module.exports = app;