/**
 * Eprolo Parser (v19.2)
 * DETERMINISTIC EXTRACTION (No sleeps)
 */

(function extractEproloData() {
    try {
        console.log("[Eprolo-Parser] Deterministic Extraction Initiated...");

        const items = Array.from(document.querySelectorAll('.product-item, .product-list-item, div[class*="product"]')).map(el => {
            const titleEl = el.querySelector('h3, .title, a[class*="title"]');
            const priceEl = el.querySelector('.price, .wholesale-price, span[class*="price"]');
            const imageEl = el.querySelector('img');
            const linkEl = el.querySelector('a');

            if (!titleEl && !priceEl) return null;

            return {
                id: el.getAttribute('data-id') || el.getAttribute('product-id') || linkEl?.href?.match(/id=(\d+)/)?.[1] || Math.random().toString(36).substr(2, 9),
                title: (titleEl?.innerText || "Unnamed").trim(),
                price: parseFloat(priceEl?.innerText?.replace(/[^0-9.]/g, '') || 0),
                currency: "USD",
                image: imageEl?.src || "",
                images: [imageEl?.src],
                source: "eprolo",
                url: linkEl?.href || window.location.href,
                stock: el.querySelector('.stock, .inventory')?.innerText?.trim() || "In Stock",
                variants: [],
            };
        }).filter(i => i && i.title.length > 3);

        if (items.length > 0) {
            return { status: "SUCCESS", source: "eprolo", data: items };
        }

        // NO DATA FOUND (Deterministic Failure)
        return { status: "FAILED", error: "DATA_NOT_RENDERED", source: "eprolo" };

    } catch (e) {
        return { status: "FAILED", error: e.message, source: "eprolo" };
    }
})();
