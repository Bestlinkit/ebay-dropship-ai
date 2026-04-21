const axios = require('axios');
require('dotenv').config();

const CJ_GATEWAY = 'https://developers.cjdropshipping.com/api2.0/v1';
const API_KEY = process.env.VITE_CJ_API_KEY;

async function controlSkuAudit() {
    console.log("--- 🕵️ FORENSIC CJ CONTROL TEST (Point 6) ---");
    
    try {
        // [0] Authenticate
        const authRes = await axios.post(`${CJ_GATEWAY}/authentication/getAccessToken`, { apiKey: API_KEY });
        const token = authRes.data.data.accessToken;
        const headers = { 'CJ-Access-Token': token, 'Content-Type': 'application/json' };

        // Control SKU (Known Working: Men Work Safety Shoes)
        const controlSku = "CJNS115202101AZ"; 
        console.log(`\n[1/2] Testing CONTROL SKU: ${controlSku}...`);
        
        const payload = {
            startCountryCode: "CN",
            endCountryCode: "US",
            products: [{ skuCode: controlSku, quantity: 1 }]
        };

        console.log("CONTROL REQUEST:", JSON.stringify(payload, null, 2));

        const res = await axios.post(`${CJ_GATEWAY}/logistic/freightCalculate`, payload, { headers });
        
        console.log("\nCONTROL RESPONSE:");
        console.log(JSON.stringify(res.data, null, 2));

        if (res.data.data?.length > 0) {
            console.log(`\n✅ SYSTEM PASS: API is functioning correctly.`);
            console.log(`Methods found: ${res.data.data.length}. Example: ${res.data.data[0].logisticName} ($${res.data.data[0].amount})`);
        } else {
            console.log(`\n❌ SYSTEM FAILURE: Even control SKU returned zero methods.`);
            console.log(`Message: "${res.data.message}" | Code: ${res.data.code}`);
        }

    } catch (e) {
        console.error("Control Audit CRASHED:", e.message);
        if (e.response) console.log("Response Data:", e.response.data);
    }
    
    console.log("\n--- CONTROL TEST COMPLETE ---");
}

controlSkuAudit();
