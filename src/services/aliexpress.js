import { SourcingStatus } from '../constants/sourcing';

/**
 * AliExpress Stability Fix (v1 STABLE)
 * Simple, resilient extraction engine that prioritizes recovery over filtering.
 * Never silently rejects results based on "quality" or "confidence."
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
        extractionMethodUsed: "STABLE_RECONSTRUCTION",
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

        // 1. BLOCK DETECTION (Captcha / Verify)
        const blockPatterns = ["captcha", "security verification", "robot check", "verify your identity", "onfirmed by our systems"];
        if (blockPatterns.some(p => html.toLowerCase().includes(p))) {
            return { 
                status: SourcingStatus.BLOCKED, 
                data: [], 
                debugInfo: { 
                    ...debugInfo, 
                    reason: "AliExpress anti-bot triggered",
                    htmlLength: html.length 
                } 
            };
        }

        let allExtractedData = [];

        // --- STEP 1: EXTRACT EVERYTHING ---
        
        // A. JSON Discovery
        const jsonCandidates = this.discoverJSONBlocks(html);
        if (jsonCandidates.length > 0) {
            debugInfo.logs.push("JSON_SIGNAL_FOUND");
            jsonCandidates.forEach(candidate => {
                const items = this.deepExtractItems(candidate.data);
                if (items.length > 0) {
                    allExtractedData = [...allExtractedData, ...items];
                }
            });
        }

        // B. Script Mining
        const scriptItems = this.mineScripts(html);
        if (scriptItems.length > 0) {
            allExtractedData = [...allExtractedData, ...scriptItems];
        }

        // C. DOM Fallback
        const domItems = this.domExtract(html);
        if (domItems.length > 0) {
            allExtractedData = [...allExtractedData, ...domItems];
        }

        // D. Semantic
        const semanticItems = this.semanticExtract(html);
        if (semanticItems.length > 0) {
            allExtractedData = [...allExtractedData, ...semanticItems];
        }

        // --- STEP 2: MAP LOOSELY (NO REJECTION) ---
        const mappedResults = this.stableMap(allExtractedData);
        
        // --- STEP 3: DEDUPE & FINALIZE ---
        const finalResults = this.simpleDedupe(mappedResults);
        debugInfo.parsedCount = finalResults.length;

        if (finalResults.length > 0) {
            debugInfo.logs.push(`PRODUCT_MAPPED: ${finalResults.length}`);
            return { status: SourcingStatus.SUCCESS, data: finalResults, debugInfo };
        }

        // --- TRUTH ENFORCEMENT ---
        const keywords = ["price", "sku", "product", "item"];
        const hasSignals = keywords.some(k => html.toLowerCase().includes(k));

        if (hasSignals) {
            return { status: SourcingStatus.PARSE_ERROR, data: [], debugInfo };
        }

        return { status: SourcingStatus.EMPTY, data: [], debugInfo };

    } catch (e) {
        return { 
            status: SourcingStatus.NETWORK_ERROR, 
            data: [], 
            debugInfo: { ...debugInfo, errorStack: e.message } 
        };
    }
  }

  /**
   * Refined Stable Mapping: recovery over perfection.
   */
  stableMap(items) {
    if (!Array.isArray(items)) return [];
    
    return items.map(item => {
        // If it's already mapped (from semantic/dom), keep it
        if (item.source === 'AliExpress' && item.title) return item;

        const title = item.title?.displayTitle || item.product_title || item.title || item.productTitle || null;
        const price = parseFloat(item.prices?.salePrice?.minPrice || item.product_price || item.minPrice || item.price?.salePrice?.value || item.price) || null;
        const image = item.image?.imgUrl || item.product_main_image_url || item.imageUrl || item.image?.url || item.image || null;

        // SIMPLE RULE: (title OR price OR image) must have something, but title is prioritized for display
        if (!title && !price && !image) return null;

        return {
            id: item.productId || item.product_id || Math.random().toString(36).substr(2, 9),
            title: title || "AliExpress Listing",
            price: price, 
            image: image,
            rating: 4.5,
            source: 'AliExpress',
            url: item.productDetailUrl || (item.productId ? `https://www.aliexpress.com/item/${item.productId}.html` : '#')
        };
    }).filter(Boolean);
  }

  simpleDedupe(products) {
    const seenIds = new Set();
    const seenTitles = new Set();
    const result = [];

    for (const p of products) {
        const idKey = String(p.id);
        const titleKey = (p.title || "").toLowerCase().trim();

        if (!seenIds.has(idKey) && !seenTitles.has(titleKey)) {
            seenIds.add(idKey);
            seenTitles.add(titleKey);
            result.push(p);
        }
    }
    return result;
  }

  /**
   * Discovers all large JSON-like blocks within the HTML
   */
  discoverJSONBlocks(html) {
    const candidates = [];
    const regex = /{[\s\S]{500,200000}}/g; 
    let match;
    while ((match = regex.exec(html)) !== null) {
        const potential = match[0];
        try {
            let balance = 0;
            let endIdx = -1;
            for (let i = 0; i < potential.length; i++) {
                if (potential[i] === '{') balance++;
                else if (potential[i] === '}') balance--;
                if (balance === 0 && i > 0) {
                    endIdx = i + 1;
                    break;
                }
            }
            if (endIdx !== -1) {
                const cleanJson = potential.substring(0, endIdx);
                const data = JSON.parse(cleanJson);
                candidates.push({ data, length: cleanJson.length });
            }
        } catch (e) { continue; }
    }
    return candidates;
  }

  mineScripts(html) {
    const rawItems = [];
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        const clusters = match[1].match(/{[^{}]{10,1000}}/g);
        if (clusters) {
            clusters.forEach(cluster => {
                if (cluster.includes("price") || cluster.includes("title") || cluster.includes("image")) {
                    try { rawItems.push(JSON.parse(cluster)); } catch (e) {}
                }
            });
        }
    }
    return rawItems;
  }

  semanticExtract(html) {
    const products = [];
    const priceRegex = /(?:US\s+)?\$\s*(\d+\.\d{2})/g;
    const imgRegex = /https:\/\/[^"'\s]+\.(?:jpg|png|webp|jpeg)/g;
    const prices = [...html.matchAll(priceRegex)];
    const images = [...html.matchAll(imgRegex)];

    prices.forEach(pMatch => {
        const pIdx = pMatch.index;
        const nearbyImg = images.find(iMatch => Math.abs(iMatch.index - pIdx) < 800);
        if (nearbyImg) {
            const contextText = html.substring(pIdx - 150, pIdx + 150).replace(/<[^>]*>/g, ' ').trim();
            products.push({
                title: contextText.split(' ').slice(0, 8).join(' '),
                price: parseFloat(pMatch[1]),
                image: nearbyImg[0],
                source: 'AliExpress'
            });
        }
    });
    return products;
  }

  domExtract(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const itemNodes = [...doc.querySelectorAll('[data-item-id], [data-sku-id], div[class*="item"], div[class*="product"]')];
    return itemNodes.map(el => {
        const title = el.querySelector('[class*="title"], h3, h1')?.textContent?.trim();
        const price = el.textContent.match(/\$\s*(\d+\.\d{2})/)?.[1];
        const image = el.querySelector('img')?.src || el.querySelector('img')?.getAttribute('data-src') || null;
        
        if (!title && !price && !image) return null;

        return {
            id: el.getAttribute('data-item-id') || el.getAttribute('data-sku-id') || Math.random().toString(36).substr(2, 9),
            title: title || "AliExpress Listing",
            price: parseFloat(price) || null,
            image: image,
            source: 'AliExpress',
            url: el.querySelector('a')?.href || '#'
        };
    }).filter(Boolean);
  }

  deepExtractItems(data) {
    if (!data) return [];
    const results = [];
    const findItems = (obj) => {
        if (Array.isArray(obj)) {
            if (obj.some(o => o && (o.productId || o.product_id || o.productTitle || o.title))) {
                results.push(...obj);
                return;
            }
            for (const item of obj) {
                findItems(item);
            }
        } else if (typeof obj === 'object' && obj !== null) {
            for (const key in obj) {
                findItems(obj[key]);
            }
        }
    };
    findItems(data);
    return results;
  }
}

export default new AliExpressService();
