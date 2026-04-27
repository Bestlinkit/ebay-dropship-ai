
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const USER_TOKEN = process.env.VITE_EBAY_USER_TOKEN;

async function checkToken() {
    if (!USER_TOKEN) {
        console.error("❌ FAIL: VITE_EBAY_USER_TOKEN is missing in .env");
        return;
    }

    console.log("--- EBAY USER TOKEN DIAGNOSTIC ---");
    console.log(`Token Snippet: ${USER_TOKEN.substring(0, 10)}...${USER_TOKEN.substring(USER_TOKEN.length - 10)}`);
    
    try {
        console.log("Status: Testing token against eBay Sell Account API (Payment Policy)...");
        const response = await axios.get('https://api.ebay.com/sell/account/v1/payment_policy?marketplace_id=EBAY_US', {
            headers: {
                'Authorization': `Bearer ${USER_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ SUCCESS: Token is VALID and working well!");
        console.log(`HTTP Status: ${response.status}`);
        console.log(`Policies found: ${response.data.paymentPolicies?.length || 0}`);
        
    } catch (error) {
        console.error("❌ FAILED: Token is INVALID or EXPIRED.");
        if (error.response) {
            console.error(`Status Code: ${error.response.status}`);
            console.error(`Error Message: ${error.response.data?.errors?.[0]?.message || error.response.statusText}`);
            if (error.response.status === 401) {
                console.log("Tip: The token has likely expired. You may need to refresh it using your refresh token.");
            }
        } else {
            console.error(`Error: ${error.message}`);
        }
    }
}

checkToken();
