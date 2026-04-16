/**
 * Drop-AI Bridge (v21.0 - Tracing Active)
 */

console.log("[DropAI-Bridge] v21.0 Relay Active");

window.__DROP_AI_BRIDGE_ACTIVE__ = true;

window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;

    // A. HEARTBEAT
    if (event.data.type === "EXT_PING") {
        window.postMessage({ type: "EXT_PONG" }, "*");
        return;
    }

    // B. SEARCH RELAY (v21.0 Hardened)
    if (event.data.type === "EXT_SEARCH_REQUEST") {
        console.log(`[DropAI-Bridge] Trace (1/2): Relay Request -> ${event.data.query}`);
        
        chrome.runtime.sendMessage(event.data, (response) => {
            if (chrome.runtime.lastError) {
                console.error("[DropAI-Bridge] Messaging Error:", chrome.runtime.lastError.message);
                window.postMessage({
                    type: "EXT_SEARCH_RESPONSE",
                    requestId: event.data.requestId,
                    status: "FAILED",
                    error: "EXTENSION_COMM_ERROR",
                    products: []
                }, "*");
                return;
            }
            
            console.log(`[DropAI-Bridge] Trace (2/2): Relay Response -> ${response?.status}`);
            window.postMessage({
                type: "EXT_SEARCH_RESPONSE",
                ...response
            }, "*");
        });
    }
});
