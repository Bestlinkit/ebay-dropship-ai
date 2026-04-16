/**
 * Drop-AI Background Orchestration Engine (v19.4)
 * FAST-PATH DETERMINISTIC LIFECYCLE
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "SUPPLIER_SEARCH") {
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
        return true;
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
        // 1. OPEN TAB (Faster create & active)
        const tab = await chrome.tabs.create({ url: targetUrl, active: true });
        tabId = tab.id;

        // 2. LOOSER WAIT (Wait 1.5s max vs 10s 'complete')
        // [v19.4] Most pages are interactive enough after 1.5-2.5s to extract runParams.
        await new Promise(r => setTimeout(r, 2000));

        // 3. ATOMIC INJECTION
        const parserFile = source === "aliexpress" ? "parsers/ali_parser.js" : "parsers/eprolo_parser.js";
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            files: [parserFile]
        });

        const extractionResult = results?.[0]?.result;

        // 4. CLEANUP (ALWAYS)
        if (tabId) await chrome.tabs.remove(tabId);

        if (!extractionResult) throw new Error("EXTRACTION_NULL");
        
        return { ...extractionResult, requestId };

    } catch (e) {
        if (tabId) chrome.tabs.remove(tabId).catch(() => {});
        return { status: "FAILED", error: e.message, requestId };
    }
}
