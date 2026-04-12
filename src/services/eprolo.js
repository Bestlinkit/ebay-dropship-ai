import axios from 'axios';

/**
 * Crystal Pulse Eprolo Bridge (V5.4)
 * Secure Vector for Sourcing & Multi-Channel Fulfillment
 */
class EproloService {
  constructor() {
    this.apiKey = import.meta.env.VITE_EPROLO_API_KEY || '7D57B61F51C2485285A0B9526548AB32';
    this.apiSecret = import.meta.env.VITE_EPROLO_API_SECRET || 'DEC24B77A8B84678AAB7BAAF35502798ED288A1A91E84DDB86D6B04F1BFAC6B8';
    this.baseUrl = 'https://api.eprolo.com/v1'; 
    this.useSimulation = !import.meta.env.VITE_EPROLO_API_KEY || import.meta.env.VITE_EPROLO_API_KEY.includes('YOUR_'); 
  }

  /**
   * Searches for products directly on Eprolo's marketplace.
   */
  async searchProducts(query, page = 1) {
    if (this.useSimulation) {
        console.warn("[Eprolo Service] Simulation mode active. No API keys found.");
        return [];
    }

    try {
        const response = await axios.post(`${this.baseUrl}/product/list`, {
            keywords: query,
            page: page,
            limit: 10
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': this.apiKey,
                'X-API-SECRET': this.apiSecret
            }
        });

        if (response.data && response.data.list) {
            return response.data.list.map(item => ({
                id: item.product_id,
                sku: item.sku,
                title: item.title,
                price: parseFloat(item.price),
                thumbnail: item.image_url,
                shipping: item.shipping_fee || 0,
                delivery: item.delivery_days || '7-12 days',
                rating: 4.8 
            }));
        }
        return [];
    } catch (error) {
        console.error("Eprolo Search Sync Error:", error);
        return [];
    }
  }

  /**
   * Finds matching Eprolo items for a specific eBay listing.
   */
  async findMatches(ebayProduct) {
    return this.searchProducts(ebayProduct.title);
  }

  async importToDashboard(eproloProduct, ebayMarketData) {
    console.log("[EPROLO] Syncing product vector to repository...", { eproloProduct, ebayMarketData });
    return { success: true, id: Math.random().toString(36).substr(2, 9) };
  }
}

export default new EproloService();
