/**
 * Drop-AI Background Orchestration Engine (v19.0)
 * Manages the lifecycle of supplier search sessions.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "SUPPLIER_SEARCH") {
        handleSearch(request).then(sendResponse);
        return true; // Keep message channel open for async response
    }
});

async function handleSearch(request) {
    const { source, query, requestId } = request;
    console.log(`[Bridge-BG] Initiating ${source} search for: ${query}`);

    let targetUrl = "";
    if (source === "aliexpress") {
        targetUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`;
    } else if (source === "eprolo") {
        targetUrl = `https://eprolo.com/app/newProductsCatalog.html?keyword=${encodeURIComponent(query)}&type=us`;
    }

    if (!targetUrl) return { error: "INVALID_SOURCE", requestId };

    try {
        // 1. CREATE VISIBLE TAB (Required for Ali automation-bypass)
        const tab = await chrome.tabs.create({ url: targetUrl, active: true });
        
        // 2. WAIT FOR COMPLETION (Polling or Message)
        const result = await waitForExtraction(tab.id, source);
        
        // 3. CLEANUP
        if (tab.id) chrome.tabs.remove(tab.id);

        return { ...result, requestId };

    } catch (e) {
        console.error(`[Bridge-BG] Extraction Crash:`, e);
        return { status: "EXTRACTION_FAILED", error: e.message, requestId };
    }
}

async function waitForExtraction(tabId, source) {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 30; // 15 seconds (500ms intervals)

        const checkInterval = setInterval(async () => {
            attempts++;
            
            try {
                // INJECT PARSER ON DEMAND
                const parserFile = source === "aliexpress" ? "parsers/ali_parser.js" : "parsers/eprolo_parser.js";
                
                const [{ result }] = await chrome.scripting.executeScript({
                    target: { tabId },
                    files: [parserFile]
                });

                if (result && result.status !== "PENDING") {
                    clearInterval(checkInterval);
                    resolve(result);
                }
            } catch (e) {
                // Tab might still be loading or cross-origin
                console.warn("[Bridge-BG] Script injection pending...");
            }

            if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                resolve({ status: "TIMEOUT", error: "Extraction took too long (15s limit)" });
            }
        }, 500);
    });
}
