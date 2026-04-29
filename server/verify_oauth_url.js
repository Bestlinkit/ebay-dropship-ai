const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ebayTrading = require('./services/ebayTrading');

try {
    const url = ebayTrading.getAuthorizationUrl();
    console.log("--- GENERATED OAUTH URL ---");
    console.log(url);
    
    const urlObj = new URL(url);
    console.log("\n--- PARSED PARAMETERS ---");
    console.log("Base URL:", urlObj.origin + urlObj.pathname);
    console.log("Client ID:", urlObj.searchParams.get('client_id'));
    console.log("Response Type:", urlObj.searchParams.get('response_type'));
    console.log("Redirect URI (RuName):", urlObj.searchParams.get('redirect_uri'));
    
    const scopes = urlObj.searchParams.get('scope');
    console.log("Scopes Raw:", scopes);
    console.log("Scopes List:", scopes.split(' '));
    
    if (url.includes(' ')) {
        console.log("❌ ERROR: URL contains raw spaces. It must be %20 encoded.");
    } else {
        console.log("✅ URL is properly encoded (no spaces).");
    }

    if (url.match(/https:\/\/auth\.ebay\.com/g).length > 1) {
        console.log("❌ ERROR: Duplicated authorize URL detected.");
    } else {
        console.log("✅ No duplication detected.");
    }

} catch (err) {
    console.error("ERROR:", err.message);
}
