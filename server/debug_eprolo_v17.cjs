const axios = require('axios');
require('dotenv').config();

async function testEproloSweep() {
    const appKey = process.env.EPROLO_APP_KEY || process.env.VITE_EPROLO_API_KEY;
    const secret = process.env.EPROLO_SECRET || process.env.VITE_EPROLO_API_SECRET;
    const proxyUrl = process.env.VITE_PROXY_URL;

    if (!appKey || !secret) {
        console.error("❌ ERROR: Missing keys in .env");
        return;
    }

    console.log(`🚀 Starting Eprolo Path Sweep (v17.2)...`);
    
    const activeUrl = 'https://openapi.eprolo.com/eprolo_product_list.html';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = generateMD5(appKey + timestamp + secret);

    const variations = [
        { name: "A: keywords (plural) + no sign", data: { keywords: "soap", page: 1, limit: 10 } },
        { name: "B: keyword (singular) + sign", data: { keyword: "soap", page_index: 0, page_size: 10, timestamp, sign } },
        { name: "C: keywords + sign", data: { keywords: "soap", page: 1, limit: 10, timestamp, sign } }
    ];

    for (const v of variations) {
        let finalUrl = activeUrl;
        if (proxyUrl) finalUrl = `${proxyUrl}?url=${encodeURIComponent(activeUrl)}`;

        process.stdout.write(`📡 Testing ${v.name}... `);
        try {
            const response = await axios.post(finalUrl, v.data, {
                headers: { 
                    'Content-Type': 'application/json',
                    'X-API-KEY': appKey,
                    'X-API-SECRET': secret,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                },
                timeout: 8000
            });
            console.log(`Code: ${response.data.code} (${response.data.msg || "No Msg"})`);
            if (response.data.code == 1) return;
        } catch (error) {
            console.log(`FAILED (${error.message})`);
        }
    }
}

testEproloSweep();
