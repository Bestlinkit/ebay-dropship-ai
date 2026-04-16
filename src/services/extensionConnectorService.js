/**
 * Drop-AI Extension Connector Service (v19.0)
 * Singleton to manage the window.postMessage bridge with the Chrome Extension.
 */

class ExtensionConnector {
    constructor() {
        this.pendingRequests = new Map();
        this.isInitialized = false;

        // BIND LISTENER
        if (typeof window !== "undefined") {
            window.addEventListener("message", this.handleMessage.bind(this));
            this.isInitialized = true;
            console.log("[Ext-Connector] Listening for Bridge Responses...");
        }
    }

    /**
     * REQUEST DATA FROM EXTENSION
     * @param {string} source - 'aliexpress' | 'eprolo'
     * @param {string} query - The search keyword
     * @param {number} timeout - Fail limit (ms)
     */
    async request(source, query, timeout = 20000) {
        if (!this.isInitialized) return { status: "INIT_ERROR", error: "Not in browser context" };

        const requestId = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        return new Promise((resolve) => {
            // 1. SETUP TIMEOUT
            const timer = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    console.error(`[Ext-Connector] Request ${requestId} TIMEOUT.`);
                    this.pendingRequests.delete(requestId);
                    resolve({ 
                        status: "TIMEOUT", 
                        error: "Extension did not respond in time.",
                        source 
                    });
                }
            }, timeout);

            // 2. REGISTER PENDING REQUEST
            this.pendingRequests.set(requestId, { resolve, timer });

            // 3. SEND TO BRIDGE
            console.log(`[Ext-Connector] Sending REQUEST ${requestId} for ${query}...`);
            window.postMessage({
                type: "EXT_SEARCH_REQUEST",
                source,
                query,
                requestId
            }, "*");
        });
    }

    /**
     * HANDLE RESPONSES FROM BRIDGE
     */
    handleMessage(event) {
        if (event.source !== window || event.data.type !== "SUPPLIER_DATA_RESPONSE") return;

        const { payload, requestId } = event.data;
        
        if (this.pendingRequests.has(requestId)) {
            const { resolve, timer } = this.pendingRequests.get(requestId);
            clearTimeout(timer);
            
            console.log(`[Ext-Connector] Received SUCCESS for ${requestId}. Result count: ${payload.data?.length || 0}`);
            
            this.pendingRequests.delete(requestId);
            resolve(payload);
        }
    }
}

export default new ExtensionConnector();
