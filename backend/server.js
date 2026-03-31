const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');

dotenv.config();
const app = express();

// Vercel/Proxy Güvenliği
app.set('trust proxy', 1); 

// Helmet Ayarı (Resimlerin görünmesi için Cross-Origin kuralını gevşettik)
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Statik Dosyalar (Manuel yüklenenler için - Geçici)
app.use('/uploads', express.static(path.join(process.cwd(), 'backend', 'uploads')));

// Rotalar
const authRoutes = require('./routes/authRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const aiRoutes = require('./routes/aiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ai', aiRoutes);

// Test Rotası
app.get('/api/health', (req, res) => {
    res.json({ status: "ok", message: "TakasKupon API Online" });
});

// Veritabanı Bağlantısı (Vercel'de bağlantı açık tutulur)
let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ DB Error:", err);
    }
};

// Her istekte DB bağlantısını kontrol et (Vercel için en sağlıklı yol)
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// Yerel sunucuda çalışması için (npm run dev)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Local server on ${PORT}`));
}

module.exports = app; // Vercel için kritik
