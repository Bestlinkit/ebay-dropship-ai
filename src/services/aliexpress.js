import { SourcingStatus } from '../constants/sourcing';

/**
 * Probabilistic AliExpress Reconstruction Engine (v3.0)
 * Does not rely on fixed internal keys. Instead, it scans, scores, 
 * and reconstructs product data from any available HTML/JSON structures.
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

        let results = [];

        // --- LAYER 1: PROBABILISTIC JSON DISCOVERY ---
        debugInfo.logs.push("LAYER 1: Initiating Probabilistic JSON Discovery...");
        const jsonCandidates = this.discoverJSONBlocks(html);
        debugInfo.jsonCandidatesFound = jsonCandidates.length;

        if (jsonCandidates.length > 0) {
            // Score candidates and pick best
            const bestCandidate = jsonCandidates
                .map(c => ({ ...c, score: this.scoreJSONBlock(c.data) }))
                .sort((a, b) => b.score - a.score)[0];

            debugInfo.reconstructionConfidenceScore = bestCandidate.score;

            if (bestCandidate.score >= 10) {
                const items = this.deepExtractItems(bestCandidate.data);
                results = this.mapAliItems(items);
                if (results.length > 0) {
                    debugInfo.extractionMethodUsed = "PROBABILISTIC_JSON";
                    debugInfo.parsedCount = results.length;
                    return { status: SourcingStatus.SUCCESS, data: results, debugInfo };
                }
            }
        }

        // --- LAYER 2: SCRIPT INTELLIGENCE MINING ---
        debugInfo.logs.push("LAYER 2: Initiating Script Intelligence Mining...");
        const reconstructedFromScripts = this.mineScripts(html);
        if (reconstructedFromScripts.length > 0) {
            debugInfo.extractionMethodUsed = "SCRIPT_INTELLIGENCE";
            debugInfo.parsedCount = reconstructedFromScripts.length;
            return { status: SourcingStatus.SUCCESS, data: reconstructedFromScripts, debugInfo };
        }

        // --- LAYER 3: SEMANTIC PATTERN EXTRACTION ---
        debugInfo.logs.push("LAYER 3: Initiating Semantic Pattern Extraction...");
        const semanticResults = this.semanticExtract(html);
        if (semanticResults.length > 0) {
            debugInfo.extractionMethodUsed = "SEMANTIC_PATTERNS";
            debugInfo.parsedCount = semanticResults.length;
            return { status: SourcingStatus.SUCCESS, data: semanticResults, debugInfo };
        }

        // --- LAYER 4: RESTRICTED DOM FALLBACK ---
        debugInfo.logs.push("LAYER 4: Final DOM Discovery...");
        const domResults = this.domExtract(html);
        if (domResults.length > 0) {
            debugInfo.extractionMethodUsed = "DOM_FALLBACK";
            debugInfo.parsedCount = domResults.length;
            return { status: SourcingStatus.SUCCESS, data: domResults, debugInfo };
        }

        // --- TRUTH ENFORCEMENT ---
        const keywords = ["price", "sku", "product", "item"];
        const hasKeywords = keywords.some(k => html.toLowerCase().includes(k));
        
        if (hasKeywords && results.length === 0) {
            debugInfo.logs.push("TRUTH ENFORCEMENT: Product signals found but reconstruction failed.");
            return { status: "PARSE_ERROR", data: [], debugInfo };
        }

        return { 
            status: SourcingStatus.EMPTY, 
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
   * Discovers all large JSON-like blocks within the HTML
   */
  discoverJSONBlocks(html) {
    const candidates = [];
    // Regex for matching JSON-like objects {...} conservatively
    const regex = /{[\s\S]{500,200000}}/g; 
    let match;
    
    while ((match = regex.exec(html)) !== null) {
        const potential = match[0];
        try {
            // Find the boundary of the JSON object more precisely
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
        } catch (e) {
            continue;
        }
    }
    return candidates;
  }

  /**
   * Scores a JSON block based on the presence of product signals
   */
  scoreJSONBlock(data) {
    let score = 0;
    const stringData = JSON.stringify(data).toLowerCase();
    
    const signals = [
        { key: "productid", weight: 5 },
        { key: "product_id", weight: 5 },
        { key: "itemid", weight: 5 },
        { key: "skuid", weight: 3 },
        { key: "saleprice", weight: 10 },
        { key: "displayprice", weight: 10 },
        { key: "producttitle", weight: 10 },
        { key: "imageurl", weight: 5 },
        { key: "itemlist", weight: 15 },
        { key: "mods", weight: 10 },
        { key: "resultlist", weight: 15 }
    ];

    signals.forEach(s => {
        if (stringData.includes(s.key)) score += s.weight;
    });

    // Bonus for arrays
    if (Array.isArray(data)) score += 5;
    
    return score;
  }

  /**
   * Mines all script tags for heuristically reconstructed product objects
   */
  mineScripts(html) {
    const products = [];
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
    let match;
    
    while ((match = scriptRegex.exec(html)) !== null) {
        const content = match[1];
        if (content.length < 500) continue;

        // Hunt for clusters: "price":"...", "title":"...", "image":"..."
        // This regex looks for chunks of text that have these keys in close proximity
        const clusters = content.match(/{[^{}]{10,1000}}/g); // Simplified cluster search
        if (clusters) {
            clusters.forEach(cluster => {
                if ((cluster.includes("productId") || cluster.includes("itemId")) && 
                    cluster.includes("price") && 
                    cluster.includes("title")) {
                    try {
                        const data = JSON.parse(cluster);
                        products.push({
                            id: data.productId || data.itemId || Math.random().toString(36).substr(2, 9),
                            title: data.title || data.productTitle || "AliExpress Item",
                            price: parseFloat(data.price || data.salePrice || 0),
                            image: data.image || data.imageUrl || "",
                            rating: 4.8,
                            source: 'AliExpress',
                            url: '#'
                        });
                    } catch (e) {}
                }
            });
        }
    }
    return products.filter(p => p.price > 0 && p.title.length > 5);
  }

  /**
   * Semantic extraction fallback (Clustering currency + images)
   */
  semanticExtract(html) {
    const products = [];
    // Find all potential prices: $12.99, US $ 12.99, etc.
    const priceRegex = /(?:US\s+)?\$\s*(\d+\.\d{2})/g;
    const imgRegex = /https:\/\/[^"'\s]+\.(?:jpg|png|webp|jpeg)/g;
    
    const prices = [...html.matchAll(priceRegex)];
    const images = [...html.matchAll(imgRegex)];
    
    // If we have both, try to cluster them (if they appear within 500 chars of each other)
    prices.forEach(pMatch => {
        const pIdx = pMatch.index;
        const priceValue = parseFloat(pMatch[1]);
        
        const nearbyImg = images.find(iMatch => Math.abs(iMatch.index - pIdx) < 800);
        if (nearbyImg) {
            // Find potential title (text around the price)
            const textBuffer = html.substring(pIdx - 100, pIdx + 100).replace(/<[^>]*>/g, ' ').trim();
            products.push({
                id: `sem-${pIdx}`,
                title: textBuffer.split(' ').slice(0, 10).join(' ') || "Reconstructed Item",
                price: priceValue,
                image: nearbyImg[0],
                rating: 4.5,
                source: 'AliExpress',
                url: '#'
            });
        }
    });

    return products.slice(0, 20); // Limit results
  }

  /**
   * Clean DOM extraction using strictly data-attributes
   */
  domExtract(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const itemNodes = [...doc.querySelectorAll('[data-item-id], [data-sku-id]')];

    return itemNodes.map(el => {
        const img = el.querySelector('img');
        const priceText = el.textContent.match(/\$\s*(\d+\.\d{2})/) || ["", "0"];
        
        return {
            id: el.getAttribute('data-item-id') || el.getAttribute('data-sku-id'),
            title: el.querySelector('[class*="title"], h3, h1')?.textContent?.trim() || "AliExpress Product",
            price: parseFloat(priceText[1]),
            image: img?.src || img?.getAttribute('data-src') || "",
            rating: 4.5,
            source: 'AliExpress',
            url: el.querySelector('a')?.href || '#'
        };
    }).filter(p => p.price > 0 && p.image);
  }

  /**
   * Deep extract items from unknown JSON structures
   */
  deepExtractItems(data) {
    if (!data) return [];
    
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
        price: parseFloat(item.prices?.salePrice?.minPrice || item.product_price || item.minPrice || item.price?.salePrice?.value || 0),
        image: item.image?.imgUrl || item.product_main_image_url || item.imageUrl || item.image?.url || "",
        rating: parseFloat(item.evaluation?.starRating || item.starRating) || 4.5,
        source: 'AliExpress',
        url: item.productDetailUrl || `https://www.aliexpress.com/item/${item.productId}.html`
    })).filter(i => i.price > 0 && i.image);
  }
}

export default new AliExpressService();
