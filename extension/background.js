/**
 * Drop-AI Background Engine (v21.2 - Final Stabilization)
 * Rules: strictly active:false, strict status mapping.
 */

console.log("[Drop-AI Worker] v21.2 - Reset Directive Active");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "PING" || request.type === "EXT_PING") {
        console.log("[Drop-AI Worker] PING received. Sending PONG.");
        sendResponse({ status: "SUCCESS", pong: true, version: "v21.3" });
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
    const { source, query } = request;
    let tabId = null;

    try {
        const url = source === 'aliexpress' 
            ? `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`
            : `https://eprolo.com/app/newProductsCatalog.html?type=us`;

        // HIGH-FIDELITY SILENT TAB (v21.2)
        const tab = await chrome.tabs.create({ 
            url, 
            active: false, // MANDATORY: Background mode
            pinned: false
        });
        tabId = tab.id;

        // Trace (not focus-stealing)
        console.log(`[Drop-AI Worker] Silent tab ${tabId} created for ${source}`);

        // Wait strategy (standardized)
        await new Promise(r => setTimeout(r, 6000));

        // Inject Search for Eprolo (since it's a single catalog page)
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
            await new Promise(r => setTimeout(r, 3000));
        }

        // Run standardized parser
        const file = source === 'aliexpress' ? 'parsers/ali_parser.js' : 'parsers/eprolo_parser.js';
        const rawResults = await chrome.scripting.executeScript({
            target: { tabId },
            files: [file]
        });

        const result = rawResults?.[0]?.result;
        if (!result) return { status: "ERROR", source, products: [] };

        // Ensure status mapping is strict (v21.2 Directive)
        if (result.status === "FAILED") result.status = "ERROR";
        if (result.error === "BLOCKED_DOM") result.status = "BLOCKED";
        
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
