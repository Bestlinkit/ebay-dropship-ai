import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';

// Manual .env parsing to avoid dependency issues
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line.includes('=') && !line.startsWith('#'))
        .map(line => {
            const [key, ...val] = line.split('=');
            return [key.trim(), val.join('=').trim().replace(/^["']|["']$/g, '')];
        })
);

const apiKey = env.VITE_EPROLO_API_KEY;
const apiSecret = env.VITE_EPROLO_API_SECRET;
const baseUrl = 'https://openapi.eprolo.com';


function md5(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}

async function verify() {
    console.log("--- Eprolo API Diagnostics ---");
    console.log(`API Key: ${apiKey ? 'PRESENT' : 'MISSING'}`);
    console.log(`API Secret: ${apiSecret ? 'PRESENT' : 'MISSING'}`);

    if (!apiKey || !apiSecret) {
        console.error("FATAL: Credentials missing in .env");
        return;
    }

    const timestamp = Date.now();
    const sign = md5(`${apiKey}${timestamp}${apiSecret}`);

    console.log(`Timestamp: ${timestamp}`);
    console.log(`Generated Sign: ${sign}`);

    const url = `${baseUrl}/eprolo_product_list.html?apiKey=${apiKey}&sign=${sign}&timestamp=${timestamp}&page_index=0&page_size=3`;

    console.log(`Requesting URL: ${url}`);

    try {
        const response = await axios.get(url, {
            headers: { 'apiKey': apiKey }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        
        const data = response.data;
        console.log("Response Data Preview:", JSON.stringify(data).substring(0, 500));

        if (data.code === '0' || data.code === 0) {
            console.log("\n✅ SUCCESS: Eprolo Open API is connected and responding correctly!");
            if (data.data && data.data.length > 0) {
                console.log(`Found ${data.data.length} products in page 0.`);
                console.log(`Sample Product: ${data.data[0].title}`);
            } else {
                console.log("Empty product list returned (this is normal if page is empty).");
            }
        } else {
            console.error(`\n❌ FAILED: API Error - ${data.msg} (Code: ${data.code})`);
        }

    } catch (e) {
        console.error(`\n❌ CRITICAL: Request failed - ${e.message}`);
        if (e.response) {
            console.error("Error Response Data:", e.response.data);
        }
    }
}

verify();

