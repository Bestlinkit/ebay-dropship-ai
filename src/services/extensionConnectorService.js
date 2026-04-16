/**
 * Drop-AI Extension Connector Service (v19.5)
 * Singleton to manage the window.postMessage bridge with the Chrome Extension.
 * FEATURES: Dual-Layer Heartbeat (Static + Message), Connection Recovery.
 */

class ExtensionConnector {
    constructor() {
        this.pendingRequests = new Map();
        this.pongResolvers = [];
        this.isInitialized = false;

        if (typeof window !== "undefined") {
            window.addEventListener("message", this.handleMessage.bind(this));
            this.isInitialized = true;
            console.log("[Ext-Connector] Resilient Connector v19.5 Ready");
        }
    }

    /**
     * DUAL-LAYER DETECTION (v19.5)
     */
    async isExtensionActive() {
        // 1. Level 1: Static Check (Zero Latency)
        if (typeof window !== "undefined" && window.__DROP_AI_BRIDGE_ACTIVE__) {
            console.log("[Ext-Connector] Extension detected via Static Flag.");
            return true;
        }

        // 2. Level 2: Message-based Heartbeat (1s Tolerance)
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.pongResolvers = this.pongResolvers.filter(r => r !== resolver);
                resolve(false);
            }, 1000); // Increased from 200ms to 1000ms

            const resolver = () => {
                clearTimeout(timer);
                resolve(true);
            };

            this.pongResolvers.push(resolver);
            window.postMessage({ type: "EXT_PING" }, "*");
        });
    }

    /**
     * Public Connection Test (For UI Retry)
     */
    async testConnection() {
        return await this.isExtensionActive();
    }

    /**
     * REQUEST DATA FROM EXTENSION
     */
    async request(source, query) {
        if (!this.isInitialized) return { status: "INIT_ERROR", error: "Not in browser context" };

        // 1. RESILIENT HEARTBEAT CHECK (v19.5 - with Retry)
        let isActive = false;
        for (let h = 0; h < 3; h++) {
            isActive = await this.isExtensionActive();
            if (isActive) break;
            if (h < 2) await new Promise(r => setTimeout(r, 500));
        }

        if (!isActive) {
            console.error("[Ext-Connector] Extension NOT DETECTED after 3 checks.");
            return { status: "EXTENSION_NOT_LOADED", error: "Extension not detected" };
        }

        const maxAttempts = 2;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`[Ext-Connector] Starting Attempt ${attempt}/${maxAttempts} for ${source}: ${query}`);
            
            try {
                const response = await this.singleRequest(source, query, 8000);

                if (response.status === "SUCCESS") return response;

                console.warn(`[Ext-Connector] Attempt ${attempt} FAILED:`, response.error || response.status);
                
                if (attempt < maxAttempts) {
                    await new Promise(r => setTimeout(r, 1000));
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
        if (event.source !== window || !event.data) return;

        // A. Handle Heartbeat PONG
        if (event.data.type === "EXT_PONG") {
            const resolvers = [...this.pongResolvers];
            this.pongResolvers = [];
            resolvers.forEach(r => r());
            return;
        }

        // B. Handle Search Response
        if (event.data.type === "EXT_SEARCH_RESPONSE") {
            const { requestId, status, data, error } = event.data;
            
            if (this.pendingRequests.has(requestId)) {
                const { resolve, timer } = this.pendingRequests.get(requestId);
                clearTimeout(timer);
                this.pendingRequests.delete(requestId);
                resolve({ status, data, error });
            }
        }
    }
}

export default new ExtensionConnector();
