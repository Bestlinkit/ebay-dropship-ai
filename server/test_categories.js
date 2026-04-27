const dotenv = require('dotenv');
dotenv.config();

const ebayTrading = require('./services/ebayTrading.js');

async function runTest() {
    console.log("--- eBay Trading GetCategories Test (No DetailLevel) ---");
    try {
        const xmlBody = `
            <CategorySiteID>0</CategorySiteID>
            <LevelLimit>1</LevelLimit>
        `;
        const response = await ebayTrading.callTradingAPI('GetCategories', xmlBody);
        console.log("SUCCESS! RAW RESPONSE LENGTH:", response.length);
        
        const categories = [];
        const regex = /<Category>[\s\S]*?<CategoryID>(\d+)<\/CategoryID>[\s\S]*?<CategoryName>(.*?)<\/CategoryName>/g;
        let match;
        while ((match = regex.exec(response)) !== null) {
            categories.push({ id: match[1], name: match[2] });
        }
        console.log(`Found ${categories.length} categories.`);
    } catch (e) {
        console.error("CRASHED:", e.message);
    }
}

runTest();
