/**
 * Crystal AliExpress Scraper Bridge (v2.0)
 * Uses route-based HTML extraction and frontend DOM parsing.
 */
class AliExpressService {
  constructor() {
    this.proxyUrl = import.meta.env.VITE_PROXY_URL;
  }

  /**
   * Scrapes AliExpress products using the secure Worker proxy.
   */
  async searchProducts(query) {
    if (!query) return [];

    try {
        console.info(`[AliExpress Scraper] Initiating wholesale probe for "${query}"...`);
        
        const response = await fetch(`${this.proxyUrl}/aliexpress-search?q=${encodeURIComponent(query)}`);
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // The selectors below are common for AliExpress wholesale lists.
        // We look for items in the search results grid.
        const itemNodes = [...doc.querySelectorAll('.list-item, .search-item-card, [data-index]')];

        if (itemNodes.length === 0) {
            console.warn("[AliExpress Scraper] No HTML nodes found. IP may be rate-limited.");
            return [];
        }

        const results = itemNodes.map(el => {
            const title = el.querySelector('.title, .item-title, h1, h3')?.textContent?.trim() || "AliExpress Product";
            const priceText = el.querySelector('.price, .item-price, .current-price')?.textContent?.trim() || "0";
            const image = el.querySelector('img')?.src || "";
            const rating = el.querySelector('.rating, .item-rating')?.textContent?.trim() || "4.5";
            
            // Clean price text (e.g. "$12.34" -> 12.34)
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

            return {
                id: Math.random().toString(36).substr(2, 9),
                title,
                price,
                image,
                rating: parseFloat(rating) || 4.5,
                shipping: 0,
                delivery: '12-15 days',
                shipsFrom: 'China', // Default for wholesale scraping
                source: 'AliExpress',
                url: el.querySelector('a')?.href || '#'
            };
        }).filter(item => item.price > 0);

        return results;

    } catch (e) {
        console.error("AliExpress Scraping Malfunction:", e.message);
        throw new Error("Live AliExpress sourcing is currently unstable. Fallback to Eprolo recommended.");
    }
  }

  /**
   * Calculates profit for AliExpress items.
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
