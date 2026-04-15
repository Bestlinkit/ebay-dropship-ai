import { SourcingStatus } from '../constants/sourcing';

/**
 * Probabilistic AliExpress Reconstruction Engine (v3.0 FINAL)
 * Resilient, high-integrity product data reconstruction with safe partial 
 * acceptance, multi-factor deduplication, and quality filtering.
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
        extractionMethodUsed: "SEMANTIC_RECONSTRUCTION", // Default fallback
        parsedCount: 0,
        jsonCandidatesFound: 0,
        reconstructionConfidenceScore: 0,
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

        // 1. BLOCK DETECTION
        const blockPatterns = ["captcha", "security verification", "robot check", "verify your identity"];
        if (blockPatterns.some(p => html.toLowerCase().includes(p)) || (html.length < 5000 && !html.includes("window."))) {
            return { 
                status: SourcingStatus.BLOCKED, 
                data: [], 
                debugInfo: { ...debugInfo, reason: "AliExpress anti-bot triggered" } 
            };
        }

        let allProducts = [];

        // --- LAYER 1: PROBABILISTIC JSON DISCOVERY ---
        debugInfo.logs.push("LAYER 1: Probabilistic JSON Search...");
        const jsonCandidates = this.discoverJSONBlocks(html);
        debugInfo.jsonCandidatesFound = jsonCandidates.length;

        if (jsonCandidates.length > 0) {
            const bestCandidate = jsonCandidates
                .map(c => ({ ...c, score: this.scoreJSONBlock(c.data) }))
                .sort((a, b) => b.score - a.score)[0];

            debugInfo.reconstructionConfidenceScore = bestCandidate.score;
            const items = this.deepExtractItems(bestCandidate.data);
            const reconstructed = this.mapAliItems(items);
            if (reconstructed.length > 0) {
                debugInfo.extractionMethodUsed = "PROBABILISTIC_JSON";
                allProducts = [...reconstructed];
            }
        }

        // --- LAYER 2: SCRIPT INTELLIGENCE MINING ---
        if (allProducts.length === 0) {
            debugInfo.logs.push("LAYER 2: Script Mining...");
            const scriptResults = this.mineScripts(html);
            if (scriptResults.length > 0) {
                debugInfo.extractionMethodUsed = "SCRIPT_INTELLIGENCE";
                allProducts = [...scriptResults];
            }
        }

        // --- LAYER 3: SEMANTIC PATTERN EXTRACTION ---
        if (allProducts.length === 0) {
            debugInfo.logs.push("LAYER 3: Semantic Pattern Extraction...");
            const semanticResults = this.semanticExtract(html);
            if (semanticResults.length > 0) {
                debugInfo.extractionMethodUsed = "SEMANTIC_RECONSTRUCTION";
                allProducts = [...semanticResults];
            }
        }

        // --- LAYER 4: DOM FALLBACK ---
        if (allProducts.length === 0) {
            debugInfo.logs.push("LAYER 4: DOM Fallback...");
            const domResults = this.domExtract(html);
            if (domResults.length > 0) {
                debugInfo.extractionMethodUsed = "DOM_FALLBACK";
                allProducts = [...domResults];
            }
        }

        // --- DEDUPLICATION, SCORING & FINALIZATION ---
        const finalResults = this.dedupe(allProducts)
            .map(p => ({ ...p, score: this.scoreProductCompleteness(p) }))
            .sort((a, b) => b.score - a.score);

        debugInfo.parsedCount = finalResults.length;

        // --- STATUS DETERMINATION ---
        const keywords = ["price", "sku", "product", "item"];
        const hasSignals = keywords.some(k => html.toLowerCase().includes(k));

        if (finalResults.length > 0) {
            return { status: SourcingStatus.SUCCESS, data: finalResults, debugInfo };
        }

        if (hasSignals) {
            debugInfo.logs.push("Signals found but zero products passed quality/acceptance filters.");
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
   * Refined Acceptance & Safe Mapping
   */
  mapAliItems(items) {
    if (!Array.isArray(items)) return [];
    
    return items.map(item => {
        const title = item.title?.displayTitle || item.product_title || item.title || item.productTitle || null;
        const price = parseFloat(item.prices?.salePrice?.minPrice || item.product_price || item.minPrice || item.price?.salePrice?.value || item.price) || null;
        const image = item.image?.imgUrl || item.product_main_image_url || item.imageUrl || item.image?.url || item.image || null;

        // Refined Acceptance Rule: (title AND (price OR image) AND titleQualityValid) OR (image AND price)
        const titleValid = title && this.isTitleQualityValid(title);
        const accepted = (titleValid && (price || image)) || (image && price);

        if (!accepted) return null;

        return {
            id: item.productId || item.product_id || Math.random().toString(36).substr(2, 9),
            title: title || "Untitled Product",
            price: price, // null is acceptable for safe partial reconstruction
            image: image, // null is acceptable
            rating: parseFloat(item.evaluation?.starRating || item.starRating) || 4.5,
            source: 'AliExpress',
            url: item.productDetailUrl || (item.productId ? `https://www.aliexpress.com/item/${item.productId}.html` : '#')
        };
    }).filter(Boolean);
  }

  /**
   * Multi-Factor Deduplication
   */
  dedupe(products) {
    const seen = new Set();
    const result = [];

    for (const p of products) {
        const normTitle = this.normalizeTitle(p.title);
        const normImage = (p.image || "").split('?')[0].replace(/_\d+x\d+\..+$/, '');
        
        // Dedupe key: Normalized Title (60 chars) OR Normalized Image URL
        const titleKey = `t:${normTitle}`;
        const imageKey = normImage ? `i:${normImage}` : null;

        const isDuplicate = seen.has(titleKey) || (imageKey && seen.has(imageKey));

        // Also check for price proximity (±5%) among similar titles if needed, 
        // but title + image keys usually catch 99% of AliExpress dupes.
        if (!isDuplicate) {
            seen.add(titleKey);
            if (imageKey) seen.add(imageKey);
            result.push(p);
        }
    }
    return result;
  }

  normalizeTitle(title) {
    if (!title) return "";
    return title.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim()
        .substring(0, 60);
  }

  isTitleQualityValid(title) {
    if (!title || title.length < 5) return false;
    const genericTerms = ["aliexpress", "item", "product", "shipping", "free", "cheap", "good", "quality"];
    const words = title.toLowerCase().split(/\s+/).filter(w => !genericTerms.includes(w) && w.length > 2);
    return words.length >= 1; // Must have at least one non-generic word > 2 chars
  }

  scoreProductCompleteness(p) {
    return (p.title && p.title !== "Untitled Product" ? 2 : 0) +
           (p.price ? 2 : 0) +
           (p.image ? 1 : 0);
  }

  /**
   * Layer 1 Helper: Discover JSON blocks
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

  scoreJSONBlock(data) {
    let score = 0;
    const stringData = JSON.stringify(data).toLowerCase();
    const signals = [
        { key: "productid", weight: 5 }, { key: "product_id", weight: 5 },
        { key: "itemid", weight: 5 }, { key: "saleprice", weight: 10 },
        { key: "producttitle", weight: 10 }, { key: "resultlist", weight: 15 }
    ];
    signals.forEach(s => { if (stringData.includes(s.key)) score += s.weight; });
    if (Array.isArray(data)) score += 5;
    return score;
  }

  /**
   * Layer 2 Helper: Mine Script clusters
   */
  mineScripts(html) {
    const rawItems = [];
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        const clusters = match[1].match(/{[^{}]{10,1000}}/g);
        if (clusters) {
            clusters.forEach(cluster => {
                if (cluster.includes("price") && (cluster.includes("title") || cluster.includes("image"))) {
                    try { rawItems.push(JSON.parse(cluster)); } catch (e) {}
                }
            });
        }
    }
    return this.mapAliItems(rawItems);
  }

  /**
   * Layer 3 Helper: Semantic Extraction
   */
  semanticExtract(html) {
    const rawItems = [];
    const priceRegex = /(?:US\s+)?\$\s*(\d+\.\d{2})/g;
    const imgRegex = /https:\/\/[^"'\s]+\.(?:jpg|png|webp|jpeg)/g;
    const prices = [...html.matchAll(priceRegex)];
    const images = [...html.matchAll(imgRegex)];

    prices.forEach(pMatch => {
        const pIdx = pMatch.index;
        const nearbyImg = images.find(iMatch => Math.abs(iMatch.index - pIdx) < 800);
        if (nearbyImg) {
            const contextText = html.substring(pIdx - 150, pIdx + 150).replace(/<[^>]*>/g, ' ').trim();
            rawItems.push({
                product_title: contextText.split(' ').slice(0, 8).join(' '),
                price: pMatch[1],
                image: nearbyImg[0]
            });
        }
    });
    return this.mapAliItems(rawItems);
  }

  /**
   * Layer 4 Helper: DOM
   */
  domExtract(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const itemNodes = [...doc.querySelectorAll('[data-item-id], [data-sku-id]')];
    const rawItems = itemNodes.map(el => ({
        product_id: el.getAttribute('data-item-id') || el.getAttribute('data-sku-id'),
        product_title: el.querySelector('[class*="title"], h3, h1')?.textContent?.trim(),
        price: el.textContent.match(/\$\s*(\d+\.\d{2})/)?.[1],
        image: el.querySelector('img')?.src || el.querySelector('img')?.getAttribute('data-src') || null,
        productDetailUrl: el.querySelector('a')?.href
    }));
    return this.mapAliItems(rawItems);
  }

  deepExtractItems(data) {
    if (!data) return [];
    const findItems = (obj) => {
        if (Array.isArray(obj)) {
            if (obj.some(o => o && (o.productId || o.product_id || o.productTitle || o.title))) return obj;
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
}

export default new AliExpressService();
