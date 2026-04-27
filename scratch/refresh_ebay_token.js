
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const envPath = '.env';
const env = fs.readFileSync(envPath, 'utf8');

const appId = env.match(/VITE_EBAY_APP_ID=(.*)/)[1].trim();
const certId = env.match(/VITE_EBAY_CERT_ID=(.*)/)[1].trim();
const refreshToken = env.match(/VITE_EBAY_REFRESH_TOKEN=(.*)/)[1].trim();

const auth = Buffer.from(`${appId}:${certId}`).toString('base64');

async function refresh() {
    console.log("--- REFRESHING EBAY USER TOKEN ---");
    try {
        const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', 
            `grant_type=refresh_token&refresh_token=${refreshToken}&scope=https://api.ebay.com/oauth/api_scope/sell.account.readonly https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.inventory.readonly`, 
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`
                }
            }
        );

        const newToken = response.data.access_token;
        console.log("✅ New Token Obtained.");
        
        // Update .env
        const updatedEnv = env.replace(/VITE_EBAY_USER_TOKEN=.*/, `VITE_EBAY_USER_TOKEN=${newToken}`);
        fs.writeFileSync(envPath, updatedEnv);
        console.log("📝 .env updated with new token.");

    } catch (error) {
        console.error("❌ Refresh Failed:", error.response?.status, JSON.stringify(error.response?.data, null, 2));
    }
}

refresh();
