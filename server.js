const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint backend NF Musik Player
app.get('/download', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) {
        return res.status(400).json({ success: false, error: 'Video ID tidak ditemukan!' });
    }

    try {
        const videoURL = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Memastikan validitas video sebelum ditarik audionya
        if (!ytdl.validateID(videoId) && !ytdl.validateURL(videoURL)) {
            return res.status(400).json({ success: false, error: 'URL atau ID YouTube tidak valid!' });
        }

        const info = await ytdl.getInfo(videoURL);
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        
        if (audioFormats.length === 0) {
            return res.status(500).json({ success: false, error: 'Format audio tidak ditemukan.' });
        }

        // Ambil direct stream link kualitas terbaik yang aktif
        const bestAudio = audioFormats[0];
        const durationSec = parseInt(info.videoDetails.lengthSeconds) || 200;

        return res.json({
            success: true,
            link: bestAudio.url,
            duration: durationSec
        });

    } catch (err) {
        console.error("Error backend download:", err.message);
        return res.status(500).json({ 
            success: false, 
            error: 'Gagal memproses audio dari server YouTube. Silakan coba lagu lain.' 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Backend NF Musik berjalan di port ${PORT}`);
});
