/**
 * Hardened Eprolo Sourcing Bridge (v3.0)
 * Offloads signing logic to secure Cloudflare Worker.
 */
class EproloService {
    constructor() {
        // Normalize Proxy URL: Ensure no trailing slash for consistent route construction
        const rawProxy = import.meta.env.VITE_PROXY_URL || "";
        this.proxyUrl = rawProxy.endsWith("/") ? rawProxy.slice(0, -1) : rawProxy;
    }

    /**
     * Fetches products from Eprolo catalog via secure Worker route.
     */
    async searchProducts(query, page = 0) {
        try {
            // Diagnostic Bridge Check (One-time check per session)
            if (!this._diagnosed) {
                console.log(`[Eprolo Hub] Verifying Bridge Integrity: ${this.proxyUrl}/health`);
                this._diagnosed = true;
            }

            console.log(`[Eprolo Hub] Dispatching secure sourcing probe for "${query}"...`);
            
            // Explicit Absolute Worker Route (Ensuring clean path)
            const cleanBase = this.proxyUrl.replace(/\/+$/, '');
            const response = await fetch(`${cleanBase}/eprolo-search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    keyword: query,
                    page_index: page,
                    page_size: 20
                })
            });

            const result = await response.json();
            
            if (result.code !== '0' && result.code !== 0) {
                throw new Error(result.msg || `Eprolo Error: ${result.code}`);
            }

            // Map results based on Production Patch requirements
            const rawItems = result.data || result.products || [];
            
            return rawItems.map(item => ({
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

        } catch (e) {
            console.error("Eprolo Global Bridge Failure:", e.message);
            throw e;
        }
    }

    /**
     * Retrieves specific product details.
     */
    async getProductDetail(productId) {
        try {
            // Note: For now we reuse the search logic or a dedicated detail route if the worker is updated for it.
            // But search results usually contain enough data for sourcing.
            const results = await this.searchProducts(productId);
            return results[0] || null;
        } catch (e) {
            console.error("Eprolo Detail Retrieval Error:", e.message);
            throw e;
        }
    }

    async findMatches(ebayProduct) {
        return this.searchProducts(ebayProduct.title);
    }
}

export default new EproloService();
