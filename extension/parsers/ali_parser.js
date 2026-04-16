/**
 * AliExpress Parser (v19.2)
 * DETERMINISTIC EXTRACTION (No sleeps)
 */

(function extractAliData() {
    try {
        console.log("[Ali-Parser] Deterministic Extraction Initiated...");

        // Layer 1: SEARCH RESULTS (wholesale pages)
        const runParams = window.runParams || {};
        const items = runParams.items || 
                      runParams.data?.items || 
                      runParams.mods?.itemList?.content || 
                      [];

        if (items.length > 0) {
            const mapped = items.map(item => ({
                id: item.productId || item.product_id,
                title: (item.title || item.productTitle || item.subject || "").trim(),
                price: parseFloat(item.price?.salePrice || item.prices?.salePrice || item.minPrice || item.price || 0),
                currency: item.price?.currency || "USD",
                image: item.productImage || item.imageUrl || item.image || "",
                images: [item.productImage || item.imageUrl || item.image],
                source: "aliexpress",
                url: item.productDetailUrl || `https://www.aliexpress.com/item/${item.productId}.html`,
                rating: parseFloat(item.starRating || item.avgRating || item.evaluation?.starRating || 0),
                reviewCount: parseInt(item.tradeCount || item.feedbackCount || item.evaluation?.totalCount || 0),
                shipping: item.logistics?.shippingFee === 0 ? "Free Shipping" : (item.logistics?.amount || ""),
                variants: [],
            })).filter(i => i.title);

            if (mapped.length > 0) return { status: "SUCCESS", source: "aliexpress", data: mapped };
        }

        // Layer 2: PRODUCT DETAIL PAGE
        const detailParams = window._initial_data_ || window.runParams || {};
        if (detailParams.productConfig || detailParams.item) {
            const item = detailParams.item || detailParams.productConfig;
            return {
                status: "SUCCESS",
                source: "aliexpress",
                type: "DETAIL",
                data: [{
                    id: item.productId,
                    title: item.title,
                    price: parseFloat(item.price || 0),
                    images: detailParams.imageModule?.imagePathList || [],
                    variants: (detailParams.skuModule?.skuPriceList || []).map(s => ({
                        id: s.skuId,
                        price: parseFloat(s.skuVal?.skuAmount?.value || 0),
                        options: s.skuPropIds?.split(",") || []
                    }))
                }]
            };
        }

        // Layer 3: DOM FALLBACK
        const domItems = Array.from(document.querySelectorAll('.list-item, [class*="product-card"]')).map(el => {
            return {
                title: el.querySelector('h1, a[class*="title"]')?.innerText?.trim(),
                price: el.querySelector('[class*="price-value"]')?.innerText?.replace(/[^0-9.]/g, ''),
                image: el.querySelector('img')?.src,
                url: el.querySelector('a')?.href,
                source: "aliexpress"
            };
        }).filter(i => i.title);

        if (domItems.length > 0) {
            return { status: "SUCCESS", source: "aliexpress", data: domItems };
        }

        // NO DATA FOUND (Deterministic Failure)
        return { status: "FAILED", error: "DATA_NOT_RENDERED", source: "aliexpress" };

    } catch (e) {
        return { status: "FAILED", error: e.message, source: "aliexpress" };
    }
})();
