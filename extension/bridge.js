/**
 * Drop-AI Bridge (v21.0 - Tracing Active)
 */

console.log("[DropAI-Bridge] v21.0 Relay Active");

window.__DROP_AI_BRIDGE_ACTIVE__ = true;

window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;

    // A. HEARTBEAT (v21.3 Real Handshake)
    if (event.data.type === "EXT_PING") {
        console.log("[DropAI-Bridge] Handshake Relay Initiated");
        chrome.runtime.sendMessage({ type: "EXT_PING" }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("[DropAI-Bridge] Handshake Failed:", chrome.runtime.lastError.message);
                return; // Let the app timeout naturally
            }
            window.postMessage({ type: "EXT_PONG", ...response }, "*");
        });
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
