const axios = require('axios');
const crypto = require('crypto');

async function auditSourcingHMAC() {
    const PROXY_URL = 'https://ebay-bridge.bestlinkkoncept.workers.dev/';
    const ALI_APP_KEY = '532310';
    
    // The query that returned 0 results
    const query = "turmeric body scrub tumeric oil set";
    
    console.log("--- 🔎 DEEP SOURCING AUDIT (v34.0 HMAC) ---");
    console.log("Query:", query);
    console.log("Targeting: api-sg.aliexpress.com/sync via Worker");

    const payload = {
        method: 'aliexpress.ds.recommend.feed.get',
        app_key: ALI_APP_KEY,
        timestamp: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        format: 'json',
        v: '2.0',
        sign_method: 'hmac-sha256',
        page_size: '20',
        page_no: '1',
        feed_id: '1',
        target_currency: 'USD',
        target_language: 'EN',
        ship_to_country: 'US',
        keywords: query
    };

    try {
        const response = await axios.post(PROXY_URL + 'api/ali-ds-proxy', payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log("\n--- [1] WORKER STATUS ---");
        console.log("HTTP Status:", response.status);

        console.log("\n--- [2] RAW API RESPONSE ---");
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.aliexpress_ds_recommend_feed_get_response) {
            console.log("\n✅ API CONNECTED: Valid v2.0 response received!");
        } else if (response.data.error_response) {
            console.log("\n❌ API REJECTED: Code", response.data.error_response.code);
            console.log("Message:", response.data.error_response.msg);
        }

    } catch (err) {
        console.error("\n❌ NETWORK/WORKER FAILURE:", err.message);
    }
}

auditSourcingHMAC();
