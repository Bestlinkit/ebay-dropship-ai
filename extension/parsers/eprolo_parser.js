/**
 * Eprolo Parser (v21.0 - Schema Hardened)
 */

(function extractEproloData() {
    try {
        console.log("[Eprolo-Parser] v21.0 Trace: Extraction Started...");

        const containers = Array.from(document.querySelectorAll('.product-item, .product-list-item, div[class*="product-card"], .product-content, .el-card'));
        console.log(`[Eprolo-Parser] Found ${containers.length} containers.`);
        
        const products = containers.map(el => {
            try {
                const titleEl = el.querySelector('h3, .title, a[class*="title"], div.product-name, div[class*="name"]');
                const title = titleEl?.innerText?.trim();
                
                const priceEl = el.querySelector('.sell-price, .price, .wholesale-price, span[class*="price"], div[class*="price"]');
                const priceMatch = (priceEl?.innerText || "").match(/[\d.]+/);
                const price = priceMatch ? parseFloat(priceMatch[0]) : 0;

                const imgEl = el.querySelector('img');
                const image = imgEl?.src || "";

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

        if (products.length > 0) {
            console.log(`[Eprolo-Parser] Success: Extracted ${products.length} products.`);
            return { status: "SUCCESS", source: "eprolo", products };
        }

        console.warn("[Eprolo-Parser] Failure: No products found.");
        return { status: "FAILED", error: "NO_PRODUCTS_FOUND", source: "eprolo", products: [] };

    } catch (e) {
        console.error("[Eprolo-Parser] Critical Failure:", e.message);
        return { status: "FAILED", error: "PARSER_FAILURE", message: e.message, source: "eprolo", products: [] };
    }
})();
