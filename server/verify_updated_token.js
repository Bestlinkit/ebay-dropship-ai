const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function verifyToken() {
    console.log("--- eBay Token Verification ---");
    
    // Try to get token from tokens.json first
    let token;
    try {
        const tokenData = JSON.parse(fs.readFileSync(path.join(__dirname, 'tokens.json'), 'utf8'));
        token = tokenData.access_token;
        console.log("Token loaded from tokens.json");
    } catch (err) {
        token = process.env.EBAY_USER_TOKEN || process.env.VITE_EBAY_USER_TOKEN;
        console.log("Token loaded from env:", token ? "YES" : "NO");
    }

    if (!token) {
        console.error("❌ No token found!");
        return;
    }

    // Clean token (remove quotes if any)
    token = token.replace(/^"|"$/g, '');

    console.log("Verifying token with eBay GeteBayOfficialTime...");
    
    try {
        // Use Trading API to verify (it's the most reliable for User Tokens)
        const response = await axios.post('https://api.ebay.com/ws/api.dll', 
            `<?xml version="1.0" encoding="utf-8"?>
            <GeteBayOfficialTimeRequest xmlns="urn:ebay:apis:eBLBaseComponents">
              <ErrorLanguage>en_US</ErrorLanguage>
              <WarningLevel>High</WarningLevel>
            </GeteBayOfficialTimeRequest>`,
            {
                headers: {
                    'X-EBAY-API-SITEID': '0',
                    'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
                    'X-EBAY-API-CALL-NAME': 'GeteBayOfficialTime',
                    'X-EBAY-API-IAF-TOKEN': token,
                    'Content-Type': 'text/xml'
                }
            }
        );

        if (response.data.includes('<Ack>Success</Ack>') || response.data.includes('<Ack>Warning</Ack>')) {
            console.log("✅ Token is VALID!");
            const match = response.data.match(/<Timestamp>(.*?)<\/Timestamp>/);
            if (match) console.log("eBay Time:", match[1]);
        } else {
            console.error("❌ Token Verification FAILED!");
            console.log("Response:", response.data);
        }
    } catch (err) {
        console.error("❌ Request Failed:", err.message);
        if (err.response) {
            console.log("Status:", err.response.status);
            console.log("Data:", err.response.data);
        }
    }
}

verifyToken();
