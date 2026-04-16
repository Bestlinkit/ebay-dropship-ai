/**
 * Drop-AI Background Orchestration Engine (v19.7 - DETERMINISTIC API LAYER)
 */

console.log("[Drop-AI Worker Active] Engine v19.7");

// 1. UNIFIED MESSAGE ROUTER (CRITICAL - Guaranteed Response Path)
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
                .then(result => {
                    console.log("[Drop-AI Worker] Search Success");
                    sendResponse(result);
                })
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
            sendResponse({
                status: "FAILED",
                error: "UNKNOWN_MESSAGE_TYPE"
            });
            return true;
    }
});

// 2. HARDENED EXTERNAL ROUTER (ID-based Direct Channel)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    console.log(`[Drop-AI Worker] External Request from ${sender.url}: ${request.type}`);
    
    switch (request.type) {
        case "PING":
            sendResponse({ status: "PONG", active: true });
            return true;

        case "SUPPLIER_SEARCH":
            handleSearch(request)
                .then(sendResponse)
                .catch(err => sendResponse({
                    status: "FAILED",
                    error: err.message,
                    requestId: request.requestId,
                    source: request.source
                }));
            return true;

        default:
            sendResponse({ status: "FAILED", error: "UNKNOWN_MESSAGE_TYPE" });
            return true;
    }
});

/**
 * DETERMINISTIC SEARCH EXECUTION
 */
async function handleSearch(request) {
    const { source, query, requestId } = request;
    console.log(`[Drop-AI Worker] Executing ${source} search: ${query}`);

    let tabId = null;
    try {
        const url = source === 'aliexpress' 
            ? `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`
            : `https://www.eprolo.com/all-products.html?keyword=${encodeURIComponent(query)}`;

        // 1. Create Control Tab
        const tab = await chrome.tabs.create({ url, active: true });
        tabId = tab.id;

        // 2. DETERMINISTIC Micro-wait (2s) - Adjust if needed
        await new Promise(r => setTimeout(r, 2000));

        // 3. Inject & Extract
        const file = source === 'aliexpress' ? 'parsers/ali_parser.js' : 'parsers/eprolo_parser.js';
        
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            files: [file]
        });

        // 4. HARDEN executeScript RESULT HANDLING (v19.7)
        const extractionResult = results?.[0]?.result ?? {
            status: "FAILED",
            error: "NO_PARSER_RESULT",
            source
        };

        return {
            ...extractionResult,
            requestId,
            source
        };

    } finally {
        // ALWAYS CLOSE TAB (Atomic Lifecycle)
        if (tabId) {
            chrome.tabs.remove(tabId).catch(err => console.warn("[Drop-AI Worker] Cleanup Warning:", err.message));
        }
    }
}
