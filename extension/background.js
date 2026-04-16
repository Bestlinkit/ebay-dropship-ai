/**
 * Drop-AI Background Orchestration Engine (v20.0 - Core Sourcing Overhaul)
 */

console.log("[Drop-AI Worker Active] Engine v20.0 - Silent Sourcing Mode");

// 1. UNIFIED MESSAGE ROUTER
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(`[Drop-AI Worker] Request: ${request.type}`);
    
    switch (request.type) {
        case "PING":
        case "EXT_PING":
            sendResponse({ status: "PONG", active: true });
            return true;

        case "SUPPLIER_SEARCH":
        case "EXT_SEARCH_REQUEST":
            handleSearch(request)
                .then(sendResponse)
                .catch(err => {
                    console.error("[Drop-AI Worker] Search Failed:", err);
                    sendResponse({
                        status: "FAILED",
                        error: err.message,
                        requestId: request.requestId,
                        source: request.source
                    });
                });
            return true;

        default:
            sendResponse({ status: "FAILED", error: "UNKNOWN_MESSAGE_TYPE" });
            return true;
    }
});

// 2. EXTERNAL ROUTER
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    switch (request.type) {
        case "PING":
            sendResponse({ status: "PONG", active: true });
            return true;
        case "SUPPLIER_SEARCH":
            handleSearch(request).then(sendResponse).catch(err => sendResponse({ status: "FAILED", error: err.message }));
            return true;
        default:
            sendResponse({ status: "FAILED", error: "UNKNOWN" });
            return true;
    }
});

/**
 * DETERMINISTIC SEARCH EXECUTION (v20.0)
 */
async function handleSearch(request) {
    const { source, query, requestId } = request;
    console.log(`[Drop-AI Worker] Silent Search: ${source} -> ${query}`);

    let tabId = null;
    try {
        let url = "";
        if (source === 'aliexpress') {
            url = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`;
        } else {
            // Step 1: Navigate to Eprolo Catalog US-route directly
            url = `https://eprolo.com/app/newProductsCatalog.html?type=us`;
        }

        // 1. Create Control Tab (MANDATORY: active: false)
        const tab = await chrome.tabs.create({ url, active: false });
        tabId = tab.id;

        // 2. Wait for Page Load (3s robust)
        await new Promise(r => setTimeout(r, 3000));

        // 3. EPROLO SPECIFIC: DOM-Search Interaction
        if (source === 'eprolo') {
            await chrome.scripting.executeScript({
                target: { tabId },
                func: (q) => {
                    const input = document.querySelector('input.el-input__inner[placeholder*="Search"]');
                    const searchBtn = Array.from(document.querySelectorAll('div, span, button')).find(el => el.innerText?.trim() === "Search");
                    
                    if (input && searchBtn) {
                        input.value = q;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        searchBtn.click();
                        console.log("[Eprolo-DOM] Search Triggered for:", q);
                    }
                },
                args: [query]
            });
            // Additional wait for search results to render
            await new Promise(r => setTimeout(r, 2000));
        }

        // 4. Inject Parser
        const file = source === 'aliexpress' ? 'parsers/ali_parser.js' : 'parsers/eprolo_parser.js';
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            files: [file]
        });

        const extractionResult = results?.[0]?.result ?? {
            status: "FAILED",
            error: "PARSER_FAILURE",
            source
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
