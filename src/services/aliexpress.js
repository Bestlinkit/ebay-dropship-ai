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

  async fetchWithTimeout(url, options = {}, timeout = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
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
        const response = await this.fetchWithTimeout(debugInfo.endpoint);
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
   * STAGE 2: DETAIL ENRICHMENT (v7.0)
   * Fetches full product data from the detail page URL.
   */
  async getProductDetails(url) {
    if (!url || url === '#') return { status: 'ERROR', message: 'Invalid URL' };

    const debugInfo = {
        endpoint: `${this.proxyUrl}/aliexpress-product-details?url=${encodeURIComponent(url)}`,
        timestamp: new Date().toISOString(),
        stage: "ENRICHMENT"
    };

    try {
        const response = await this.fetchWithTimeout(debugInfo.endpoint);
        const html = await response.text();
        
        // 🧪 EXTRACTION LOGIC
        const jsonBlocks = this.discoverJSONBlocks(html);
        let runParams = null;
        
        // Prioritize blocks with SKU/Image data
        for (const block of jsonBlocks) {
            if (block.data?.skuModule || block.data?.imageModule) {
                runParams = block.data;
                break;
            }
        }

        // 💰 REFINED PRICE EXTRACTION
        let price = null;
        const priceObj = runParams?.skuModule?.skuPrice || runParams?.priceModule?.minAmount;
        if (priceObj) {
            price = parseFloat(priceObj.value || priceObj.minPrice || priceObj.amount);
        }

        // 🆔 SKU & VARIANTS (Iron Flow 7.0 - Force Extraction)
        const skuId = runParams?.skuModule?.skuPriceList?.[0]?.skuId || null;
        const variants = runParams?.skuModule?.productSKUPropertyList || [];
        
        // 🖼️ IMAGE GALLERY
        const images = runParams?.imageModule?.imagePathList || [];

        // 📝 DESCRIPTION
        const description = 
            runParams?.descriptionModule?.description || 
            html.match(/<div class="detail-desc">([\s\S]*?)<\/div>/)?.[1] || 
            null;

        return {
            status: SourcingStatus.SUCCESS,
            data: {
                price: price > 0 ? price : null,
                skuId,
                variants,
                images,
                description,
                title: runParams?.productModule?.title || null,
                enriched: true
            },
            debugInfo
        };

    } catch (e) {
        console.warn("AliExpress Enrichment Failed:", e.message);
        return { 
            status: "PARTIAL_DATA", 
            message: "Enrichment failed, using search baseline", 
            fallback: true,
            debugInfo: { ...debugInfo, error: e.message }
        };
    }
  }

  /**
   * Concurrent Auto-Enrichment (Iron Flow 7.0)
   * Limits concurrency to avoid anti-bot triggers.
   */
  async enrichWithLimit(items, limit = 2) {
    if (!items || items.length === 0) return [];
    
    // 🔍 Select candidates that actually need hydration
    const needsEnrichment = p => (!p.price || !p.image) && !p.enriched;
    const candidates = items.filter(needsEnrichment).slice(0, 5);
    
    if (candidates.length === 0) return items;

    const enrichedItems = [...items];

    for (let i = 0; i < candidates.length; i += limit) {
        const chunk = candidates.slice(i, i + limit);
        const results = await Promise.all(
            chunk.map(async (item) => {
                const enrichment = await this.getProductDetails(item.url);
                if (enrichment.status === SourcingStatus.SUCCESS) {
                    return { 
                        ...item, 
                        ...enrichment.data, 
                        enrichmentStatus: "DONE", 
                        enriched: true,
                        status: "READY" // 🚀 Iron Flow 7.2: Promotion to READY
                    };
                }
                return { ...item, enrichmentStatus: "FAILED", status: "READY" }; // Ready even if failed, to allow manual review
            })
        );
        
        // Update the main array with enriched data
        results.forEach(res => {
            const idx = enrichedItems.findIndex(p => p.id === res.id);
            if (idx !== -1) enrichedItems[idx] = res;
        });
    }

    return enrichedItems;
  }

  /**
   * Refined Stable Mapping: recovery over perfection.
   * IRON SHIELD v6.1: Enforces strict blocklist for Ads and Null prices.
   */
  stableMap(items) {
    if (!Array.isArray(items)) return [];
    
    const isBlockedTitle = (title = "") => {
        const t = (title || "").toLowerCase();
        return [
            "why am i seeing this ad",
            "who is the advertiser",
            "ad targeting",
            "sponsored",
            "suggested for you"
        ].some(b => t.includes(b));
    };

    return items.map(item => {
        const title = item.title?.displayTitle || item.product_title || item.title || item.productTitle || "";
        
        // 🗑️ AD BLOCKER (IRON SHIELD)
        if (isBlockedTitle(title)) return null;

        // If it's already mapped (from semantic/dom), verify it
        if (item.source === 'AliExpress' && item.title && item.price > 0) return item;

        // 💰 PRICE EXTRACTION (Deterministic Recovery Engine)
        let price = null;
        const priceObj = 
            item.prices?.salePrice || 
            item.prices?.minPrice || 
            item.skuModule?.skuPrice || 
            item.skuModule?.skuActivityAmount ||
            item.priceModule?.minAmount ||
            item.prices?.discountedPrice ||
            item.prices?.originalPrice ||
            item.skuPrice ||
            item.price || 
            item.minPrice;
        
        if (typeof priceObj === 'object' && priceObj !== null) {
            price = parseFloat(priceObj.value || priceObj.minPrice || priceObj.salePrice || priceObj.price || priceObj.amount || priceObj.activityAmount || priceObj.discountedPrice);
        } else {
            price = parseFloat(priceObj) || parseFloat(item.product_price);
        }

        // GREEDY FALLBACK: If price is still missing/0, attempt regex recovery from raw item string
        if (!price || price === 0) {
            const rawStr = JSON.stringify(item);
            const priceMatch = rawStr.match(/["'](?:price|amount|value|salePrice|minPrice)["']\s*:\s*(?:["']?(\d+\.\d{1,2})["']?|(\d+))/i);
            if (priceMatch) price = parseFloat(priceMatch[1] || priceMatch[2]);
        }

        // 🛑 NULL ENFORCEMENT
        price = price > 0 ? price : null;

        const image = item.image?.imgUrl || item.product_main_image_url || item.imageUrl || item.image?.url || item.image || null;

        // 🛡️ SOFT VALIDATION RULE (v7.1)
        // Only block if it's an Ad OR completely missing both title and image
        const isCoreDataMissing = !(title && title.length > 5) && !image;
        if (isCoreDataMissing || isBlockedTitle(title)) return null;

        return {
            id: item.productId || item.product_id || `ali_${Math.random().toString(36).slice(2, 9)}`,
            title: title || "AliExpress Listing",
            price: price, 
            image: image,
            rating: parseFloat(item.evaluation?.starRating || item.rating || 4.5),
            source: 'AliExpress',
            url: item.productDetailUrl || (item.productId ? `https://www.aliexpress.com/item/${item.productId}.html` : '#'),
            delivery: item.delivery?.displayAmount || "15-25 days",
            shipsFrom: item.logistics?.shipsFrom || "CN",
            enrichmentStatus: "PENDING",
            enriched: false,
            isValid: !!(title && image),
            hasPrice: !!price
        };
    }).filter(p => p && p.title && p.title.length > 5);
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
   * Discovers all large JSON-like blocks within the HTML,
   * now supporting window assignments (window.__SSR_DATA__ = {...})
   */
  discoverJSONBlocks(html) {
    const candidates = [];
    // 🔍 Target script assignments and raw objects
    const regex = /(?:window\.(?:__SSR_DATA__|runParams|initialData)\s*=\s*)?({[\s\S]{500,500000}})/g; 
    let match;
    while ((match = regex.exec(html)) !== null) {
        let potential = match[1];
        
        try {
            // Primitive balancing to ensure we catch the right closing brace
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
