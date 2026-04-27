const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load env from server directory
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const appName = process.env.EBAY_APP_ID;
const certName = process.env.EBAY_CERT_ID;

async function testTaxonomy() {
    console.log("--- eBay Taxonomy Diagnostic ---");
    console.log("App ID:", appName ? "LOADED" : "MISSING");
    console.log("Cert ID:", certName ? "LOADED" : "MISSING");

    if (!appName || !certName) {
        console.error("CRITICAL: Missing eBay Application Credentials in server/.env");
        return;
    }

    const auth = Buffer.from(`${appName}:${certName}`).toString('base64');
    
    try {
        console.log("\n1. Testing App Token (Client Credentials)...");
        const tokenRes = await axios.post('https://api.ebay.com/identity/v1/oauth2/token',
            'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope https://api.ebay.com/oauth/api_scope/commerce.taxonomy.readonly',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`
                }
            }
        );
        const token = tokenRes.data.access_token;
        console.log("SUCCESS: App Token Received.");

        console.log("\n2. Testing Category Tree ID (Default US)...");
        const treeRes = await axios.get('https://api.ebay.com/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_US', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const treeId = treeRes.data.categoryTreeId;
        console.log(`SUCCESS: Tree ID is ${treeId}`);

        console.log(`\n3. Testing Top Categories for Tree ${treeId}...`);
        const catsRes = await axios.get(`https://api.ebay.com/commerce/taxonomy/v1/category_tree/${treeId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const nodes = catsRes.data.rootCategoryNode?.childCategoryTreeNodes || [];
        console.log(`SUCCESS: Found ${nodes.length} top-level categories.`);
        
        if (nodes.length > 0) {
            console.log("Sample Categories:", nodes.slice(0, 5).map(n => n.category.categoryName).join(", "));
        } else {
            console.warn("WARNING: Root node exists but childCategoryTreeNodes is empty.");
        }

    } catch (e) {
        console.error("\nDIAGNOSTIC FAILED!");
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Error Data:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.error("Error Message:", e.message);
        }
    }
}

testTaxonomy();
