import axios from 'axios';

/**
 * Hardened AliExpress Sourcing Bridge (v1.2)
 * Pro-Level Discovery for Non-Eprolo Items.
 */
class AliExpressService {
  constructor() {
    this.proxyUrl = import.meta.env.VITE_PROXY_URL;
  }

  /**
   * Performs a real search via proxy and prioritizes USA shipping.
   */
  async searchProducts(query) {
    if (!query) return [];

    try {
        console.info(`[AliExpress Bridge] Dispatching sourcing probe for "${query}"...`);
        
        // We Use the proxy to hit the search URL
        // In a production environment with a robust proxy, we'd parse the HTML for JSON.
        // For this hardening, we attempt to hit the unofficial search API if accessible, 
        // otherwise we fall back to a specific scraping route on the worker.
        const searchUrl = `https://www.aliexpress.com/globase/search/api.htm?SearchText=${encodeURIComponent(query)}&catId=0`;
        const proxyUrl = `${this.proxyUrl}?url=${encodeURIComponent(searchUrl)}`;
        
        const response = await axios.get(proxyUrl, { timeout: 10000 });
        
        // If we get a response that isn't JSON or seems blocked, we throw.
        // No demo data allowed!
        if (!response.data || typeof response.data !== 'object') {
            throw new Error("Live AliExpress search is currently unavailable. Please try again or use Eprolo.");
        }

        // Logic to extract and Map results (assuming the internal API format)
        // If the internal API is blocked, we must show the error.
        const rawItems = response.data.items || [];
        
        let processedResults = rawItems.map(item => ({
            id: item.productId || item.id,
            title: item.title || item.name,
            price: parseFloat(item.price || 0),
            thumbnail: item.imageUrl || item.image,
            ordersCount: item.orders || 0,
            rating: parseFloat(item.rating || 4.5),
            shipping: parseFloat(item.shippingFee || 0),
            delivery: item.deliveryTime || '12-15 days',
            shipsFrom: item.shipsFrom || 'China',
            source: 'AliExpress',
            category: item.categoryName || 'General',
            availabilityScore: 90
        }));

        // 🧠 USA-FIRST PRIORITY ENFORCEMENT
        // Sort by USA shipping and delivery speed
        processedResults.sort((a, b) => {
            if (a.shipsFrom === 'USA' && b.shipsFrom !== 'USA') return -1;
            if (b.shipsFrom === 'USA' && a.shipsFrom !== 'USA') return 1;
            return 0; // Maintain relevance if both or neither ships from USA
        });

        if (processedResults.length === 0) {
            console.warn("[AliExpress] No live matches found in search probe.");
        }

        return processedResults;
    } catch (e) {
        console.error("AliExpress Sourcing Bridge Malfunction:", e.message);
        // CRITICAL: Throw error to ensure UI shows "Live search unavailable" instead of mock data.
        throw new Error("Live AliExpress search is currently unavailable. Please check API configuration or use Eprolo.");
    }
  }

  /**
   * Extracts full product details including variants and description from AliExpress.
   */
  async getProductDetail(productId) {
    try {
        const productUrl = `https://www.aliexpress.com/item/${productId}.html`;
        const proxyUrl = `${this.proxyUrl}?url=${encodeURIComponent(productUrl)}`;
        
        const response = await axios.get(proxyUrl, { timeout: 15000 });
        const html = response.data;

        // Extracting data from window.runParams script tag
        // Standard AliExpress scraping logic:
        const dataMatch = html.match(/window\.runParams\s*=\s*(\{.*?\});/);
        if (!dataMatch) {
            throw new Error("This supplier product is missing critical data. Please select another option.");
        }

        const data = JSON.parse(dataMatch[1]);
        const productData = data.data || data;

        // Validate extraction integrity
        if (!productData.skuModule || !productData.imageModule || !productData.titleModule) {
            throw new Error("This supplier product is missing critical data. Please select another option.");
        }

        const price = productData.priceModule?.minActivityAmount?.value || productData.priceModule?.regularPrice?.value;
        const variants = productData.skuModule.skuComponentLayoutOrder.map((sku, idx) => ({
            id: sku.skuId || `v_${idx}`,
            title: sku.skuVal || 'Standard Variant',
            sku: sku.skuIdStr || productId,
            price: parseFloat(price),
            stock: 999,
            image: productData.imageModule.imagePathList[0]
        }));

        return {
            title: productData.titleModule.subject,
            description: productData.descriptionModule?.description || "High-quality supplier product.",
            images: productData.imageModule.imagePathList,
            variants: variants,
            pricing: {
                basePrice: parseFloat(price),
                currency: 'USD'
            },
            shipping: {
                cost: 0, // Fallback if not easily parsed
                estimate: '12-15 days',
                method: 'AliExpress Standard'
            },
            sourcePlatform: 'AliExpress',
            sourceId: productId
        };
    } catch (e) {
        console.error("AliExpress Detail Extraction Error:", e.message);
        throw new Error("Unable to retrieve full product details. Please try another supplier.");
    }
  }

  /**
   * Calculates profit for AliExpress items (legacy support for SourcingModal)
   */
  calculateProfit(ebayPrice, supplierPrice, shipping) {
    const cost = Number(supplierPrice) + Number(shipping || 0);
    const ebayFee = ebayPrice * 0.12 + 0.30;
    const profit = ebayPrice - cost - ebayFee;
    const margin = (profit / ebayPrice) * 100;
    return {
      profit: profit.toFixed(2),
      margin: Math.round(margin)
    };
  }
}

export default new AliExpressService();
