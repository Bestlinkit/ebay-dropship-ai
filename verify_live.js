import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const APP_ID = process.env.VITE_EBAY_APP_ID;
const CERT_ID = process.env.VITE_EBAY_CERT_ID;

function post(url, data, headers) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'POST', headers }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch (e) { resolve(body); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function get(url, headers) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch (e) { resolve(body); }
            });
        }).on('error', reject);
    });
}

async function run() {
    if (!APP_ID || !CERT_ID) {
        console.error("FAIL: Missing VITE_EBAY_APP_ID or VITE_EBAY_CERT_ID in .env");
        return;
    }
    try {
        console.log("HANDSHAKE: Requesting App Access Token...");
        const auth = Buffer.from(`${APP_ID}:${CERT_ID}`).toString('base64');
        const tokenRes = await post('https://api.ebay.com/identity/v1/oauth2/token', 
            'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope', {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
        });

        const token = tokenRes.access_token;
        if (!token) {
            console.error("FAIL: Could not obtain token. Check credentials.");
            return;
        }
        console.log("SUCCESS: Token obtained from eBay Production.");

        console.log("SEARCH: Fetching real-time market data for 'iPhone'...");
        const search = await get('https://api.ebay.com/buy/browse/v1/item_summary/search?q=iphone&limit=2', {
            'Authorization': `Bearer ${token}`
        });

        console.log("--- LIVE EBAY PRODUCTION DATA ---");
        if (search.itemSummaries) {
            search.itemSummaries.forEach(item => {
                console.log(`- Product Found: ${item.title}`);
                console.log(`  Live Price: ${item.price.value} ${item.price.currency}`);
            });
        }
        console.log("--- DATA FETCH COMPLETE ---");
    } catch (e) {
        console.error("FAIL:", e.message);
    }
}

run();
