import { SourcingStatus } from '../constants/sourcing';

/**
 * Truth-Based AliExpress Scraper (v4.0)
 * Hybrid HTML/JSON Extractor with deep script-mining and explicit block detection.
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
        extractionMethodUsed: "NONE",
        parsedCount: 0,
        logs: []
    };

    try {
        const response = await fetch(debugInfo.endpoint);
        debugInfo.httpStatus = response.status;
        const html = await response.text();
        debugInfo.htmlLength = html.length;

        if (!response.ok) {
            return { status: SourcingStatus.NETWORK_ERROR, data: [], debugInfo };
        }

        // 1. BLOCK DETECTION (CRITICAL)
        const blockPatterns = ["captcha", "security verification", "robot check", "verify your identity"];
        if (blockPatterns.some(p => html.toLowerCase().includes(p)) || (html.length < 5000 && !html.includes("window."))) {
            return { 
                status: SourcingStatus.BLOCKED, 
                data: [], 
                debugInfo: { ...debugInfo, reason: "AliExpress anti-bot triggered" } 
            };
        }

        let mappedItems = [];

        // 2. STAGE 1: HYBRID JSON BLOCK DETECTION
        const jsonPatterns = [
            { id: "INITIAL_STATE", regex: /window\.__INITIAL_STATE__\s*=\s*({.+?});/ },
            { id: "RUN_PARAMS", regex: /window\.runParams\s*=\s*({.+?});/ },
            { id: "APOLLO_STATE", regex: /window\.__APOLLO_STATE__\s*=\s*({.+?});/ }
        ];

        for (const pattern of jsonPatterns) {
            const match = html.match(pattern.regex);
            if (match) {
                try {
                    const data = JSON.parse(match[1]);
                    // Deep extract based on known paths
                    const items = this.deepExtractItems(data);
                    
                    if (items.length > 0) {
                        debugInfo.extractionMethodUsed = `JSON_${pattern.id}`;
                        mappedItems = this.mapAliItems(items);
                        if (mappedItems.length > 0) {
                            debugInfo.parsedCount = mappedItems.length;
                            return { status: SourcingStatus.SUCCESS, data: mappedItems, debugInfo };
                        }
                    }
                } catch (e) {
                    debugInfo.logs.push(`${pattern.id} direct parse failed: ${e.message}`);
                }
            }
        }

        // 3. STAGE 2: DEEP SCRIPT MINING
        debugInfo.logs.push("Attempting Stage 2 Script Mining...");
        const scriptMatch = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gm);
        if (scriptMatch) {
            for (const scriptContent of scriptMatch) {
                if (scriptContent.length > 1000) {
                    // Look for JSON-like blobs inside script
                    const jsonBlobs = scriptContent.match(/{[\s\S]*?}/g);
                    if (jsonBlobs) {
                        for (const blob of jsonBlobs) {
                            if (blob.length > 1000 && (blob.includes("productId") || blob.includes("productTitle"))) {
                                try {
                                    const cleanedBlob = blob.replace(/^[\s\S]*?{/, '{').replace(/}[\s\S]*?$/, '}');
                                    const data = JSON.parse(cleanedBlob);
                                    const items = this.deepExtractItems(data);
                                    if (items.length > 0) {
                                        debugInfo.extractionMethodUsed = "SCRIPT_MINING";
                                        mappedItems = this.mapAliItems(items);
                                        if (mappedItems.length > 0) {
                                            debugInfo.parsedCount = mappedItems.length;
                                            return { status: SourcingStatus.SUCCESS, data: mappedItems, debugInfo };
                                        }
                                    }
                                } catch (e) {
                                    continue;
                                }
                            }
                        }
                    }
                }
            }
        }

        // 4. STAGE 3: FALLBACK DOM SCRAPE (REFINED SELECTORS)
        debugInfo.logs.push("Attempting Stage 3 DOM Fallback...");
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        // Modern generic selectors
        const itemNodes = [...doc.querySelectorAll('[data-item-id], [class*="item"], [class*="product"], .search-item-card, .pro-item')];

        if (itemNodes.length > 0) {
            debugInfo.extractionMethodUsed = "DOM_FALLBACK";
            mappedItems = itemNodes.map(el => {
                const titleNode = el.querySelector('[class*="title"], [class*="name"], h1, h3');
                const priceNode = el.querySelector('[class*="price"], [class*="current"]');
                const imgNode = el.querySelector('img');
                
                const title = titleNode?.textContent?.trim() || "AliExpress Product";
                const priceText = priceNode?.textContent?.trim() || "0";
                const image = imgNode?.src || imgNode?.getAttribute('data-src') || "";
                const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

                return {
                    id: el.getAttribute('data-item-id') || Math.random().toString(36).substr(2, 9),
                    title,
                    price,
                    image,
                    rating: 4.5,
                    source: 'AliExpress',
                    url: el.querySelector('a')?.href || '#'
                };
            }).filter(item => item.price > 0 && item.image);

            if (mappedItems.length > 0) {
                debugInfo.parsedCount = mappedItems.length;
                return { status: SourcingStatus.SUCCESS, data: mappedItems, debugInfo };
            }
        }

        // 5. FINAL EXHAUSTION
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

  /**
   * Deep extract items from unknown JSON structures
   */
  deepExtractItems(data) {
    if (!data) return [];
    
    // Check known paths
    const paths = [
        data.mods?.itemList?.content,
        data.actionValues?.itemList,
        data.items,
        data.products,
        data.resultList
    ];
    
    for (const path of paths) {
        if (Array.isArray(path) && path.length > 0) return path;
    }

    // Recursive search for arrays containing "productId"
    const findItems = (obj) => {
        if (Array.isArray(obj)) {
            if (obj.some(o => o && (o.productId || o.product_id || o.productTitle))) return obj;
            for (const item of obj) {
                const res = findItems(item);
                if (res) return res;
            }
        } else if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                const res = findItems(obj[key]);
                if (res) return res;
            }
        }
        return null;
    };

    return findItems(data) || [];
  }

  /**
   * Map different Ali JSON formats to standard schema
   */
  mapAliItems(items) {
    return items.map(item => ({
        id: item.productId || item.product_id || Math.random().toString(36).substr(2, 9),
        title: item.title?.displayTitle || item.product_title || item.title || item.productTitle || "AliExpress Product",
        price: parseFloat(item.prices?.salePrice?.minPrice || item.product_price || item.minPrice || item.price?.salePrice?.value) || 0,
        image: item.image?.imgUrl || item.product_main_image_url || item.imageUrl || item.image?.url || "",
        rating: parseFloat(item.evaluation?.starRating || item.starRating) || 4.5,
        source: 'AliExpress',
        url: item.productDetailUrl || `https://www.aliexpress.com/item/${item.productId}.html`
    })).filter(i => i.price > 0 && i.image);
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
