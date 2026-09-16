const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Menggunakan API Key asli Abang (Sangat Stabil & Bebas Blokir Cloudflare)
const RAPID_API_KEY = '53c605791dmsh9979ea24d3a22a1p1ad067jsnc02231fe6506'; 

async function getYoutubeAudio(videoId) {
    // Jalur Utama: RapidAPI
    try {
        const url = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com',
                'x-rapidapi-key': RAPID_API_KEY
            }
        });
        const data = await res.json();
        if (data.link || data.url) return data.link || data.url;
    } catch (e) {
        console.error("RapidAPI Error:", e.message);
    }

    // Jalur Cadangan: Cobalt API Publik (Jika kuota RapidAPI habis)
    try {
        const resCobalt = await fetch('https://cobalt.kwiatekmiki.com/api/json', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}`, isAudioOnly: true })
        });
        const dataCobalt = await resCobalt.json();
        if (dataCobalt.url) return dataCobalt.url;
    } catch(e) {
        console.error("Cobalt API Error:", e.message);
    }
    
    throw new Error("Semua API gagal mengekstrak link audio.");
}

// ENDPOINT 1: Untuk Download
app.get('/download', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ success: false, error: 'Video ID kosong!' });

    try {
        // Cek apakah lagu tersedia
        await getYoutubeAudio(videoId);
        
        // KUNCI ANTI-KADALUARSA: Aplikasi menyimpan link proxy backend, BUKAN link asli YouTube
        return res.json({
            success: true,
            link: `https://nf-music-server-production.up.railway.app/stream?id=${videoId}`,
            duration: 220
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: 'Gagal memproses audio.' });
    }
});

// ENDPOINT 2: Stream Dinamis (Saat tombol Play dipencet)
app.get('/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).send('Video ID kosong');

    try {
        // Ambil token link YouTube terbaru dalam sepersekian detik dan langsung putar
        const audioUrl = await getYoutubeAudio(videoId);
        res.redirect(audioUrl);
    } catch (err) {
        res.status(500).send('Server gagal memutar audio.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Backend berjalan di port ${PORT}`);
});
