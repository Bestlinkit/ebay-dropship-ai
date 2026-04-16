/**
 * Eprolo Parser (v20.0 - Catalog Specialist)
 */

(function extractEproloData() {
    try {
        console.log("[Eprolo-Parser] v20.0 Catalog Extraction...");

        // Prioritize the new Dashboard/Catalog layout containers
        const containers = Array.from(document.querySelectorAll('.product-item, .product-list-item, div[class*="product-card"], .product-content, .el-card'));
        
        const items = containers.map(el => {
            try {
                // Title Extraction
                const titleEl = el.querySelector('h3, .title, a[class*="title"], div.product-name, div[class*="name"]');
                const title = titleEl?.innerText?.trim();
                
                // Price Extraction (Looking for sell-price or numeric spans)
                const priceEl = el.querySelector('.sell-price, .price, .wholesale-price, span[class*="price"], div[class*="price"]');
                const priceMatch = (priceEl?.innerText || "").match(/[\d.]+/);
                const price = priceMatch ? parseFloat(priceMatch[0]) : 0;

                // Image Extraction
                const imgEl = el.querySelector('img');
                const image = imgEl?.src || "";

                // Link Extraction
                const linkEl = el.querySelector('a');
                const url = linkEl?.href || window.location.href;

                if (!title || title.length < 3 || !price) return null;

                return {
                    id: el.getAttribute('data-id') || el.getAttribute('product-id') || url.match(/id=(\d+)/)?.[1] || Math.random().toString(36).substr(2, 9),
                    title,
                    price,
                    currency: "USD",
                    image,
                    images: [image],
                    source: "eprolo",
                    url,
                    stock: "In Stock"
                };
            } catch (e) { return null; }
        }).filter(i => i !== null);

        if (items.length > 0) {
            console.log(`[Eprolo-Parser] Successfully extracted ${items.length} items.`);
            return { status: "SUCCESS", source: "eprolo", data: items };
        }

        return { status: "FAILED", error: "NO_LISTINGS_FOUND", source: "eprolo" };

    } catch (e) {
        return { status: "FAILED", error: "PARSER_FAILURE", message: e.message, source: "eprolo" };
    }
})();
