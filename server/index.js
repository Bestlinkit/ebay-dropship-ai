const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper: MD5 Signing
const generateMD5 = (data) => {
    return crypto.createHash('md5').update(data).digest('hex');
};

// --- EPROLO ENDPOINTS ---

// Startup Integrity Log
const EPROLO_CONFIG_OK = !!(process.env.EPROLO_APP_KEY && process.env.EPROLO_SECRET);
console.log(`[Eprolo] Startup Config: ${EPROLO_CONFIG_OK ? "OK ✅" : "MISSING ❌"} (Key exists: ${!!process.env.EPROLO_APP_KEY})`);

app.post('/api/eprolo/search', async (req, res) => {
    try {
        const { keyword, page_index = 0, page_size = 20 } = req.body;
        const appKey = process.env.EPROLO_APP_KEY;
        const secret = process.env.EPROLO_SECRET;

        if (!appKey || !secret) {
            console.error("[Eprolo] CONFIG_ERROR: Missing keys in .env");
            return res.status(500).json({ status: "CONFIG_ERROR", message: "Missing API keys" });
        }

        const timestamp = Date.now();
        const bodyContent = { timestamp, keyword, page_index, page_size };

        // 🔍 DOUBLE-TRACE DIAGNOSTIC (Validation, not assumption)
        const formatA = generateMD5(appKey + timestamp + secret); // Current
        const formatB = generateMD5(JSON.stringify(bodyContent) + secret); // Proposed

        console.log(`--- EPROLO DIAGNOSTIC TRACE ---`);
        console.log(`Target: ${keyword}`);
        console.log(`Format A (Timestamp-Only): ${formatA}`);
        console.log(`Format B (Body-Signed): ${formatB}`);
        console.log(`Payload Stringified: ${JSON.stringify(bodyContent)}`);
        console.log(`-----------------------------`);

        // Stick with Current (Format A) for the request
        const payload = { ...bodyContent, sign: formatA };

        const response = await axios.post('https://openapi.eprolo.com/eprolo_product_list.html', payload, {
            headers: {
                'Content-Type': 'application/json',
                'apiKey': appKey,
                'apiSecret': secret
            },
            timeout: 10000
        });

        console.log(`[Eprolo] Result: Code ${response.data.code}, Items: ${response.data.data?.length || 0}`);
        if (response.data.code !== 1) {
            console.log(`[Eprolo] Full Response Error:`, JSON.stringify(response.data));
        }

        res.json(response.data);
    } catch (error) {
        console.error("Eprolo Search Error:", error.message);
        res.status(500).json({ status: "API_ERROR", message: error.message });
    }
});

app.post('/api/eprolo/detail', async (req, res) => {
    try {
        const { product_id } = req.body;
        const appKey = process.env.EPROLO_APP_KEY;
        const secret = process.env.EPROLO_SECRET;

        if (!appKey || !secret) {
            return res.status(500).json({ status: "CONFIG_ERROR", message: "Missing API keys" });
        }

        const timestamp = Date.now();
        const bodyContent = { timestamp, product_id };
        const sign = generateMD5(JSON.stringify(bodyContent) + secret);

        const payload = { ...bodyContent, sign };

        const response = await axios.post('https://openapi.eprolo.com/eprolo_product_detail.html', payload, {
            headers: {
                'Content-Type': 'application/json',
                'apiKey': appKey,
                'apiSecret': secret,
                'md5sign': sign
            },
            timeout: 10000
        });

        res.json(response.data);
    } catch (error) {
        console.error("Eprolo Detail Error:", error.message);
        res.status(500).json({ status: "API_ERROR", message: error.message });
    }
});

// --- ALIEXPRESS ENDPOINTS ---

app.get('/api/aliexpress/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: "Missing query" });

        const url = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'no-cache'
            },
            timeout: 10000
        });

        console.log(`[AliExpress] Search: "${q}" -> Status: ${response.status}, Length: ${response.data.length}`);

        res.send(response.data);
    } catch (error) {
        console.error("AliExpress Search Error:", error.message);
        res.status(500).json({ status: "API_ERROR", message: error.message });
    }
});

app.get('/api/aliexpress/detail', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).json({ message: "Missing URL" });

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 10000
        });

        res.send(response.data);
    } catch (error) {
        console.error("AliExpress Detail Error:", error.message);
        res.status(500).json({ status: "API_ERROR", message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Stable Sourcing Backend running on port ${PORT}`);
});
