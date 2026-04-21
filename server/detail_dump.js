const axios = require('axios');
require('dotenv').config();

const CJ_GATEWAY = 'https://developers.cjdropshipping.com/api2.0/v1';
const API_KEY = process.env.VITE_CJ_API_KEY;

async function forensicDetailDump() {
    console.log("--- 🕵️ FORENSIC CJ DETAIL DUMP (PID: 2604211143421637300) ---");
    
    try {
        const authRes = await axios.post(`${CJ_GATEWAY}/authentication/getAccessToken`, { apiKey: API_KEY });
        const token = authRes.data.data.accessToken;
        const headers = { 'CJ-Access-Token': token, 'Content-Type': 'application/json' };

        const pid = "2604211143421637300";
        
        console.log(`\n[1/1] Fetching RAW Detail for ${pid}...`);
        const res = await axios.get(`${CJ_GATEWAY}/product/detail`, {
            params: { pid },
            headers
        });

        console.log("RAW RESPONSE BODY:");
        console.log(JSON.stringify(res.data, null, 2));

    } catch (e) {
        console.error("Dump failed:", e.message);
    }
}

forensicDetailDump();
