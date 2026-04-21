const axios = require('axios');
require('dotenv').config();

const CJ_GATEWAY = 'https://developers.cjdropshipping.com/api2.0/v1';
const API_KEY = process.env.VITE_CJ_API_KEY;

async function variantSkuTest() {
    console.log("--- 🕵️ FORENSIC CJ KEY-NAME TEST (variantSku) ---");
    
    try {
        const authRes = await axios.post(`${CJ_GATEWAY}/authentication/getAccessToken`, { apiKey: API_KEY });
        const token = authRes.data.data.accessToken;
        const headers = { 'CJ-Access-Token': token, 'Content-Type': 'application/json' };

        const controlSku = "CJNS115202101AZ"; 
        
        // TEST A: Using 'variantSku' as the key
        const p1 = {
            startCountryCode: "CN",
            endCountryCode: "US",
            products: [{ variantSku: controlSku, quantity: 1 }] // CHANGED FROM skuCode TO variantSku
        };

        console.log("TEST A (variantSku):", JSON.stringify(p1));
        const r1 = await axios.post(`${CJ_GATEWAY}/logistic/freightCalculate`, p1, { headers });
        console.log("RESPONSE A:", r1.data.code, r1.data.message, `Methods: ${r1.data.data?.length}`);

        // TEST B: Using 'vid' as the key (Just to be sure)
        // (We don't have the Vid handy but we'll see if the error changes)

    } catch (e) {
        console.error("Test failed:", e.response?.data || e.message);
    }
}

variantSkuTest();
