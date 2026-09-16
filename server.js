const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Fungsi otomatis mencari link baru jika yang lama mati (Anti Kadaluarsa)
async function getFreshStreamUrl(videoId) {
    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    try {
        const res1 = await fetch(`https://api.agatz.xyz/api/ytmp3?url=${encodeURIComponent(ytUrl)}`);
        const data1 = await res1.json();
        if (data1?.data?.download) return data1.data.download;
    } catch (e) {}

    try {
        const res2 = await fetch(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(ytUrl)}`);
        const data2 = await res2.json();
        if (data2?.data?.dl) return data2.data.dl;
    } catch (e) {}

    throw new Error('Semua API Publik Sedang Sibuk');
}

app.get('/download', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ success: false, error: 'Video ID tidak ditemukan!' });

    try {
        // Cek ketersediaan lagu terlebih dahulu
        await getFreshStreamUrl(videoId);
        
        // KUNCI: Jangan kasih link YouTube asli ke aplikasi, kasih link proxy backend kita sendiri!
        return res.json({
            success: true,
            link: `https://nf-music-server-production.up.railway.app/stream?id=${videoId}`,
            duration: 210
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Gagal memproses audio dari server YouTube.' });
    }
});

// Endpoint Proxy untuk memutar lagu kapan saja tanpa takut link mati
app.get('/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).send('Video ID kosong');

    try {
        // Ambil link stream terbaru dari YouTube secara real-time
        const freshUrl = await getFreshStreamUrl(videoId);
        // Alihkan (Redirect) pemutar musik langsung ke link baru tersebut
        res.redirect(freshUrl);
    } catch (err) {
        res.status(500).send('Gagal memutar audio, server YouTube sibuk.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Backend berjalan di port ${PORT}`);
});
