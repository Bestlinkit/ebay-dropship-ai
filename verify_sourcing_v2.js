import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

// 1. Mock Sample AliExpress HTML (Simulating a real response)
const mockAliHtml = `
<html>
<body>
    <div class="list-item">
        <div class="title">Luxury Star Denim Jeans</div>
        <div class="price">$45.99</div>
        <img src="https://example.com/item1.jpg" />
        <div class="rating">4.9</div>
        <a href="https://aliexpress.com/item/1.html">Link</a>
    </div>
    <div class="list-item">
        <div class="title">Retro Vintage Jacket</div>
        <div class="price">$22.50</div>
        <img src="https://example.com/item2.jpg" />
        <div class="rating">4.2</div>
        <a href="https://aliexpress.com/item/2.html">Link</a>
    </div>
</body>
</html>
`;

// 2. Scraping Logic (Mirrors src/services/aliexpress.js)
function testScraper(html) {
    console.log("--- Testing AliExpress Scraper Logic ---");
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const itemNodes = [...doc.querySelectorAll('.list-item, .search-item-card, [data-index]')];
    console.log(`Found ${itemNodes.length} item nodes.`);

    const results = itemNodes.map(el => {
        const title = el.querySelector('.title, .item-title, h1, h3')?.textContent?.trim() || "AliExpress Product";
        const priceText = el.querySelector('.price, .item-price, .current-price')?.textContent?.trim() || "0";
        const image = el.querySelector('img')?.src || "";
        const rating = el.querySelector('.rating, .item-rating')?.textContent?.trim() || "4.5";
        
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

        return { title, price, image, rating };
    });

    return results;
}

// 3. Execution
console.log("Starting Sourcing V2 Verification...");
const results = testScraper(mockAliHtml);
console.log("Extracted Results:", JSON.stringify(results, null, 2));

if (results.length === 2 && results[0].price === 45.99) {
    console.log("✅ SUCCESS: Scraping logic correctly parsed the mock HTML.");
} else {
    console.log("❌ FAILED: Scraping logic discrepancy found.");
}
