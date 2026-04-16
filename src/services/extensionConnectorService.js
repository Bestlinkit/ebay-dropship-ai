/**
 * Drop-AI Connector (v21.3 - Stabilization Handshake)
 * Implements deterministic PING -> PONG check before every search.
 */

class ExtensionConnector {
    constructor() {
        this.pendingRequests = new Map();
        this.isInitialized = false;
        this.connectionState = "NOT_INSTALLED";

        if (typeof window !== "undefined") {
            window.addEventListener("message", this.handleMessage.bind(this));
            this.isInitialized = true;
            console.log("[Ext-Connector] v21.3 Handshake Service Primed");
        }
    }

    /**
     * Active Handshake Protocol
     * Forces background script wake-up and verification.
     */
    async testConnection() {
        if (!this.isInitialized) return "NOT_INSTALLED";
        
        // Initial detection: Is bridge even loaded?
        if (!window.__DROP_AI_BRIDGE_ACTIVE__) {
            this.connectionState = "NOT_INSTALLED";
            return "NOT_INSTALLED";
        }

        console.log("[Ext-Connector] Handshake Initiated...");

        return new Promise((resolve) => {
            const requestId = `ping_${Date.now()}`;
            
            const timeoutId = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    this.connectionState = "TIMEOUT";
                    console.warn("[Ext-Connector] Handshake Timeout (2s)");
                    resolve("TIMEOUT");
                }
            }, 2000); // Strict 2s handshake window

            this.pendingRequests.set(requestId, { resolve, timeoutId });

            window.postMessage({
                type: "EXT_PING",
                requestId
            }, "*");
        });
    }

    async request(source, query) {
        if (!this.isInitialized) return { status: "INIT_ERROR", products: [] };

        // 1. MANDATORY HANDSHAKE before every search
        const health = await this.testConnection();
        if (health !== "CONNECTED") {
            return { status: "CONNECTION_ERROR", detail: health, products: [] };
        }

        const requestId = `${source}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        console.log(`[Ext-Connector] Requesting ${source} -> "${query}"`);

        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    resolve({ status: "TIMEOUT", error: "RELAY_HANG", source, products: [] });
                }
            }, 30000); 

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

        // HEARTBEAT RESPONSE
        if (event.data.type === "EXT_PONG") {
            console.log("[Ext-Connector] Handshake: CONNECTED");
            this.connectionState = "CONNECTED";
            
            // Resolve any pending ping
            for (const [id, req] of this.pendingRequests.entries()) {
                if (id.startsWith('ping_')) {
                    clearTimeout(req.timeoutId);
                    this.pendingRequests.delete(id);
                    req.resolve("CONNECTED");
                }
            }
            return;
        }

        // SEARCH RESPONSE
        if (event.data.type === "EXT_SEARCH_RESPONSE") {
            const { requestId, status, products, data, error } = event.data;
            const finalProducts = products || data || [];
            
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
