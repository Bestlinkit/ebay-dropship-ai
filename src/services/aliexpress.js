/**
 * Crystal AliExpress Scraper Bridge (v2.0)
 * Uses route-based HTML extraction and frontend DOM parsing.
 */
class AliExpressService {
  constructor() {
    // Normalize Proxy URL
    const rawProxy = import.meta.env.VITE_PROXY_URL || "";
    this.proxyUrl = rawProxy.endsWith("/") ? rawProxy.slice(0, -1) : rawProxy;
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

        // 1. ATTEMPT ROBUST JSON EXTRACTION (Hidden in script tags)
        try {
            const jsonMatch = html.match(/window\.runParams\s*=\s*({.+?});/);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[1]);
                const items = data.mods?.itemList?.content || [];
                if (items.length > 0) {
                    console.log("[AliExpress Scraper] Extraction Success: Neural JSON Mode.");
                    return items.map(item => ({
                        id: item.productId,
                        title: item.title?.displayTitle || "AliExpress Product",
                        price: parseFloat(item.prices?.salePrice?.minPrice) || 0,
                        image: item.image?.imgUrl || "",
                        rating: parseFloat(item.evaluation?.starRating) || 4.5,
                        shipping: 0,
                        delivery: '12-15 days',
                        source: 'AliExpress',
                        url: `https://www.aliexpress.com/item/${item.productId}.html`
                    })).filter(i => i.price > 0);
                }
            }
        } catch (jsonErr) {
            console.warn("[AliExpress Scraper] Neural JSON Extraction failed, reverting to CSS selectors.");
        }

        // 2. FALLBACK: DOM PARSING (CSS Selectors)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const itemNodes = [...doc.querySelectorAll('.list-item, .search-item-card, [data-index], .pro-item')];

        if (itemNodes.length === 0) {
            if (html.includes("security-check") || html.length < 5000) {
                throw new Error("AliExpress blocked. Searching alternative supplier sources...");
            }
            return [];
        }

        return itemNodes.map(el => {
            const title = el.querySelector('.title, .item-title, h1, h3')?.textContent?.trim() || "AliExpress Product";
            const priceText = el.querySelector('.price, .item-price, .current-price, .pro-price')?.textContent?.trim() || "0";
            const image = el.querySelector('img')?.src || "";
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

            return {
                id: Math.random().toString(36).substr(2, 9),
                title,
                price,
                image,
                rating: 4.5,
                shipping: 0,
                delivery: '12-15 days',
                source: 'AliExpress',
                url: el.querySelector('a')?.href || '#'
            };
        }).filter(item => item.price > 0);

    } catch (e) {
        console.error("AliExpress Scraping Malfunction:", e.message);
        throw new Error("Searching alternative supplier sources...");
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
