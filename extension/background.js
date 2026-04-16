/**
 * Drop-AI Background Engine (v21.0 - Trace Hardened)
 */

console.log("[Drop-AI Worker] v21.0 Trace Engine Active");

// 1. UNIFIED MESSAGE ROUTER (v21.0)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "PING" || request.type === "EXT_PING") {
        sendResponse({ status: "PONG", active: true });
        return true;
    }

    if (request.type === "SUPPLIER_SEARCH" || request.type === "EXT_SEARCH_REQUEST") {
        console.log(`[Drop-AI Worker] Trace (1/4): Received Search -> ${request.query} (${request.source})`);
        
        handleSearch(request)
            .then(result => {
                const count = result.products?.length || 0;
                console.log(`[Drop-AI Worker] Trace (4/4): Response Ready -> ${result.status} | Products: ${count}`);
                sendResponse(result);
            })
            .catch(err => {
                console.error("[Drop-AI Worker] Pipeline Crash:", err.message);
                sendResponse({
                    status: "FAILED",
                    error: "PIPELINE_ERROR",
                    message: err.message,
                    requestId: request.requestId,
                    source: request.source,
                    products: []
                });
            });
        return true; // Keep channel open for async
    }

    sendResponse({ status: "FAILED", error: "UNKNOWN_MESSAGE_TYPE" });
    return true;
});

// 2. EXTERNAL ROUTER (v21.0)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request.type === "PING") {
        sendResponse({ status: "PONG", active: true });
        return true;
    }
    if (request.type === "SUPPLIER_SEARCH") {
        handleSearch(request).then(sendResponse).catch(err => sendResponse({ status: "FAILED", error: err.message }));
        return true;
    }
});

/**
 * DETERMINISTIC SEARCH EXECUTION
 */
async function handleSearch(request) {
    const { source, query, requestId } = request;
    let tabId = null;

    try {
        let url = source === 'aliexpress' 
            ? `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`
            : `https://eprolo.com/app/newProductsCatalog.html?type=us`;

        console.log(`[Drop-AI Worker] Trace (2/4): Creating Silent Tab -> ${source}`);
        const tab = await chrome.tabs.create({ url, active: false });
        tabId = tab.id;

        // Optimized Wait Sequence
        await new Promise(r => setTimeout(r, 4000));

        // Eprolo DOM Search Injection
        if (source === 'eprolo') {
            await chrome.scripting.executeScript({
                target: { tabId },
                func: (q) => {
                    const input = document.querySelector('input.el-input__inner[placeholder*="Search"]');
                    const btn = Array.from(document.querySelectorAll('div, span, button')).find(el => el.innerText?.trim() === "Search");
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

        console.log(`[Drop-AI Worker] Trace (3/4): Injecting ${source} Parser`);
        const file = source === 'aliexpress' ? 'parsers/ali_parser.js' : 'parsers/eprolo_parser.js';
        const rawResults = await chrome.scripting.executeScript({
            target: { tabId },
            files: [file]
        });

        const extractionResult = rawResults?.[0]?.result ?? {
            status: "FAILED",
            error: "NO_PARSER_RESULT",
            source,
            products: []
        };

        return {
            ...extractionResult,
            requestId,
            source
        };

    } finally {
        if (tabId) {
            chrome.tabs.remove(tabId).catch(() => {});
        }
    }
}
