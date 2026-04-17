const axios = require('axios');
const crypto = require('crypto');

async function hmac(secret, message) {
    return crypto.createHmac('sha256', secret).update(message).digest('hex').toUpperCase();
}

async function verifyFinal() {
    const APP_KEY = '532310';
    const SECRET = 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3';
    const METHOD = 'aliexpress.ds.recommend.feed.get';
    
    const params = {
        method: METHOD, app_key: APP_KEY, timestamp: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        format: 'json', v: '2.0', sign_method: 'hmac-sha256',
        feed_id: '1', target_currency: 'USD', target_language: 'EN', ship_to_country: 'US', keywords: 'scrub'
    };

    const url = 'https://api-sg.aliexpress.com/sync';
    
    // Testing WITHOUT prefix
    let signBase = "";
    Object.keys(params).sort().forEach(k => signBase += k + params[k]);
    const sign = await hmac(SECRET, signBase);

    try {
        const res = await axios.post(url, new URLSearchParams({ ...params, sign }).toString());
        console.log("Result (WITHOUT /sync prefix):", res.data.aliexpress_ds_recommend_feed_get_response ? "✅ SUCCESS" : "❌ FAILED (" + JSON.stringify(res.data.error_response) + ")");
    } catch (e) {
        console.log("Error (WITHOUT prefix):", e.message);
    }
}
verifyFinal();
