import { SourcingStatus } from '../constants/sourcing';

/**
 * Stable Sourcing Eprolo Bridge (v8.0)
 * Offloads all authentication and signing to the Node.js backend.
 */
class EproloService {
    constructor() {
        // Backend base URL (Internal Registry)
        this.apiBase = "http://localhost:3001/api/eprolo";
    }

    async searchProducts(query, page = 0) {
        const debugInfo = {
            endpoint: `${this.apiBase}/search`,
            timestamp: new Date().toISOString(),
            query,
            httpStatus: null
        };

        try {
            const response = await fetch(debugInfo.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    keyword: query, 
                    page_index: page, 
                    page_size: 20
                })
            });

            debugInfo.httpStatus = response.status;
            const result = await response.json();

            // 1. BACKEND LEVEL ERROR HANDLING
            if (result.status === "CONFIG_ERROR") {
                return {
                    status: "CONFIG_ERROR",
                    message: "Backend API credentials missing.",
                    data: [],
                    debugInfo
                };
            }

            if (result.status === "AUTH_ERROR" || result.code === "-1" || result.code === -1) {
                return {
                    status: "AUTH_ERROR",
                    message: result.message || "Eprolo Authentication Failed",
                    data: [],
                    debugInfo
                };
            }

            if (!response.ok) {
                return { 
                    status: SourcingStatus.NETWORK_ERROR, 
                    data: [], 
                    debugInfo: { ...debugInfo, errorMsg: `HTTP ${response.status}` } 
                };
            }

            // 2. API LEVEL ERROR HANDLING
            if (result.code !== '0' && result.code !== 0) {
                return { 
                    status: SourcingStatus.API_ERROR, 
                    data: [], 
                    debugInfo: { ...debugInfo, errorMsg: result.msg || `API Code ${result.code}` } 
                };
            }

            const rawItems = result.data || result.products || [];
            
            if (rawItems.length === 0) {
                return { status: SourcingStatus.EMPTY, data: [], debugInfo };
            }

            // 3. DETERMINISTIC MAPPING
            const mappedData = rawItems.map(item => ({
                id: item.id || item.product_id || `epr_${Math.random().toString(36).slice(2, 9)}`,
                title: (item.product_name || item.title || "Unnamed Product")?.trim(),
                price: parseFloat(item.price || item.min_price || (item.variantlist?.[0]?.cost) || 0),
                image: item.image_url || item.image || item.imagefirst || (item.imagelist?.[0]?.src) || '',
                source: 'EPROLO', // STRICT SOURCE TAGGING
                shipping: 0, 
                delivery: item.delivery_time || '8-15 days',
                shipsFrom: item.ships_from || 'China',
                url: item.product_url || '',
                // Lightweight search doesn't need full variants/descriptions
                variants: [],
                status: 'READY'
            }));

            return { status: SourcingStatus.SUCCESS, data: mappedData, debugInfo };

        } catch (e) {
            console.error("Eprolo Backend Call Failed:", e);
            return { 
                status: SourcingStatus.NETWORK_ERROR, 
                data: [], 
                debugInfo: { ...debugInfo, errorStack: e.message } 
            };
        }
    }

    /**
     * STAGE 2: DETAIL RETRIEVAL (v8.0)
     * Fetches full metadata for a selected product via backend.
     */
    async getProductDetail(productId) {
        try {
            const response = await fetch(`${this.apiBase}/detail`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product_id: productId })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            if (result.code !== "0" && result.code !== 0) throw new Error(result.msg || "API Error");

            const item = result.data || {};
            
            // Return full enriched schema
            return {
                id: item.id || item.product_id,
                title: (item.product_name || item.title || "Unnamed Product")?.trim(),
                price: parseFloat(item.price || item.min_price || 0),
                image: item.image_url || item.image || (item.imagelist?.[0]?.src) || '',
                images: (item.imagelist || []).map(img => img.src || img),
                source: 'EPROLO',
                description: (item.description || item.product_desc || "").trim(),
                variants: (item.variantlist || []).map(v => ({
                    id: v.id,
                    sku: v.sku,
                    price: parseFloat(v.cost || v.price),
                    stock: v.inventory_quantity || 0,
                    options: v.options || []
                })),
                shipsFrom: item.ships_from || 'China',
                delivery: item.delivery_time || '8-15 days'
            };
        } catch (e) {
            console.error("Eprolo Backend Detail Fetch Failed:", e);
            throw e;
        }
    }

    async findMatches(ebayProduct) {
        return this.searchProducts(ebayProduct.title);
    }
}

export default new EproloService();
