const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const generateMD5 = (data) => crypto.createHash('md5').update(data).digest('hex');

async function testFinalEprolo() {
    const appKey = process.env.EPROLO_APP_KEY || process.env.VITE_EPROLO_API_KEY;
    const secret = process.env.EPROLO_SECRET || process.env.VITE_EPROLO_API_SECRET;
    const proxyUrl = process.env.VITE_PROXY_URL;

    if (!appKey || !secret) {
        console.error("❌ ERROR: Missing keys");
        return;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const sign = generateMD5(appKey + timestamp + secret);
    const activeUrl = 'https://openapi.eprolo.com/eprolo_product_list.html';

    const variations = [
        { name: "A: POST JSON + X-Headers (sign)", data: { keyword: "soap", page_index: 0, page_size: 10, timestamp, sign } },
        { name: "B: POST JSON + X-Headers (no sign)", data: { keywords: "soap", page: 1, limit: 10 } },
        { name: "C: POST URL-PARAMS + X-Headers", method: 'POST', url: `${activeUrl}?keyword=soap&page_index=0&page_size=10&timestamp=${timestamp}&sign=${sign}&apiKey=${appKey}`, data: {} }
    ];

    console.log(`🚀 Starting Final Eprolo Diagnostic...`);

    for (const v of variations) {
        let finalUrl = v.url || activeUrl;
        if (proxyUrl) finalUrl = `${proxyUrl}?url=${encodeURIComponent(finalUrl)}`;

        process.stdout.write(`📡 Testing ${v.name}... `);
        try {
            const response = await axios({
                method: v.method || 'POST',
                url: finalUrl,
                data: v.data,
                headers: { 
                    'Content-Type': 'application/json',
                    'X-API-KEY': appKey,
                    'X-API-SECRET': secret
                },
                timeout: 10000
            });
            console.log(`Code: ${response.data.code} (${response.data.msg || "No Msg"})`);
            if (response.data.code == 1) {
                console.log(`   ✅ SUCCESS! Products found: ${response.data.products?.length || response.data.data?.length || 0}`);
                return;
            }
        } catch (e) {
            console.log(`FAILED (${e.message})`);
        }
    }
}

testFinalEprolo();
