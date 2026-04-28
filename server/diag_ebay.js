const axios = require('axios');
require('dotenv').config();

async function testEbayHealth() {
    const appId = process.env.EBAY_APP_ID;
    const certId = process.env.EBAY_CERT_ID;
    const auth = Buffer.from(`${appId}:${certId}`).toString('base64');

    console.log("--- eBay Health Diagnostic ---");
    console.log("App ID:", appId ? "LOADED" : "MISSING");
    
    try {
        console.log("1. Attempting Token Retrieval...");
        const tokenRes = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', 
            'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope', 
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`
                },
                timeout: 10000
            }
        );
        const token = tokenRes.data.access_token;
        console.log("✅ Token retrieved successfully.");

        console.log("2. Attempting Product Search (Browse API)...");
        try {
            const searchRes = await axios.get('https://api.ebay.com/buy/browse/v1/item_summary/search?q=coffee&limit=3', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
                },
                timeout: 10000
            });
            console.log("✅ Search successful. Items found:", searchRes.data.total);
        } catch (searchErr) {
            console.error("❌ Search Failed:", searchErr.response?.status, searchErr.response?.data);
            if (searchErr.response?.status >= 500) {
                console.log("⚠️ This confirms eBay is having server-side issues (5xx).");
            }
        }

    } catch (tokenErr) {
        console.error("❌ Token Retrieval Failed:", tokenErr.response?.status, tokenErr.response?.data);
    }
}

testEbayHealth();
