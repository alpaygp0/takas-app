// ==========================================
// 1. GEREKLİ PAKETLER
// ==========================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

dotenv.config();

const app = express();

// ==========================================
// 2. GÜVENLİK VE ARA KATMANLAR (KRİTİK GÜNCELLEME)
// ==========================================
// Render ve benzeri proxy arkasında çalışan servisler için rate-limit ayarı
app.set('trust proxy', 1); 

app.use(helmet({
    crossOriginResourcePolicy: false, // Görsellerin frontend'de görünmesi için şart
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Ayarı: Frontend URL'in belli olduğunda burayı kısıtlayacağız.
// Şimdilik testler için her yerden erişime açık (Canlıda risklidir ama başlangıç için OK).
app.use(cors());

// ==========================================
// 3. DDoS KORUMASI (Rate Limiter)
// ==========================================
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Ücretsiz sunucu kaynaklarını korumak için biraz düşürdük
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Çok fazla istek attınız, lütfen biraz dinlenin." }
});
app.use('/api/', generalLimiter);

// ==========================================
// 4. YÜKLENEN GÖRSELLERİ DIŞARI AÇMA
// ==========================================
// Render gibi servislerde 'uploads' klasörü geçicidir. 
// Kalıcı çözüm için ileride Cloudinary/AWS S3 gerekir ama şimdilik devam ediyoruz.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 5. API ROTALARI
// ==========================================
const authRoutes = require('./routes/authRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const aiRoutes = require('./routes/aiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: "🚀 TakasKupon API Motoru Canlıda!" 
    });
});

// ==========================================
// 6. VERİTABANI VE MOTORU ATEŞLEME
// ==========================================
const PORT = process.env.PORT || 5000;

// Bağlantı seçeneklerini modernize ettik
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Veritabanına Bağlanıldı!');
        app.listen(PORT, '0.0.0.0', () => { // '0.0.0.0' dış dünya erişimi için önemli
            console.log(`🚀 Sunucu ${PORT} portunda aktif!`);
            
            try {
                const startCronJobs = require('./utils/cronJobs');
                startCronJobs();
            } catch (error) {
                console.log("ℹ️ CronJob modülü aktif değil.");
            }
        });
    })
    .catch((error) => {
        console.error('❌ MongoDB Hatası:', error.message);
        process.exit(1); 
    });
    module.exports = app;