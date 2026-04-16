/**
 * AliExpress Parser (v21.2 - Final Stabilization)
 * Priority: JSON Data blocks > DOM Scraping
 */

(function extractAliData() {
    try {
        console.log("[Ali-Parser] v21.2 Extraction Started...");

        // 1. PAGE TYPE GUARD
        if (window.location.href.includes('/item/')) {
            return { status: "ERROR", error: "WRONG_PAGE_TYPE", source: "aliexpress", products: [] };
        }

        let rawItems = [];

        // --- TIER 1: window.runParams ---
        if (window.runParams) {
            console.log("[Ali-Parser] Found window.runParams");
            rawItems = window.runParams.items || window.runParams.data?.items || window.runParams.mods?.itemList?.content || [];
        }

        // --- TIER 2: window.__DATA__ ---
        if (rawItems.length === 0 && window.__DATA__) {
            console.log("[Ali-Parser] Found window.__DATA__");
            rawItems = window.__DATA__.items || window.__DATA__.data?.items || [];
        }

        // --- TIER 3: application/json scripts ---
        if (rawItems.length === 0) {
            const scripts = Array.from(document.querySelectorAll('script[type="application/json"]'));
            for (const script of scripts) {
                try {
                    const data = JSON.parse(script.textContent);
                    const found = data.items || data.data?.items || data.mods?.itemList?.content;
                    if (found && Array.isArray(found)) {
                        console.log("[Ali-Parser] Found data in application/json script");
                        rawItems = found;
                        break;
                    }
                } catch (e) {}
            }
        }

        // Processing JSON results
        if (rawItems.length > 0) {
            const products = rawItems.map(item => {
                const title = (item.title || item.productTitle || item.name || "").trim();
                const price = parseFloat(item.price?.salePrice || item.prices?.salePrice || item.minPrice || 0);
                const image = item.productImage || item.imageUrl || item.image || "";
                const id = item.productId || item.id;
                
                return {
                    id: id ? String(id) : Math.random().toString(36).substr(2, 9),
                    title,
                    price,
                    currency: "USD",
                    image,
                    images: [image, item.imageUrl2, item.imageUrl3].filter(Boolean).slice(0, 3),
                    source: "aliexpress",
                    url: item.productDetailUrl || `https://www.aliexpress.com/item/${id}.html`,
                    rating: parseFloat(item.starRating || item.rating || 0),
                    sku: item.sku || id,
                    variants: item.skuProps || []
                };
            }).filter(i => i.title && i.price > 0);

            if (products.length > 0) return { status: "SUCCESS", source: "aliexpress", products };
        }

        // --- TIER 4: Fallback DOM Scraping ---
        console.log("[Ali-Parser] Falling back to DOM Scraping");
        const cards = Array.from(document.querySelectorAll('a.search-card-item, div.multi--content--27-mG9D, .list-item, [class*="product-card"]'));
        const domProducts = cards.map(card => {
            try {
                const titleEl = card.querySelector('h1, h3, div[class*="title"], div.multi--title--17ia79C');
                const title = titleEl?.innerText?.trim();
                
                const priceEl = card.querySelector('div[class*="price-current"], div.multi--price-sale--1_vS_91, [class*="price"]');
                const priceMatch = (priceEl?.innerText || "").match(/[\d.]+/);
                const price = priceMatch ? parseFloat(priceMatch[0]) : 0;

                const imgEl = card.querySelector('img');
                const image = imgEl?.src || "";

                const ratingEl = card.querySelector('div[class*="rating"], span[class*="rating"], div.multi--star--2-O1e_J');
                const ratingMatch = (ratingEl?.innerText || "").match(/[\d.]+/);
                const rating = ratingMatch ? parseFloat(ratingMatch[0]) : 0;

                const linkEl = card.tagName === 'A' ? card : card.querySelector('a');
                let url = linkEl?.href || "";
                if (url && !url.startsWith('http')) url = "https:" + url;

                if (!title || !price) return null;

                return {
                    id: url.match(/\/(\d+)\.html/)?.[1] || Math.random().toString(36).substr(2, 9),
                    title,
                    price,
                    image,
                    images: [image],
                    source: "aliexpress",
                    url,
                    rating
                };
            } catch (e) { return null; }
        }).filter(i => i && i.title.length > 5);

        if (domProducts.length > 0) return { status: "SUCCESS", source: "aliexpress", products: domProducts };

        // --- FINAL REJECTION ---
        console.warn("[Ali-Parser] No products found.");
        return { status: "NO_RESULTS", source: "aliexpress", products: [] };

    } catch (e) {
        console.error("[Ali-Parser] Critical Failure:", e.message);
        return { status: "ERROR", error: "PARSER_FAILURE", message: e.message, source: "aliexpress", products: [] };
    }
})();
