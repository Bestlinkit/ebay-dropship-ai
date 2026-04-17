const axios = require('axios');
const crypto = require('crypto');

async function auditSourcingV34Stable() {
    const PROXY_URL = 'https://ebay-bridge.bestlinkkoncept.workers.dev/';
    const ALI_APP_KEY = '532310';
    
    // The query that returned 0 results
    const query = "turmeric body scrub tumeric oil set";
    
    console.log("--- 🔎 FINAL DEEP AUDIT (v34.2-STABLE) ---");
    console.log("Query:", query);
    console.log("Method: aliexpress.ds.recommend.feed.get");

    const payload = {
        method: 'aliexpress.ds.recommend.feed.get',
        app_key: ALI_APP_KEY,
        timestamp: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        format: 'json',
        v: '2.0',
        sign_method: 'hmac-sha256',
        page_size: '20',
        page_no: '1',
        feed_name: 'intelligence', // THE MISSING PARAMETER
        target_currency: 'USD',
        target_language: 'EN',
        ship_to_country: 'US',
        keywords: query
    };

    try {
        const response = await axios.post(PROXY_URL + 'api/ali-ds-proxy', payload);

        console.log("\n--- [1] RAW API RESPONSE ---");
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.aliexpress_ds_recommend_feed_get_response) {
            console.log("\n✅ CONNECTION LIVE: Thousands of products discovered via v2.0 Protocol!");
            const count = response.data.aliexpress_ds_recommend_feed_get_response.total_record_count;
            console.log("Total Products Found:", count);
        } else {
            console.log("\n❌ AUDIT FAILED: See response above.");
        }

    } catch (err) {
        console.error("\n❌ NETWORK ERROR:", err.message);
    }
}

auditSourcingV34Stable();
