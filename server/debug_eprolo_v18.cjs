const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const generateMD5 = (data) => crypto.createHash('md5').update(data).digest('hex');

async function testV18DualAuth() {
    const appKey = process.env.EPROLO_APP_KEY || process.env.VITE_EPROLO_API_KEY;
    const secret = process.env.EPROLO_SECRET || process.env.VITE_EPROLO_API_SECRET;
    const proxyUrl = process.env.VITE_PROXY_URL;

    if (!appKey || !secret) {
        console.error("❌ ERROR: Missing keys");
        return;
    }

    const timestamp = Date.now();
    const sign = generateMD5(`${appKey}${timestamp}${secret}`);
    
    // HYPER-ALIGNMENT: X-Headers + Legacy Body + Proxy
    const finalUrl = `${proxyUrl}?url=${encodeURIComponent('https://openapi.eprolo.com/eprolo_product_list.html')}`;

    const body = { 
        keyword: "soap", 
        page_index: 0, 
        page_size: 5 
    };

    console.log(`🚀 Starting Eprolo Hyper-Alignment Test...`);

    try {
        const response = await axios.post(finalUrl, body, {
            headers: { 
                'Content-Type': 'application/json',
                'X-API-KEY': appKey,
                'X-API-SECRET': secret
            },
            timeout: 15000
        });

        console.log(`\n--- V18 RESPONSE ---`);
        console.log(`Status: ${response.status}`);
        console.log(`Code: ${response.data.code}`);
        console.log(`Msg: ${response.data.msg || "SUCCESS"}`);
        console.log(`Items: ${response.data.data?.length || 0}`);
        console.log(`--------------------\n`);

        if (response.data.code === "0" || response.data.code === 0) {
            console.log(`✅ SUCCESS: v18 Split-Authentication is THE working pattern!`);
        } else {
            console.log(`❌ FAILED: ${response.data.msg}`);
        }
    } catch (e) {
        console.error(`❌ NETWORK ERROR: ${e.message}`);
    }
}

testV18DualAuth();
