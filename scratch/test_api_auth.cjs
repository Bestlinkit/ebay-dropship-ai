const fetch = require('node-fetch');

async function testAuth() {
    try {
        const response = await fetch('http://localhost:3001/api/ebay/auth');
        const data = await response.json();
        console.log("RAW RESPONSE DATA:", JSON.stringify(data, null, 2));
        console.log("OAUTH URL VALUE:", data.oauthUrl);
    } catch (err) {
        console.error("TEST FAILED:", err.message);
    }
}

testAuth();
