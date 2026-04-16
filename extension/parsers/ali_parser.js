/**
 * AliExpress Parser (v19.2)
 * DETERMINISTIC EXTRACTION (No sleeps)
 */

(function extractAliData() {
    try {
        console.log("[Ali-Parser] v21.0 Trace: Extraction Started...");

        // 1. PAGE TYPE GUARD
        if (window.location.href.includes('/item/')) {
            console.warn("[Ali-Parser] Redirected to Item Page. Rejecting.");
            return { status: "FAILED", error: "WRONG_PAGE_TYPE", source: "aliexpress", products: [] };
        }

        // 2. DOM-FIRST LISTING EXTRACTION
        const cards = Array.from(document.querySelectorAll('a.search-card-item, div.multi--content--27-mG9D, .list-item, [class*="product-card"]'));
        console.log(`[Ali-Parser] Found ${cards.length} potential listing cards.`);
        
        const products = cards.map(card => {
            try {
                const titleEl = card.querySelector('h1, h3, div[class*="title"], div.multi--title--17ia79C');
                const title = titleEl?.innerText?.trim() || card.getAttribute('aria-label');
                
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
                    currency: "USD",
                    image,
                    images: [image],
                    source: "aliexpress",
                    url,
                    rating
                };
            } catch (e) { return null; }
        }).filter(i => i && i.title.length > 5);

        if (products.length > 0) {
            console.log(`[Ali-Parser] Success: Extracted ${products.length} products.`);
            return { status: "SUCCESS", source: "aliexpress", products };
        }

        // 3. RUNPARAMS FALLBACK
        const runParams = window.runParams || {};
        const rawItems = runParams.items || runParams.data?.items || runParams.mods?.itemList?.content || [];
        if (rawItems.length > 0) {
            console.log("[Ali-Parser] Fallback to runParams detected items.");
            const fallbackProducts = rawItems.map(item => ({
                id: item.productId,
                title: (item.title || item.productTitle || "").trim(),
                price: parseFloat(item.price?.salePrice || item.prices?.salePrice || 0),
                image: item.productImage || item.imageUrl || "",
                source: "aliexpress",
                url: item.productDetailUrl || `https://www.aliexpress.com/item/${item.productId}.html`,
                rating: parseFloat(item.starRating || 0)
            })).filter(i => i.title);
            if (fallbackProducts.length > 0) return { status: "SUCCESS", source: "aliexpress", products: fallbackProducts };
        }

        console.warn("[Ali-Parser] Failure: No products found in DOM or state.");
        return { status: "FAILED", error: "EMPTY_LISTING", source: "aliexpress", products: [] };

    } catch (e) {
        console.error("[Ali-Parser] Critical Failure:", e.message);
        return { status: "FAILED", error: "PARSER_FAILURE", message: e.message, source: "aliexpress", products: [] };
    }
})();
