const axios = require('axios');
const crypto = require('crypto');

async function hmac(secret, message) {
    return crypto.createHmac('sha256', secret).update(message).digest('hex').toUpperCase();
}

function md5(message) {
    return crypto.createHash('md5').update(message).digest('hex').toUpperCase();
}

async function solveHandshake() {
    const APP_KEY = '532310';
    const SECRET = 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3';
    const METHOD = 'aliexpress.ds.recommend.feed.get';
    const KEYWORDS = 'turmeric body scrub set';

    const baseParams = {
        method: METHOD,
        app_key: APP_KEY,
        timestamp: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        format: 'json',
        v: '2.0',
        page_size: '20',
        feed_id: '1',
        target_currency: 'USD',
        target_language: 'EN',
        ship_to_country: 'US',
        keywords: KEYWORDS
    };

    const tests = [
        { name: "TOP Legacy (MD5)", url: 'https://eco.taobao.com/router/rest', sign_method: 'md5', protocol: 'legacy' },
        { name: "Global v2.0 (HMAC)", url: 'https://api-sg.aliexpress.com/sync', sign_method: 'hmac-sha256', protocol: 'sync' },
        { name: "Global v2.0 (MD5)", url: 'https://api-sg.aliexpress.com/sync', sign_method: 'md5', protocol: 'sync' }
    ];

    console.log("--- 🕵️ ALIPROTOCOL SWEEP (v34.1) ---");

    for (const test of tests) {
        process.stdout.write(`Testing ${test.name}... `);
        
        let params = { ...baseParams, sign_method: test.sign_method };
        let sorted = Object.keys(params).sort();
        let sign;

        if (test.protocol === 'legacy') {
            // MD5(Secret + key1value1... + Secret)
            let base = SECRET;
            sorted.forEach(k => base += k + params[k]);
            base += SECRET;
            sign = md5(base);
        } else {
            // HMAC(Secret, "/sync" + key1value1...)
            let base = "/sync";
            sorted.forEach(k => base += k + params[k]);
            sign = (test.sign_method === 'hmac-sha256') ? await hmac(SECRET, base) : md5(base);
        }

        try {
            const res = await axios.post(test.url, new URLSearchParams({ ...params, sign }).toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 5000
            });
            const data = res.data;
            if (data.error_response) {
                console.log(`❌ FAILED (${data.error_response.sub_code || data.error_response.msg})`);
            } else {
                console.log("✅ SUCCESS!");
                console.log("Structure:", JSON.stringify(data).substring(0, 100) + "...");
            }
        } catch (err) {
            console.log(`❌ ERROR (${err.message})`);
        }
    }
}

solveHandshake();
