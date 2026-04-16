/**
 * Drop-AI Extension Connector Service (v19.6 - Hybrid Identity Bridge)
 * FEATURES: Direct Identity PING (via ID), Static Detection, and Message Relay.
 */

// User-provided stable Extension ID for live testing
const EXT_ID = "dbboapfmlgjakkmedihbokcgaogcihcd";

class ExtensionConnector {
    constructor() {
        this.pendingRequests = new Map();
        this.pongResolvers = [];
        this.isInitialized = false;

        if (typeof window !== "undefined") {
            window.addEventListener("message", this.handleMessage.bind(this));
            this.isInitialized = true;
            console.log(`[Ext-Connector] Production Bridge v19.6 Active (Target: ${EXT_ID})`);
        }
    }

    /**
     * HYBRID DETECTION (v19.6)
     */
    async isExtensionActive() {
        // 1. Direct Identity Channel (Most Reliable for Live)
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
            try {
                const response = await new Promise((resolve) => {
                    chrome.runtime.sendMessage(EXT_ID, { type: "EXT_PING" }, (res) => {
                        if (chrome.runtime.lastError) resolve(null);
                        else resolve(res);
                    });
                });
                if (response?.type === "EXT_PONG") {
                    console.log("[Ext-Connector] Extension reached via DIRECT IDENTITY BRIDGE.");
                    return true;
                }
            } catch (e) {
                console.warn("[Ext-Connector] Direct Identity Ping failed. Trying relay...");
            }
        }

        // 2. Level 2: Static Check
        if (typeof window !== "undefined" && window.__DROP_AI_BRIDGE_ACTIVE__) {
            console.log("[Ext-Connector] Extension reached via STATIC RELAY.");
            return true;
        }

        // 3. Level 3: Message-based Heartbeat (1s Tolerance)
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.pongResolvers = this.pongResolvers.filter(r => r !== resolver);
                resolve(false);
            }, 1000);

            const resolver = () => {
                clearTimeout(timer);
                resolve(true);
            };

            this.pongResolvers.push(resolver);
            window.postMessage({ type: "EXT_PING" }, "*");
        });
    }

    async testConnection() {
        return await this.isExtensionActive();
    }

    /**
     * REQUEST DATA FROM EXTENSION
     */
    async request(source, query) {
        if (!this.isInitialized) return { status: "INIT_ERROR", error: "Not in browser context" };

        let isActive = await this.isExtensionActive();
        if (!isActive) {
            console.error("[Ext-Connector] Extension NOT DETECTED.");
            return { status: "EXTENSION_NOT_LOADED", error: "Extension not detected" };
        }

        const maxAttempts = 2;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`[Ext-Connector] Attempt ${attempt}/${maxAttempts} for ${source}: ${query}`);
            
            try {
                // Try Direct Channel for Search too (If ID bridge is open)
                let response = null;
                if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
                    response = await new Promise((resolve) => {
                        chrome.runtime.sendMessage(EXT_ID, { 
                            type: "SUPPLIER_SEARCH", 
                            source, query, 
                            requestId: `${source}_direct_${Date.now()}` 
                        }, resolve);
                    });
                }

                // If Direct Channel failed or not available, use Relay
                if (!response || response.status === "FAILED") {
                    response = await this.singleRequest(source, query, 10000);
                }

                if (response.status === "SUCCESS") return response;
                
                if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 1000));

            } catch (e) {
                console.error(`[Ext-Connector] Crash:`, e);
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

        if (event.data.type === "EXT_PONG") {
            const resolvers = [...this.pongResolvers];
            this.pongResolvers = [];
            resolvers.forEach(r => r());
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
