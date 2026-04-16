/**
 * Intelligent Proxy Bridge (v2.0)
 * Allows client-side components to route requests through a Google Apps Script (GAS) 
 * proxy to bypass CORS and evade Node.js-specific IP blocking.
 */
class ProxyBridge {
    constructor() {
        // Fallback to a default GAS URL if one is provided in .env or config
        this.gasUrl = import.meta.env.VITE_GAS_ALI_PROXY || null;
    }

    async fetch(targetUrl) {
        if (!this.gasUrl) {
            console.warn("[Bridge] No GAS Proxy URL configured. Falling back to direct backend.");
            return null;
        }

        try {
            const bridgeUrl = `${this.gasUrl}?url=${encodeURIComponent(targetUrl)}`;
            const response = await fetch(bridgeUrl);
            
            if (!response.ok) throw new Error(`Bridge HTTP ${response.status}`);
            
            // GAS Proxy returns the HTML/JSON directly
            return await response.text();
        } catch (error) {
            console.error("[Bridge] Proxy Fault:", error);
            return null;
        }
    }
}

export default new ProxyBridge();
