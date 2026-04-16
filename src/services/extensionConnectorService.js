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
     * REQUEST DATA FROM EXTENSION (v19.2 - Deterministic with React Retries)
     * @param {string} source - 'aliexpress' | 'eprolo'
     * @param {string} query - The search keyword
     */
    async request(source, query) {
        if (!this.isInitialized) return { status: "INIT_ERROR", error: "Not in browser context" };

        const maxAttempts = 2;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`[Ext-Connector] Starting Attempt ${attempt}/${maxAttempts} for ${source}: ${query}`);
            
            try {
                const response = await this.singleRequest(source, query, 12000); // 12s stop

                // SUCCESS: Return immediately
                if (response.status === "SUCCESS") {
                    return response;
                }

                // FAILURE: LOG and RETRY if possible
                console.warn(`[Ext-Connector] Attempt ${attempt} FAILED:`, response.error || response.status);
                
                if (attempt < maxAttempts) {
                    console.log(`[Ext-Connector] Retrying in 1.5s...`);
                    await new Promise(r => setTimeout(r, 1500));
                }

            } catch (e) {
                console.error(`[Ext-Connector] Attempt ${attempt} CRASHED:`, e);
                if (attempt === maxAttempts) throw e;
            }
        }

        return { status: "FAILED", error: `Failed after ${maxAttempts} attempts.` };
    }

    /**
     * Single Attempt Logic
     */
    async singleRequest(source, query, timeout) {
        const requestId = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    resolve({ status: "TIMEOUT", error: "EXTENSION_HANG", source });
                }
            }, timeout);

            this.pendingRequests.set(requestId, { resolve, timer });

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
