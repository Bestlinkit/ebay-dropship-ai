/**
 * AliExpress Parser (v19.2)
 * DETERMINISTIC EXTRACTION (No sleeps)
 */

(function extractAliData() {
    try {
        console.log("[Ali-Parser] v20.0 DOM-First Extraction...");

        // 1. PAGE TYPE GUARD (MANDATORY)
        if (window.location.href.includes('/item/')) {
            console.warn("[Ali-Parser] Redirected to Item Page. Rejecting.");
            return { status: "FAILED", error: "WRONG_PAGE_TYPE", source: "aliexpress" };
        }

        // 2. DOM-FIRST LISTING EXTRACTION
        // AliExpress uses different classes for listings. We try common ones.
        const cards = Array.from(document.querySelectorAll('a.search-card-item, div.multi--content--27-mG9D, .list-item, [class*="product-card"]'));
        
        const mapped = cards.map(card => {
            try {
                // Title
                const titleEl = card.querySelector('h1, h3, div[class*="title"], div.multi--title--17ia79C');
                const title = titleEl?.innerText?.trim() || card.getAttribute('aria-label');
                
                // Price
                const priceEl = card.querySelector('div[class*="price-current"], div.multi--price-sale--1_vS_91, [class*="price"]');
                const priceMatch = (priceEl?.innerText || "").match(/[\d.]+/);
                const price = priceMatch ? parseFloat(priceMatch[0]) : 0;

                // Image
                const imgEl = card.querySelector('img');
                const image = imgEl?.src || "";

                // Rating (ALi-specific)
                const ratingEl = card.querySelector('div[class*="rating"], span[class*="rating"], div.multi--star--2-O1e_J');
                const ratingMatch = (ratingEl?.innerText || "").match(/[\d.]+/);
                const rating = ratingMatch ? parseFloat(ratingMatch[0]) : 0;

                // URL
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
                    rating,
                    status: "SUCCESS"
                };
            } catch (e) { return null; }
        }).filter(i => i && i.title.length > 5);

        if (mapped.length > 0) {
            console.log(`[Ali-Parser] Successfully extracted ${mapped.length} listings.`);
            return { status: "SUCCESS", source: "aliexpress", data: mapped };
        }

        // 3. RUNPARAMS FALLBACK (Deterministic Legacy)
        const runParams = window.runParams || {};
        const items = runParams.items || runParams.data?.items || runParams.mods?.itemList?.content || [];
        if (items.length > 0) {
            const legacyMapped = items.map(item => ({
                id: item.productId,
                title: (item.title || item.productTitle || "").trim(),
                price: parseFloat(item.price?.salePrice || item.prices?.salePrice || 0),
                image: item.productImage || item.imageUrl || "",
                source: "aliexpress",
                url: item.productDetailUrl || `https://www.aliexpress.com/item/${item.productId}.html`,
                rating: parseFloat(item.starRating || 0)
            })).filter(i => i.title);
            if (legacyMapped.length > 0) return { status: "SUCCESS", source: "aliexpress", data: legacyMapped };
        }

        return { status: "FAILED", error: "NO_LISTINGS_FOUND", source: "aliexpress" };

    } catch (e) {
        return { status: "FAILED", error: "PARSER_FAILURE", message: e.message, source: "aliexpress" };
    }
})();
