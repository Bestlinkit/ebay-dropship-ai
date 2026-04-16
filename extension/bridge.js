/**
 * Drop-AI Project-to-Extension Bridge (v19.4)
 * Listens for window messages from the React app and relays to the background script.
 */

console.log("[DropAI-Bridge] Unified Bridge v19.4 Active");

// 1. Listen for project-side requests
window.addEventListener("message", (event) => {
    // SECURITY: Only accept messages from our own window
    if (event.source !== window) return;

    // A. HEARTBEAT (PING)
    if (event.data.type === "EXT_PING") {
        console.log("[DropAI-Bridge] Heartbeat PING received.");
        window.postMessage({ type: "EXT_PONG" }, "*");
        return;
    }

    // B. SEARCH REQUEST
    if (event.data.type === "EXT_SEARCH_REQUEST") {
        console.log("[DropAI-Bridge] Relay SEARCH:", event.data.query);
        
        // Relay to background.js
        chrome.runtime.sendMessage(event.data, (response) => {
            if (chrome.runtime.lastError) {
                console.error("[DropAI-Bridge] Messaging Error:", chrome.runtime.lastError.message);
                return;
            }
            
            // Send response back to project
            window.postMessage({
                type: "EXT_SEARCH_RESPONSE",
                ...response
            }, "*");
        });
    }
});
