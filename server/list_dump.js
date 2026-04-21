const axios = require('axios');
require('dotenv').config();

const CJ_GATEWAY = 'https://developers.cjdropshipping.com/api2.0/v1';
const API_KEY = process.env.VITE_CJ_API_KEY;

async function forensicListDump() {
    console.log("--- 🕵️ FORENSIC CJ LIST DUMP (SKU: CJYD193576801AZ) ---");
    
    try {
        const authRes = await axios.post(`${CJ_GATEWAY}/authentication/getAccessToken`, { apiKey: API_KEY });
        const token = authRes.data.data.accessToken;
        const headers = { 'CJ-Access-Token': token, 'Content-Type': 'application/json' };

        const sku = "CJYD193576801AZ";
        
        console.log(`\n[1/1] Fetching RAW List for ${sku}...`);
        const res = await axios.get(`${CJ_GATEWAY}/product/list`, {
            params: { sku },
            headers
        });

        console.log("RAW RESPONSE BODY:");
        console.log(JSON.stringify(res.data, null, 2));

    } catch (e) {
        console.error("Dump failed:", e.message);
    }
}

forensicListDump();
