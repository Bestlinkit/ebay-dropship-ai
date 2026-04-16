/**
 * Drop-AI App Bridge (v19.0)
 * Injected into http://localhost:5173 (React App)
 */

console.log("[Bridge] Initialized on App Domain.");

window.addEventListener("message", (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    if (event.data.type === "EXT_SEARCH_REQUEST") {
        const { source, query, requestId } = event.data;
        
        console.log(`[Bridge] Relaying ${source} search to Background...`);

        chrome.runtime.sendMessage({ type: "SUPPLIER_SEARCH", source, query, requestId }, (response) => {
            console.log(`[Bridge] Received response from Extension Core:`, response);
            
            // Send back to the React app
            window.postMessage({
                type: "SUPPLIER_DATA_RESPONSE",
                payload: response,
                requestId: requestId
            }, "*");
        });
    }
});
