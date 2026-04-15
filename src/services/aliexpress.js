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
            // Updated Regex: Supports window.runParams, _init_data_, and window.data
            const jsonPatterns = [
                /window\.runParams\s*=\s*({.+?});/,
                /_init_data_\s*=\s*({.+?});/,
                /window\.data\s*=\s*({.+?});/
            ];

            let data = null;
            for (const pattern of jsonPatterns) {
                const match = html.match(pattern);
                if (match) {
                    console.info(`[DEBUG] Ali Match Pattern: ${pattern.toString().slice(0, 30)}...`);
                    try {
                        data = JSON.parse(match[1]);
                        if (data?.mods?.itemList?.content) {
                            console.log("[DEBUG] Ali Extraction: Found 'itemList.content'");
                            break; 
                        }
                        if (data?.actionValues) {
                            console.log("[DEBUG] Ali Extraction: Found 'actionValues'");
                            break; 
                        }
                    } catch (e) { 
                        console.warn(`[DEBUG] Ali JSON Parse Error for pattern: ${pattern}`);
                        continue; 
                    }
                }
            }

            if (!data) console.warn("[DEBUG] Ali Extraction: No valid JSON patterns matched in HTML.");

            if (data) {
                const items = data.mods?.itemList?.content || data.actionValues?.itemList || [];
                if (items.length > 0) {
                    console.log("[AliExpress Scraper] Extraction Success: Neural JSON Mode.");
                    return items.map(item => ({
                        id: item.productId || item.product_id || Math.random().toString(36).substr(2, 9),
                        title: item.title?.displayTitle || item.product_title || "AliExpress Product",
                        price: parseFloat(item.prices?.salePrice?.minPrice || item.product_price) || 0,
                        image: item.image?.imgUrl || item.product_main_image_url || "",
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
            if (html.includes("security-check") || html.length < 1000) {
                throw new Error("AliExpress scraping blocked. Try a different keyword or retry later.");
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
        throw new Error(e.message || "Global node unreachable.");
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
