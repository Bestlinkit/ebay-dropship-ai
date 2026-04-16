/**
 * Eprolo Parser (v21.2 - Final Stabilization)
 */

(function extractEproloData() {
    try {
        console.log("[Eprolo-Parser] v21.2 Extraction Started...");

        // Eprolo US-Catalog listing selectors
        const items = Array.from(document.querySelectorAll('.product-item, .product-card, .el-card, [class*="product-list-item"]'));
        console.log(`[Eprolo-Parser] Found ${items.length} items`);

        const products = items.map(el => {
            try {
                // Title extraction
                const titleEl = el.querySelector('h3, h6, .product-title, .title, a[class*="name"]');
                const title = titleEl?.innerText?.trim();

                // Price extraction (looking for USD spans)
                const priceEl = Array.from(el.querySelectorAll('span, div, p')).find(s => s.innerText?.includes('$') || s.innerText?.includes('USD'));
                const priceMatch = (priceEl?.innerText || "").match(/[\d.]+/);
                const price = priceMatch ? parseFloat(priceMatch[0]) : 0;

                // Image extraction
                const imgEl = el.querySelector('img');
                const image = imgEl?.src || "";

                // URL extraction
                const linkEl = el.querySelector('a[href*="/product/"]') || el.querySelector('a');
                const url = linkEl?.href || window.location.href;

                if (!title || !image) return null;

                return {
                    id: url.match(/id=(\d+)/)?.[1] || Math.random().toString(36).substr(2, 9),
                    title,
                    price,
                    currency: "USD",
                    image,
                    images: [image],
                    source: "eprolo",
                    url
                };
            } catch (e) { return null; }
        }).filter(i => i !== null);

        if (products.length > 0) {
            console.log(`[Eprolo-Parser] Successfully extracted ${products.length} products`);
            return { status: "SUCCESS", source: "eprolo", products };
        }

        console.warn("[Eprolo-Parser] No results found on page.");
        return { status: "NO_RESULTS", source: "eprolo", products: [] };

    } catch (e) {
        console.error("[Eprolo-Parser] Critical Failure:", e.message);
        return { status: "ERROR", error: "PARSER_FAILURE", message: e.message, source: "eprolo", products: [] };
    }
})();
