
const ebayTrading = require('./services/ebayTrading');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function check() {
    console.log("Checking token validity...");
    try {
        await ebayTrading.ensureToken();
        const responseXml = await ebayTrading.getUser();
        console.log("USER RESPONSE XML:", responseXml.substring(0, 500));
        
        const ack = responseXml.match(/<Ack>(.*?)<\/Ack>/)?.[1];
        console.log("ACK:", ack);
        
        if (ack === 'Success' || ack === 'Warning') {
            console.log("TOKEN IS ACTIVE ✅");
        } else {
            console.log("TOKEN IS INVALID OR EXPIRED ❌");
        }
    } catch (err) {
        console.error("DIAGNOSTIC FAILED:", err.message);
        if (err.response) {
            console.error("RESPONSE DATA:", err.response.data);
        }
    }
}

check();
