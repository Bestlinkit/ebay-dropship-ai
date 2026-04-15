const crypto = require('crypto');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const apiKey = process.env.VITE_EPROLO_API_KEY;
const apiSecret = process.env.VITE_EPROLO_API_SECRET;
const baseUrl = 'https://openapi.eprolo.com/eprolo_product_list.html';

function sha256(string) {
    return crypto.createHash('sha256').update(string).digest('hex');
}

function md5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}

async function verify() {
    console.log("--- Eprolo API Diagnostics (Dual-Auth) ---");
    console.log(`API Key: ${apiKey ? 'PRESENT' : 'MISSING'}`);
    console.log(`API Secret: ${apiSecret ? 'PRESENT' : 'MISSING'}`);

    if (!apiKey || !apiSecret) {
        console.error("FATAL: Credentials missing in .env");
        return;
    }

    const timestamp = Date.now();
    
    // Test 1: SHA-256
    const signSHA = sha256(`${apiKey}${timestamp}${apiSecret}`);
    console.log(`\n[Stage 1] Testing SHA-256...`);
    console.log(`Generated Sign: ${signSHA}`);
    
    try {
        const response = await axios.post(baseUrl, {
            apiKey: apiKey,
            timestamp: timestamp,
            sign: signSHA,
            page_index: 0,
            page_size: 1
        });
        
        console.log(`Status: ${response.status}`);
        console.log(`Response Data: ${JSON.stringify(response.data)}`);
        
        if (response.data.code === "0") {
            console.log("\n✅ SUCCESS: Eprolo accepts SHA-256!");
        } else {
            console.warn(`\n⚠️ Stage 1 Failed: ${response.data.msg}`);
            
            // Test 2: MD5 Fallback
            console.log("\n[Stage 2] Testing MD5 Fallback...");
            const signMD5 = md5(`${apiKey}${timestamp}${apiSecret}`);
            const fbUrl = `${baseUrl}?apiKey=${apiKey}&sign=${signMD5}&timestamp=${timestamp}`;
            
            const fbResponse = await axios.post(fbUrl, {
                page_index: 0,
                page_size: 1
            });
            
            console.log(`Status: ${fbResponse.status}`);
            console.log(`Response Data: ${JSON.stringify(fbResponse.data)}`);
            
            if (fbResponse.data.code === "0") {
                console.log("\n✅ SUCCESS: Eprolo requires MD5 (Dual-Auth logic is VITAL).");
            } else {
                console.error("\n❌ FATAL: Both SHA-256 and MD5 failed.");
            }
        }
    } catch (e) {
        console.error(`\n❌ Network Error: ${e.message}`);
    }
}

verify();
