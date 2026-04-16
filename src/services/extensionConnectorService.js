/**
 * Drop-AI Extension Connector Service (v19.7 - Hardened Hybrid)
 * Synchronized with Deterministic Worker Architecture.
 */

const EXT_ID = "dbboapfmlgjakkmedihbokcgaogcihcd";

class ExtensionConnector {
    constructor() {
        this.pendingRequests = new Map();
        this.pongResolvers = [];
        this.isInitialized = false;

        if (typeof window !== "undefined") {
            window.addEventListener("message", this.handleMessage.bind(this));
            this.isInitialized = true;
            console.log(`[Ext-Connector] v19.7 Deterministic Bridge ready (ID: ${EXT_ID})`);
        }
    }

    /**
     * UNIFIED DETECTION (v19.7)
     */
    async isExtensionActive() {
        // 1. Direct Identity Channel (Tier 1 - Most Robust)
        if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
            try {
                const response = await new Promise((resolve) => {
                    chrome.runtime.sendMessage(EXT_ID, { type: "PING" }, (res) => {
                        if (chrome.runtime.lastError) resolve(null);
                        else resolve(res);
                    });
                });
                
                if (response?.status === "PONG") {
                    console.log("[Ext-Connector] Extension Verified via IDENTITY BRIDGE.");
                    return true;
                }
            } catch (e) {
                console.warn("[Ext-Connector] Identity Ping failed, trying relay...");
            }
        }

        // 2. Static Flag (Tier 2 - Zero Latency)
        if (typeof window !== "undefined" && window.__DROP_AI_BRIDGE_ACTIVE__) {
            console.log("[Ext-Connector] Extension Verified via STATIC FLAG.");
            return true;
        }

        // 3. PostMessage Heartbeat (Tier 3 - Fallback)
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.pongResolvers = this.pongResolvers.filter(r => r !== resolver);
                resolve(false);
            }, 1000);

            const resolver = (data) => {
                clearTimeout(timer);
                if (data?.status === "PONG") resolve(true);
                else resolve(false);
            };

            this.pongResolvers.push(resolver);
            window.postMessage({ type: "PING" }, "*");
        });
    }

    async testConnection() {
        return await this.isExtensionActive();
    }

    async request(source, query) {
        if (!this.isInitialized) return { status: "INIT_ERROR", error: "Not in browser context" };

        let isActive = await this.isExtensionActive();
        if (!isActive) return { status: "EXTENSION_NOT_LOADED", error: "Extension not detected" };

        const maxAttempts = 2;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Try Direct Channel for Search (If identity bridge confirmed)
                let response = null;
                if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
                    response = await new Promise((resolve) => {
                        chrome.runtime.sendMessage(EXT_ID, { 
                            type: "SUPPLIER_SEARCH", 
                            source, query, 
                            requestId: `${source}_direct_${Date.now()}` 
                        }, resolve);
                    });
                }

                // Fallback to Relay
                if (!response || response.status === "FAILED") {
                    response = await this.singleRequest(source, query, 12000);
                }

                if (response.status === "SUCCESS") return response;
                if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 1000));

            } catch (e) {
                if (attempt === maxAttempts) throw e;
            }
        }

        return { status: "FAILED", error: `Failed after ${maxAttempts} attempts.` };
    }

    async singleRequest(source, query, timeout) {
        const requestId = `${source}_relay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    resolve({ status: "TIMEOUT", error: "RELAY_HANG", source });
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

    handleMessage(event) {
        if (event.source !== window || !event.data) return;

        // Unified PONG handler
        if (event.data.status === "PONG" || event.data.type === "EXT_PONG") {
            const resolvers = [...this.pongResolvers];
            this.pongResolvers = [];
            resolvers.forEach(r => r(event.data));
            return;
        }

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
