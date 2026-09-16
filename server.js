const express = require('express');
const cors = require('cors');
// Pastikan node-fetch sudah ada di package.json (sebelumnya sudah ada)
const fetch = require('node-fetch'); 

const app = express();
app.use(cors());
app.use(express.json());

app.get('/download', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) {
        return res.status(400).json({ success: false, error: 'Video ID tidak ditemukan!' });
    }

    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    try {
        // JALUR 1: Menggunakan API Publik Ryzendesu (Sangat stabil & bebas limit)
        const response = await fetch(`https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(ytUrl)}`);
        const data = await response.json();

        // Mencari link audio di dalam respons JSON
        let downloadUrl = data?.url || data?.data?.url || (data?.data && data.data[0]?.url);

        if (downloadUrl) {
            return res.json({
                success: true,
                link: downloadUrl,
                duration: 225 // Estimasi durasi default
            });
        }
        throw new Error("Link audio gagal didapatkan dari API Utama.");
        
    } catch (err) {
        console.error("API Utama Error:", err.message);
        
        // JALUR 2 (CADANGAN): Menggunakan API Publik Siputzx jika API pertama down
        try {
            const fallbackRes = await fetch(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(ytUrl)}`);
            const fallbackData = await fallbackRes.json();
            
            let fallbackUrl = fallbackData?.data?.dl;
            
            if (fallbackUrl) {
                return res.json({
                    success: true,
                    link: fallbackUrl,
                    duration: 225
                });
            }
            throw new Error("Semua jalur API Publik gagal mengekstrak audio.");
        } catch (fallbackErr) {
            console.error("API Fallback Error:", fallbackErr.message);
            return res.status(500).json({ 
                success: false, 
                error: 'Gagal memproses audio dari server YouTube. Coba link lain.' 
            });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Backend NF Musik berjalan di port ${PORT}`);
});
