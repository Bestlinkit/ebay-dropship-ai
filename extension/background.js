/**
 * Drop-AI Background Engine (v21.5 - Inline Determination)
 * Rules: strictly active:false, functional injection, DOM-polling.
 */

console.log("[Drop-AI Worker] v21.5 - Inline Scripting Active");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        console.log("[Drop-AI DEBUG] MESSAGE RECEIVED", request);
    } catch (e) {
        console.error("[Drop-AI CRASH]", e);
    }

    if (request.type === "PING" || request.type === "EXT_PING") {
        console.log("[Drop-AI Worker] PING received. Sending PONG.");
        sendResponse({ status: "SUCCESS", pong: true, version: "v21.5" });
        return true;
    }

    if (request.type === "SUPPLIER_SEARCH" || request.type === "EXT_SEARCH_REQUEST") {
        console.log(`[Drop-AI Worker] Handling search: ${request.query} (${request.source})`);
        
        handleSearch(request)
            .then(sendResponse)
            .catch(err => {
                console.error("[Drop-AI Worker] Fatal Error:", err.message);
                sendResponse({
                    status: "ERROR",
                    error: "SYSTEM_ERROR",
                    source: request.source,
                    products: []
                });
            });
        return true; 
    }
});

async function handleSearch(request) {
    console.log("[Drop-AI DEBUG] handleSearch ENTERED", request);
    const { source, query } = request;
    let tabId = null;

    try {
        const url = source === 'aliexpress' 
            ? `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`
            : `https://eprolo.com/app/newProductsCatalog.html?type=us`;

        console.log("[Drop-AI DEBUG] ABOUT TO OPEN TAB", source, query);
        
        const tab = await chrome.tabs.create({ url, active: false });
        tabId = tab.id;

        // ⏱️ Reduced initial wait (allow network to start)
        await new Promise(r => setTimeout(r, 2000));

        // Inject Search for Eprolo
        if (source === 'eprolo') {
            await chrome.scripting.executeScript({
                target: { tabId },
                func: (q) => {
                    const input = document.querySelector('input[placeholder*="Search"]');
                    const btn = Array.from(document.querySelectorAll('button, div, span')).find(el => el.innerText?.trim() === "Search");
                    if (input && btn) {
                        input.value = q;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        btn.click();
                    }
                },
                args: [query]
            });
            await new Promise(r => setTimeout(r, 2000));
        }

        // 🚀 RUN DETERMINISTIC INLINE PARSER
        const parserFunc = source === 'aliexpress' ? extractAliExpressData : extractEproloData;
        
        const rawResults = await chrome.scripting.executeScript({
            target: { tabId },
            func: parserFunc
        });

        const result = rawResults?.[0]?.result;
        console.log("[Drop-AI DEBUG] PARSER RETURNED", result);

        if (!result) {
            console.error("[Drop-AI DEBUG] Parser returned undefined/null");
            return { status: "ERROR", source, error: "UNDEFINED_RETURN", products: [] };
        }
        
        return {
            status: result.status || "SUCCESS",
            source,
            products: result.products || []
        };

    } catch (e) {
        console.error(`[Drop-AI Worker] Exception in ${source}:`, e.message);
        return { status: "ERROR", source, products: [] };
    } finally {
        if (tabId) {
            chrome.tabs.remove(tabId).catch(() => {});
        }
    }
}

/**
 * ALIEXPRESS PARSER (Inlined v21.5)
 * Feature: DOM-polling up to 10s
 */
async function extractAliExpressData() {
    console.log("[Ali-Parser] Inline Execution Started...");
    
    // 1. POLLING HELPER
    const waitForSelector = (selector, timeout = 8000) => {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (el) return resolve(true);
                if (Date.now() - start > timeout) return resolve(false);
                setTimeout(check, 500);
            };
            check();
        });
    };

    if (window.location.href.includes('/item/')) {
        return { status: "ERROR", error: "WRONG_PAGE_TYPE", products: [] };
    }

    // Wait for at least one card or JSON block to be ready
    await waitForSelector('a.search-card-item, [class*="product-card"], script[type="application/json"]');

    let rawItems = [];

    // TIER 1: window.runParams
    if (window.runParams) {
        rawItems = window.runParams.items || window.runParams.data?.items || window.runParams.mods?.itemList?.content || [];
    }

    // TIER 2: window.__DATA__
    if (rawItems.length === 0 && window.__DATA__) {
        rawItems = window.__DATA__.items || window.__DATA__.data?.items || [];
    }

    // TIER 3: application/json scripts
    if (rawItems.length === 0) {
        const scripts = Array.from(document.querySelectorAll('script[type="application/json"]'));
        for (const script of scripts) {
            try {
                const data = JSON.parse(script.textContent);
                const found = data.items || data.data?.items || data.mods?.itemList?.content;
                if (found && Array.isArray(found)) {
                    rawItems = found;
                    break;
                }
            } catch (e) {}
        }
    }

    if (rawItems.length > 0) {
        const products = rawItems.map(item => {
            const title = (item.title || item.productTitle || item.name || "").trim();
            const price = parseFloat(item.price?.salePrice || item.prices?.salePrice || item.minPrice || 0);
            const image = item.productImage || item.imageUrl || item.image || "";
            const id = item.productId || item.id;
            return {
                id: id ? String(id) : Math.random().toString(36).substr(2, 9),
                title, price, image, source: "aliexpress",
                url: item.productDetailUrl || `https://www.aliexpress.com/item/${id}.html`,
                rating: parseFloat(item.starRating || item.rating || 0)
            };
        }).filter(i => i.title && i.price > 0);
        if (products.length > 0) return { status: "SUCCESS", products };
    }

    // TIER 4: Fallback DOM
    const cards = Array.from(document.querySelectorAll('a.search-card-item, div.multi--content--27-mG9D, .list-item, [class*="product-card"]'));
    const domProducts = cards.map(card => {
        try {
            const titleEl = card.querySelector('h1, h3, div[class*="title"], div.multi--title--17ia79C');
            const priceEl = card.querySelector('div[class*="price-current"], div.multi--price-sale--1_vS_91, [class*="price"]');
            const imgEl = card.querySelector('img');
            const linkEl = card.tagName === 'A' ? card : card.querySelector('a');
            const priceMatch = (priceEl?.innerText || "").match(/[\d.]+/);
            const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
            if (!titleEl?.innerText || !price) return null;
            return {
                id: Math.random().toString(36).substr(2, 9),
                title: titleEl.innerText.trim(),
                price,
                image: imgEl?.src || "",
                source: "aliexpress",
                url: linkEl?.href || "#"
            };
        } catch (e) { return null; }
    }).filter(i => i !== null);

    if (domProducts.length > 0) return { status: "SUCCESS", products: domProducts };
    return { status: "EMPTY", products: [] };
}

/**
 * EPROLO PARSER (Inlined v21.5)
 * Feature: DOM-polling up to 10s
 */
async function extractEproloData() {
    const waitForSelector = (selector, timeout = 8000) => {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (el) return resolve(true);
                if (Date.now() - start > timeout) return resolve(false);
                setTimeout(check, 500);
            };
            check();
        });
    };

    await waitForSelector('.product-item, .product-card, .el-card');

    const items = Array.from(document.querySelectorAll('.product-item, .product-card, .el-card, [class*="product-list-item"]'));
    const products = items.map(el => {
        try {
            const titleEl = el.querySelector('h3, h6, .product-title, .title, a[class*="name"]');
            const priceEl = Array.from(el.querySelectorAll('span, div, p')).find(s => s.innerText?.includes('$') || s.innerText?.includes('USD'));
            const image = el.querySelector('img')?.src || "";
            const priceMatch = (priceEl?.innerText || "").match(/[\d.]+/);
            const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
            if (!titleEl?.innerText || !image) return null;
            return {
                id: Math.random().toString(36).substr(2, 9),
                title: titleEl.innerText.trim(),
                price, image, source: "eprolo",
                url: el.querySelector('a')?.href || window.location.href
            };
        } catch (e) { return null; }
    }).filter(i => i !== null);

    return products.length > 0 
        ? { status: "SUCCESS", products }
        : { status: "EMPTY", products: [] };
}
