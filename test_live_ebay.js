import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const APP_ID = process.env.VITE_EBAY_APP_ID;
const CERT_ID = process.env.VITE_EBAY_CERT_ID;

async function testConnection() {
    if (!APP_ID || !CERT_ID) {
        console.error("FAIL: Missing VITE_EBAY_APP_ID or VITE_EBAY_CERT_ID in .env");
        return;
    }

    try {
        console.log("--- STARTING LIVE API HANDSHAKE (PROD) ---");
        const auth = Buffer.from(`${APP_ID}:${CERT_ID}`).toString('base64');
        
        // 1. Get Access Token
        console.log("Status: Requesting App Access Token...");
        const tokenRes = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', 
            'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`
            }
        });
        
        const appToken = tokenRes.data.access_token;
        console.log("Success: App Token Secured.");

        // 2. Search eBay Production
        console.log("Status: Searching eBay Production for 'iPhone'...");
        const searchRes = await axios.get('https://api.ebay.com/buy/browse/v1/item_summary/search', {
            params: { q: 'iphone', limit: 2 },
            headers: { 'Authorization': `Bearer ${appToken}` }
        });

        console.log("--- LIVE EBAY PRODUCTION DATA ---");
        if (searchRes.data.itemSummaries) {
            searchRes.data.itemSummaries.forEach(item => {
                console.log(`- Product: ${item.title}`);
                console.log(`  Price: ${item.price.value} ${item.price.currency}`);
                console.log(`  Live Link: ${item.itemWebUrl}`);
            });
        }
        
    } catch (error) {
        console.error("--- HANDSHAKE FAILED ---");
        if (error.response) {
            console.error("Error Code:", error.response.status);
            console.error("Error Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

testConnection();
