import { SourcingStatus } from '../constants/sourcing';
import extensionConnector from './extensionConnectorService';

/**
 * Stable Sourcing Eprolo Bridge (v19.0)
 * Offloads extraction to the Chrome Extension Data Bridge.
 */
class EproloService {
    constructor() {
        // No backend needed for v19.0
    }

    async searchProducts(query) {
        if (!query) return { status: SourcingStatus.EMPTY, data: [] };

        console.log(`[Eprolo] Requesting browser-session extraction for: ${query}`);

        try {
            const result = await extensionConnector.request("eprolo", query);

            if (result.status === "SUCCESS") {
                const mapped = this.parseDiscovery(result.data || []);
                return {
                    status: mapped.length > 0 ? SourcingStatus.SUCCESS : SourcingStatus.EMPTY,
                    data: mapped,
                    debugInfo: { method: "EXTENSION_BRIDGE", status: "SUCCESS" }
                };
            }

            // 🚨 FAILURE HANDLING (v19.4 Rules)
            if (result.status === "EXTENSION_NOT_LOADED") {
                return { status: SourcingStatus.EXTENSION_NOT_LOADED, data: [], debugInfo: result };
            }

            return {
                status: result.status === "TIMEOUT" ? SourcingStatus.NETWORK_ERROR : SourcingStatus.API_ERROR,
                data: [],
                debugInfo: { ...result, method: "EXTENSION_BRIDGE" }
            };

        } catch (e) {
            console.error("Eprolo Extension Call Fault:", e);
            return { status: SourcingStatus.API_ERROR, data: [], debugInfo: { error: e.message } };
        }
    }

    /**
     * STAGE 2: DETAIL RETRIEVAL
     * Re-uses discovery data as the extension extracts complete cards.
     */
    async getProductDetail(productId) {
        // Extension-based search already provides the essential data from the catalog.
        return null;
    }

    parseDiscovery(rawItems) {
        return rawItems.map(item => ({
            id: item.id || `epr_${Math.random().toString(36).slice(2, 9)}`,
            title: item.title,
            price: item.price || 0,
            image: item.image || item.images?.[0] || '',
            source: 'EPROLO',
            shipping: 0, 
            delivery: '8-15 days',
            shipsFrom: 'China',
            url: item.url || '',
            variants: [],
            status: 'READY'
        }));
    }

    async findMatches(ebayProduct) {
        return this.searchProducts(ebayProduct.title);
    }
}

export default new EproloService();
