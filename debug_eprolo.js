import crypto from 'crypto';
import fetch from 'node-fetch'; // Standard in Node 18+
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.VITE_EPROLO_API_KEY;
const apiSecret = process.env.VITE_EPROLO_API_SECRET;
const baseUrl = 'https://openapi.eprolo.com/eprolo_product_list.html';

function sign(method, key, ts, secret) {
    const str = `${key}${ts}${secret}`;
    if (method === 'sha256') return crypto.createHash('sha256').update(str).digest('hex');
    return crypto.createHash('md5').update(str).digest('hex');
}

async function test(method) {
    console.log(`\n--- Testing ${method.toUpperCase()} ---`);
    const ts = Math.floor(Date.now() / 1000); // Unix timestamp
    const signature = sign(method, apiKey, ts, secret);
    
    try {
        const res = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey,
                timestamp: ts,
                sign: signature,
                page_index: 0,
                page_size: 1
            })
        });
        const data = await res.json();
        console.log(`Response Code: ${data.code}`);
        console.log(`Response Message: ${data.msg}`);
        return data.code === "0";
    } catch (e) {
        console.error(`Error: ${e.message}`);
        return false;
    }
}

console.log("Starting diagnostics...");
if (!apiKey) console.log("Missing apiKey");
else {
    const s1 = await test('sha256');
    if (!s1) await test('md5');
}
