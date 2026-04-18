const crypto = require('crypto');

const APP_KEY = '532310';
const APP_SECRET = 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3';
const code = '3_532310_g6f0Sgr4lMZcwbwz3kHCOjzk904'; // FRESH CODE
const REDIRECT_URI = 'https://geonoyc-dropshipping.web.app/callback';

function getForcedTimestamp() {
    const d = new Date();
    // Force year to 2024 to match AliExpress real-world time
    const timestamp = d.toISOString().replace('T', ' ').split('.')[0].replace('2026', '2024');
    return timestamp;
}

function md5Hash(message) {
    return crypto.createHash('md5').update(message).digest('hex').toUpperCase();
}

async function exchangeToken() {
    const timestamp = getForcedTimestamp();
    console.log(`🕒 Using Forced Timestamp: ${timestamp}`);
    
    // In TOP rest/auth, app_key and app_secret must be both in params and sign
    const params = {
        app_key: APP_KEY,
        app_secret: APP_SECRET,
        code: code,
        grant_type: 'authorization_code',
        timestamp: timestamp,
        v: '2.0',
        format: 'json',
        sign_method: 'md5',
        redirect_uri: REDIRECT_URI
    };

    const keys = Object.keys(params).sort();
    let signString = APP_SECRET;
    for (const key of keys) {
        signString += key + params[key];
    }
    signString += APP_SECRET;

    params.sign = md5Hash(signString);
    const body = new URLSearchParams(params).toString();

    try {
        const response = await fetch('https://api-sg.aliexpress.com/rest/auth/token/security/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body
        });

        const data = await response.json();
        console.log('Result:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

exchangeToken();
