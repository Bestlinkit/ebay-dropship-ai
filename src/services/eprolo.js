import { SourcingStatus } from '../constants/sourcing';

/**
 * Truth-Based Eprolo Bridge (v4.0)
 * Standardized response schema for deterministic UI interpretation.
 */
class EproloService {
    constructor() {
        const rawProxy = import.meta.env.VITE_PROXY_URL || "";
        this.proxyUrl = rawProxy.endsWith("/") ? rawProxy.slice(0, -1) : rawProxy;
    }

    async searchProducts(query, page = 0) {
        const debugInfo = {
            endpoint: `${this.proxyUrl}/eprolo-search`,
            timestamp: new Date().toISOString(),
            query,
            httpStatus: null,
            rawResponse: null
        };

        try {
            const response = await fetch(debugInfo.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keyword: query, page_index: page, page_size: 20 })
            });

            debugInfo.httpStatus = response.status;
            const result = await response.json();
            debugInfo.rawResponse = JSON.stringify(result);

            if (!response.ok) {
                const errorText = await response.text();
                return { 
                    status: SourcingStatus.NETWORK_ERROR, 
                    data: [], 
                    debugInfo: { ...debugInfo, errorText, statusCode: response.status } 
                };
            }

            // API ERROR (Non-zero code)
            if (result.code !== '0' && result.code !== 0) {
                return { 
                    status: SourcingStatus.API_ERROR, 
                    data: [], 
                    debugInfo: { ...debugInfo, errorMsg: result.msg || `API Code ${result.code}` } 
                };
            }

            const rawItems = result.data || result.products || [];
            
            // EMPTY (200 OK but no items)
            if (rawItems.length === 0) {
                return { status: SourcingStatus.EMPTY, data: [], debugInfo };
            }

            // SUCCESS
            const mappedData = rawItems.map(item => ({
                id: item.id || item.product_id,
                title: item.product_name || item.title || "Unnamed Product",
                price: parseFloat(item.price || item.min_price || (item.variantlist?.[0]?.cost) || 0),
                image: item.image_url || item.image || item.imagefirst || (item.imagelist?.[0]?.src) || '',
                source: 'Eprolo',
                shipping: 0, 
                delivery: item.delivery_time || '8-15 days',
                shipsFrom: item.ships_from || 'China',
                rating: 4.8,
                url: item.product_url || '',
                variants: (item.variantlist || item.variants || []).map(v => ({
                    id: v.id,
                    sku: v.sku,
                    price: parseFloat(v.cost || v.price),
                    stock: v.inventory_quantity || v.stock
                }))
            }));

            return { status: SourcingStatus.SUCCESS, data: mappedData, debugInfo };

        } catch (e) {
            return { 
                status: SourcingStatus.NETWORK_ERROR, 
                data: [], 
                debugInfo: { ...debugInfo, errorStack: e.message } 
            };
        }
    }

    async findMatches(ebayProduct) {
        return this.searchProducts(ebayProduct.title);
    }
}

export default new EproloService();
