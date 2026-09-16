const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Daftar server Piped Publik (Sangat stabil & anti-blokir IP cloud)
const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.smnz.de'
];

async function getYoutubeData(videoId) {
    for (const instance of PIPED_INSTANCES) {
        try {
            const res = await fetch(`${instance}/streams/${videoId}`);
            if (!res.ok) continue;
            
            const data = await res.json();
            if (data && data.audioStreams && data.audioStreams.length > 0) {
                // Cari kualitas audio m4a/mp4 (paling kompatibel dan ringan untuk web player)
                const bestAudio = data.audioStreams.find(s => s.mimeType.includes('mp4') || s.mimeType.includes('m4a')) || data.audioStreams[0];
                return {
                    url: bestAudio.url,
                    duration: data.duration
                };
            }
        } catch (e) {
            console.error(`Error dari ${instance}:`, e.message);
        }
    }
    throw new Error('Semua Piped API gagal merespons');
}

// ENDPOINT 1: Untuk Download (Menyimpan lagu ke aplikasi)
app.get('/download', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).json({ success: false, error: 'Video ID kosong' });

    try {
        const ytData = await getYoutubeData(videoId);
        
        return res.json({
            success: true,
            // KUNCI UTAMA: Kita simpan URL proxy internal kita ke HP, BUKAN url asli YouTube!
            link: `https://nf-music-server-production.up.railway.app/stream?id=${videoId}`,
            duration: ytData.duration || 210
        });
    } catch (err) {
        console.error("Gagal Download:", err.message);
        return res.status(500).json({ success: false, error: 'Gagal memproses audio dari server YouTube.' });
    }
});

// ENDPOINT 2: Proxy Dinamis (Mencegah lagu tidak bisa diputar karena kedaluwarsa)
app.get('/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).send('Video ID kosong');

    try {
        // Setiap kali tombol "Play" ditekan di aplikasi, backend akan mencari link fresh instan
        const ytData = await getYoutubeData(videoId);
        
        // Redirect browser HTTP 302 agar player langsung memutar stream audio yang baru
        res.redirect(ytData.url);
    } catch (err) {
        console.error("Gagal Stream:", err.message);
        res.status(500).send('Gagal memutar audio, server YouTube sibuk.');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Backend berjalan di port ${PORT}`);
});
