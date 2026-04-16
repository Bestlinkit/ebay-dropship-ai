import { SourcingStatus } from '../constants/sourcing';

/**
 * Truth-Based Eprolo Bridge (v4.2)
 * Standardized response schema for deterministic UI interpretation.
 * Authentication logic now fully offloaded to Cloudflare Bridge.
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

        // 🚨 1. AUTH CONFIG VALIDATION (Iron Flow 7.2)
        const appKey = import.meta.env.VITE_EPROLO_APP_KEY;
        const secret = import.meta.env.VITE_EPROLO_SECRET;

        if (!appKey || !secret) {
            return {
                status: "CONFIG_ERROR",
                message: "Missing Eprolo API credentials in Environment",
                data: [],
                debugInfo
            };
        }

        try {
            const response = await fetch(debugInfo.endpoint, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "apiKey": String(appKey),
                    "apiSecret": String(secret)
                },
                body: JSON.stringify({ 
                    keyword: query, 
                    page_index: page, 
                    page_size: 20
                })
            });

            debugInfo.httpStatus = response.status;
            const result = await response.json();
            debugInfo.rawResponse = JSON.stringify(result);

            // 🚨 2. RESPONSE VALIDATION (Auth Failure mapping)
            if (result.code === "-1" || result.code === -1) {
                return {
                    status: "AUTH_ERROR",
                    message: result.msg || "Eprolo Authentication Failed",
                    data: [],
                    debugInfo: { ...debugInfo, result }
                };
            }

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

    /**
     * STAGE 2: DETAIL RETRIEVAL (v7.2)
     * Fetches full metadata for a selected product by ID.
     */
    async getProductDetail(productId) {
        const debugInfo = {
            endpoint: `${this.proxyUrl}/eprolo-product-detail`,
            timestamp: new Date().toISOString(),
            productId
        };

        // 🚨 1. AUTH CONFIG VALIDATION (Iron Flow 7.2)
        const appKey = import.meta.env.VITE_EPROLO_APP_KEY;
        const secret = import.meta.env.VITE_EPROLO_SECRET;

        if (!appKey || !secret) {
            throw new Error("CONFIG_ERROR");
        }

        try {
            const response = await fetch(debugInfo.endpoint, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "apiKey": String(appKey),
                    "apiSecret": String(secret)
                },
                body: JSON.stringify({ product_id: productId })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            if (result.code !== "0" && result.code !== 0) throw new Error(result.msg || "API Error");

            const item = result.data || {};
            
            return {
                id: item.id || item.product_id,
                title: item.product_name || item.title,
                price: parseFloat(item.price || item.min_price || 0),
                image: item.image_url || item.image || (item.imagelist?.[0]?.src) || '',
                images: (item.imagelist || []).map(img => img.src || img),
                source: 'EPROLO',
                description: item.description || item.product_desc || "",
                variants: (item.variantlist || []).map(v => ({
                    id: v.id,
                    sku: v.sku,
                    price: parseFloat(v.cost || v.price),
                    stock: v.inventory_quantity || 0,
                    options: v.options || []
                }))
            };
        } catch (e) {
            console.error("Eprolo Detail Fetch Failed:", e);
            throw e;
        }
    }

    async findMatches(ebayProduct) {
        return this.searchProducts(ebayProduct.title);
    }
}

export default new EproloService();
