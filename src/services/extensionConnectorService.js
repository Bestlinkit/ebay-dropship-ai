/**
 * Drop-AI Connector (v21.0 - Tracing Hardened)
 */

class ExtensionConnector {
    constructor() {
        this.pendingRequests = new Map();
        this.isInitialized = false;

        if (typeof window !== "undefined") {
            window.addEventListener("message", this.handleMessage.bind(this));
            this.isInitialized = true;
            console.log("[Ext-Connector] v21.0 Trace Bridge Active");
        }
    }

    async isExtensionActive() {
        if (typeof window !== "undefined" && window.__DROP_AI_BRIDGE_ACTIVE__) return true;
        return false; 
    }

    async request(source, query) {
        if (!this.isInitialized) return { status: "INIT_ERROR", products: [] };

        let isActive = await this.isExtensionActive();
        if (!isActive) return { status: "EXTENSION_NOT_LOADED", products: [] };

        const requestId = `${source}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        console.log(`[Ext-Connector] Trace (1/2): Requesting ${source} -> "${query}"`);

        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    console.error(`[Ext-Connector] Timeout: ${requestId}`);
                    this.pendingRequests.delete(requestId);
                    resolve({ status: "TIMEOUT", error: "RELAY_HANG", source, products: [] });
                }
            }, 30000); // 30s timeout for sourcing

            this.pendingRequests.set(requestId, { resolve, timeoutId });

            window.postMessage({
                type: "EXT_SEARCH_REQUEST",
                source,
                query,
                requestId
            }, "*");
        });
    }

    handleMessage(event) {
        if (event.source !== window || !event.data) return;

        if (event.data.type === "EXT_SEARCH_RESPONSE") {
            const { requestId, status, products, data, error } = event.data;
            
            // Map 'data' to 'products' if extension is using old schema
            const finalProducts = products || data || [];
            
            console.log(`[Ext-Connector] Trace (2/2): Response <- ${status} | Count: ${finalProducts.length}`);

            if (this.pendingRequests.has(requestId)) {
                const { resolve, timeoutId } = this.pendingRequests.get(requestId);
                clearTimeout(timeoutId);
                this.pendingRequests.delete(requestId);
                resolve({ status, products: finalProducts, error });
            }
        }
    }
}

export default new ExtensionConnector();
