/**
 * Drop-AI Background Orchestration Engine (v19.2)
 * GUARANTEED DETERMINISTIC LIFECYCLE
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "SUPPLIER_SEARCH") {
        // [v19.2] GUARANTEED RESPONSE PATH
        (async () => {
            try {
                const result = await handleSearch(request);
                sendResponse(result);
            } catch (err) {
                console.error("[Bridge-BG] Critical Error:", err);
                sendResponse({ 
                    status: "FAILED", 
                    error: err.message, 
                    requestId: request.requestId 
                });
            }
        })();
        return true; // Keep channel open
    }
});

async function handleSearch(request) {
    const { source, query, requestId } = request;
    console.log(`[Bridge-BG] Executing ${source} search: ${query}`);

    let targetUrl = "";
    if (source === "aliexpress") {
        targetUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`;
    } else if (source === "eprolo") {
        targetUrl = `https://eprolo.com/app/newProductsCatalog.html?keyword=${encodeURIComponent(query)}&type=us`;
    }

    if (!targetUrl) return { status: "FAILED", error: "INVALID_SOURCE", requestId };

    let tabId = null;

    try {
        // 1. OPEN TAB
        const tab = await chrome.tabs.create({ url: targetUrl, active: true });
        tabId = tab.id;

        // 2. WAIT FOR COMPLETION (EVENT-BASED)
        await waitForTabComplete(tabId);

        // 3. INJECT & EXTRACT (ATOMIC)
        const parserFile = source === "aliexpress" ? "parsers/ali_parser.js" : "parsers/eprolo_parser.js";
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId },
            files: [parserFile]
        });

        // 4. CLEANUP (ALWAYS)
        if (tabId) await chrome.tabs.remove(tabId);

        return { ...result, requestId };

    } catch (e) {
        if (tabId) chrome.tabs.remove(tabId);
        return { status: "FAILED", error: e.message, requestId };
    }
}

/**
 * Deterministic Tab Load Wait
 */
function waitForTabComplete(tabId) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            reject(new Error("Tab load timed out (10s)"));
        }, 10000);

        const listener = (tid, changeInfo) => {
            if (tid === tabId && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                clearTimeout(timeout);
                resolve();
            }
        };

        chrome.tabs.onUpdated.addListener(listener);
    });
}
