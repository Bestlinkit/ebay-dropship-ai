
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testCert() {
    const appID = process.env.EBAY_APP_ID || process.env.VITE_EBAY_APP_ID;
    const certID = process.env.EBAY_CERT_ID || process.env.VITE_EBAY_CERT_ID;
    console.log("Testing with AppID:", appID ? appID.substring(0, 10) + "..." : "MISSING");
    console.log("Testing with CertID:", certID ? certID.substring(0, 10) + "..." : "MISSING");

    const auth = Buffer.from(`${appID}:${certID}`).toString('base64');
    try {
        const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token',
            `grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`
                }
            }
        );
        console.log("CERT ID IS VALID ✅");
        console.log("ACCESS TOKEN OBTAINED:", response.data.access_token.substring(0, 20) + "...");
    } catch (e) {
        console.error("CERT ID IS INVALID ❌");
        console.error("ERROR:", e.response?.data || e.message);
    }
}

testCert();
