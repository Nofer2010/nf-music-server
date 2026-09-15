const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // atau gunakan built-in fetch di Node.js versi terbaru

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint backend yang akan dipanggil oleh aplikasi Android (Kodular) Abang
app.get('/download', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) {
        return res.status(400).json({ error: 'Video ID tidak ditemukan!' });
    }

    try {
        // API Key Abang disembunyikan di sini (aman dari pencurian pengguna aplikasi)
        const rapidApiKey = '53c605791dmsh9979ea24d3a22a1p1ad067jsnc02231fe6506'; 
        
        const apiResponse = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com',
                'x-rapidapi-key': rapidApiKey
            }
        });

        const data = await apiResponse.json();
        
        if (data.link || data.url) {
            return res.json({
                success: true,
                link: data.link || data.url,
                duration: data.duration || 225
            });
        } else {
            return res.status(500).json({ success: false, error: 'Gagal mengambil tautan audio dari server YouTube.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Backend NF Musik berjalan di port ${PORT}`);
});
