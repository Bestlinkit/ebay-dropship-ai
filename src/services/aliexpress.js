import { SourcingStatus } from '../constants/sourcing';

/**
 * Truth-Based AliExpress Scraper (v3.0)
 * Standardized response schema with explicit blocking/parsing detection.
 */
class AliExpressService {
  constructor() {
    const rawProxy = import.meta.env.VITE_PROXY_URL || "";
    this.proxyUrl = rawProxy.endsWith("/") ? rawProxy.slice(0, -1) : rawProxy;
  }

  async searchProducts(query) {
    if (!query) return { status: SourcingStatus.EMPTY, data: [], debugInfo: {} };

    const debugInfo = {
        endpoint: `${this.proxyUrl}/aliexpress-search?q=${encodeURIComponent(query)}`,
        timestamp: new Date().toISOString(),
        query,
        htmlLength: 0,
        httpStatus: null,
        parseMethod: null
    };

    try {
        const response = await fetch(debugInfo.endpoint);
        debugInfo.httpStatus = response.status;
        const html = await response.text();
        debugInfo.htmlLength = html.length;

        if (!response.ok) {
            return { status: SourcingStatus.NETWORK_ERROR, data: [], debugInfo };
        }

        // 1. BLOCKING DETECTION
        if (html.includes("security-check") || html.length < 1000) {
            return { status: SourcingStatus.BLOCKED, data: [], debugInfo };
        }

        // 2. ATTEMPT JSON EXTRACTION
        const jsonPatterns = [
            /window\.runParams\s*=\s*({.+?});/,
            /_init_data_\s*=\s*({.+?});/,
            /window\.data\s*=\s*({.+?});/
        ];

        for (const pattern of jsonPatterns) {
            const match = html.match(pattern);
            if (match) {
                try {
                    const data = JSON.parse(match[1]);
                    const items = data.mods?.itemList?.content || data.actionValues?.itemList || [];
                    
                    if (items.length > 0) {
                        debugInfo.parseMethod = 'JSON_NEURAL';
                        const mappedItems = items.map(item => ({
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

                        return { status: SourcingStatus.SUCCESS, data: mappedItems, debugInfo };
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        // 3. ATTEMPT DOM PARSING
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const itemNodes = [...doc.querySelectorAll('.list-item, .search-item-card, [data-index], .pro-item')];

        if (itemNodes.length > 0) {
            debugInfo.parseMethod = 'DOM_SELECTOR';
            const mappedItems = itemNodes.map(el => {
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

            if (mappedItems.length > 0) {
                return { status: SourcingStatus.SUCCESS, data: mappedItems, debugInfo };
            }
        }

        // 4. IF WE GOT HERE -> NO RESULTS OR PARSE ERROR
        // If HTML exists but no items found, it might be a valid "No match" or a changed structure
        return { 
            status: html.includes("no results") ? SourcingStatus.EMPTY : SourcingStatus.PARSE_ERROR, 
            data: [], 
            debugInfo 
        };

    } catch (e) {
        return { 
            status: SourcingStatus.NETWORK_ERROR, 
            data: [], 
            debugInfo: { ...debugInfo, errorStack: e.message } 
        };
    }
  }

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
