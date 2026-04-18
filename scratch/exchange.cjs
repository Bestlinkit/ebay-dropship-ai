const crypto = require('crypto');

const APP_KEY = '532310';
const APP_SECRET = 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3';
const code = '3_532310_JutLhbeZEfzseJXhH9DRD0rr880';

// AliExpress often expects Beijing Time (GMT+8)
function getBeijingTimestamp() {
    const d = new Date();
    // Offset for GMT+8
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const beijingDate = new Date(utc + (3600000 * 8));
    return beijingDate.toISOString().replace('T', ' ').split('.')[0];
}

function md5Hash(message) {
    return crypto.createHash('md5').update(message).digest('hex').toUpperCase();
}

async function exchangeToken() {
    console.log('⏳ Attempting Production Exchange (Beijing Time)...');
    
    const params = {
        app_key: APP_KEY,
        code: code,
        grant_type: 'authorization_code',
        timestamp: getBeijingTimestamp(),
        v: '2.0',
        format: 'json',
        sign_method: 'md5',
        redirect_uri: 'https://geonoyc-dropshipping.web.app/callback'
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
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

exchangeToken();
