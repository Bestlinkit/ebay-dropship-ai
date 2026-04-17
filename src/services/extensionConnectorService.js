/**
 * Drop-AI Connector (v22.0 - Direct External Bridge)
 * Communicates directly with the Extension using chrome.runtime.sendMessage.
 */

// 🚨 ACTUAL ID: Linked to your specific installation
const EXTENSION_ID = "dbboapfmlgjakkmedihbokcgaogcihcd"; 

class ExtensionConnector {
    constructor() {
        this.connectionState = "NOT_INSTALLED";
        this.isInitialized = typeof window !== "undefined" && !!window.chrome?.runtime?.sendMessage;
    }

    /**
     * Real Direct Handshake (v22.0)
     * Queries the extension background directly.
     */
    async testConnection() {
        if (!window.chrome?.runtime?.sendMessage) {
            this.connectionState = "NOT_INSTALLED";
            return "NOT_INSTALLED";
        }

        return new Promise((resolve) => {
            console.log("[Ext-Connector] Direct Heartbeat Initiated...");
            
            // Safety timeout
            const timer = setTimeout(() => {
                this.connectionState = "TIMEOUT";
                resolve("TIMEOUT");
            }, 500);

            try {
                chrome.runtime.sendMessage(EXTENSION_ID, { type: "PING" }, (response) => {
                    clearTimeout(timer);
                    if (chrome.runtime.lastError) {
                        console.warn("[Ext-Connector] Handshake Reject:", chrome.runtime.lastError.message);
                        this.connectionState = "DISCONNECTED";
                        resolve("DISCONNECTED");
                    } else if (response?.status === "SUCCESS") {
                        this.connectionState = "CONNECTED";
                        resolve("CONNECTED");
                    } else {
                        resolve("DISCONNECTED");
                    }
                });
            } catch (e) {
                clearTimeout(timer);
                resolve("NOT_INSTALLED");
            }
        });
    }

    async request(source, query) {
        // 1. Double check health
        const health = await this.testConnection();
        if (health !== "CONNECTED") {
            return { status: "CONNECTION_ERROR", detail: health, products: [] };
        }

        console.log(`[Ext-Connector] Direct Request: ${source} -> "${query}"`);

        return new Promise((resolve) => {
            try {
                chrome.runtime.sendMessage(EXTENSION_ID, {
                    type: "EXT_SEARCH_REQUEST",
                    source,
                    query
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        resolve({ status: "ERROR", error: chrome.runtime.lastError.message, source, products: [] });
                    } else {
                        const res = response || { status: "ERROR", source, products: [] };
                        if (res.status === "ERROR" && !res.error && res.detail) res.error = res.detail;
                        resolve(res);
                    }
                });
            } catch (e) {
                resolve({ status: "ERROR", error: e.message, source, products: [] });
            }
        });
    }
}

export default new ExtensionConnector();
