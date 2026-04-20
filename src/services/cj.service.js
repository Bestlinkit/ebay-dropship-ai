import axios from 'axios';
import sourcingService from './sourcing';
import { normalizeToContract } from './cj.schema';
import { deconstructTitle, validateMatch } from '../utils/productQueryEngine';

// DETECT BRIDGE BASE
const BRIDGE_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * 🛰️ CJ DROPSHIPPING DETERMINISTIC MODULE (v3.0 - CJ-ONLY RESET)
 */
class CJService {
  constructor() {
    this.CONFIG = {
      SEARCH_ENDPOINT: '/api/cj/search',
      DETAIL_ENDPOINT: '/api/cj/detail',
      FREIGHT_ENDPOINT: '/api/cj/freight',
      AUTH_ENDPOINT: `${BRIDGE_BASE}/api/cj/auth`
    };
    this.cache = new Map();
  }

  /**
   * 🛡️ DEFENSIVE PARSING CORE
   */
  isValidCJResponse(data) {
    if (!data) return false;
    // Support both direct responses and {data: ...} wrapped responses
    const root = data.data || data;
    return root.code === 200 || root.success === true || root.result === true || Array.isArray(root.productList);
  }

  recursiveFindArrays(obj, seen = new Set()) {
    if (!obj || typeof obj !== 'object' || seen.has(obj)) return [];
    seen.add(obj);

    let foundArrays = [];
    if (Array.isArray(obj)) {
        foundArrays.push(obj);
        obj.forEach(item => {
            foundArrays = foundArrays.concat(this.recursiveFindArrays(item, seen));
        });
    } else {
        Object.values(obj).forEach(val => {
            foundArrays = foundArrays.concat(this.recursiveFindArrays(val, seen));
        });
    }
    return foundArrays;
  }

  detectSchema(data) {
    const rawStr = JSON.stringify(data || {});
    if (rawStr.includes('productList')) return 'CJ_DS_SEARCH';
    if (rawStr.includes('productVariants')) return 'CJ_DS_DETAIL';
    if (rawStr.includes('productNameEn') || rawStr.includes('pid')) return 'CJ_PRODUCT_FLAT';
    return 'UNKNOWN';
  }

  /**
   * 🏗️ PIPELINE ORCHESTRATION (v6.1 - DUMB SEARCH / SMART RANKING)
   * Mandate: Broad retrieval, deterministic fallback, rank-not-filter.
   */
  async runIterativePipeline(context) {
    const { product, manualQuery, pageNum = 1 } = context;
    const startTime = Date.now();
    const ebayIntel = deconstructTitle(product.title);
    
    const telemetry = {
        query_mode: "DIRECT_MATCH",
        pages_scanned: 0,
        results_merged: 0,
        fallback_triggered: false,
        final_query: null
    };

    try {
        let currentQuery = manualQuery || ebayIntel.queries.fallback;
        
        // v2 RULE: keyword must contain at least 2 meaningful words, else fallback to original
        const words = currentQuery.split(/\s+/).filter(w => w.length >= 2);
        if (!manualQuery && words.length < 2) {
            currentQuery = product.title;
        }

        if (manualQuery) telemetry.query_mode = "MANUAL_OVERRIDE";

        // --- STAGE 1: PRIMARY ATTEMPT ---
        let { items: results, raw: rawResponse } = await this.performPaginatedSearch(currentQuery, telemetry, pageNum);
        telemetry.final_query = currentQuery;

        // --- STAGE 2: ORIGINAL TITLE FALLBACK (Automatic) ---
        if (results.length === 0 && !manualQuery) {
            telemetry.fallback_triggered = true;
            telemetry.query_mode = "ORIGINAL_TITLE_FALLBACK";
            const originalQuery = product.title;
            const fallbackResult = await this.performPaginatedSearch(originalQuery, telemetry, pageNum);
            results = fallbackResult.items;
            rawResponse = fallbackResult.raw;
            telemetry.final_query = originalQuery;
        }

        // --- STAGE 3: SINGLE KEYWORD FALLBACK ---
        if (results.length === 0 && !manualQuery) {
            telemetry.query_mode = "SINGLE_KEYWORD_FALLBACK";
            // Take the last word which is often the most descriptive (jeans, sneakers, etc)
            const words = product.title.split(/\s+/).filter(w => w.length >= 3);
            const singleKeyword = words[words.length - 1] || words[0];
            
            if (singleKeyword) {
                const singleResult = await this.performPaginatedSearch(singleKeyword, telemetry, pageNum);
                results = singleResult.items;
                rawResponse = singleResult.raw;
                telemetry.final_query = singleKeyword;
            }
        }

        // --- SCORING & RANKING ---
        const scored = results.map(item => {
            const alignment = this.calculateAlignmentScore(product, item, ebayIntel);
            const intelligence = this.buildIntelligencePayload(item, product);
            return { ...item, ...alignment, intelligence };
        });

        // Step 3: Profit-First Ranking (v7.0)
        const ranked = scored.sort((a,b) => {
            const profitA = typeof a.intelligence.financials.net_profit === 'number' ? a.intelligence.financials.net_profit : -9999;
            const profitB = typeof b.intelligence.financials.net_profit === 'number' ? b.intelligence.financials.net_profit : -9999;
            
            if (profitB !== profitA) return profitB - profitA;
            return (b.stock || 0) - (a.stock || 0);
        });

        // --- DEBUG RESPONSE (v2 Rule) ---
        const contentBlocks = rawResponse?.data?.content?.length || 0;
        
        return { 
            status: ranked.length > 0 ? "SUCCESS" : "NO_MATCH_FOUND", 
            products: ranked, 
            mode: telemetry.query_mode,
            raw: rawResponse,
            debug: {
                queryUsed: currentQuery,
                contentBlocks: contentBlocks,
                productsFound: ranked.length,
                fallbackTriggered: telemetry.fallback_triggered,
                finalQuery: telemetry.final_query
            },
            telemetry: { latency: Date.now() - startTime, ...telemetry, merged_count: ranked.length } 
        };
    } catch (err) { 
        console.error("[CJ v6.4 Fault]", err);
        return { status: "ERROR", message: err.message }; 
    }
  }

  async performPaginatedSearch(keyword, telemetry, pageNum = 1) {
    const items = [];
    let lastRaw = null;

    try {
        const response = await axios.get(`${BRIDGE_BASE}${this.CONFIG.SEARCH_ENDPOINT}`, { 
            params: { keyword, pageNum, pageSize: 20 } 
        });
        
        lastRaw = response.data;
        if (!lastRaw || lastRaw.code !== 200) {
            console.warn(`[CJ API] Non-200 Response on Page ${pageNum}:`, lastRaw);
            return { items, raw: lastRaw };
        }

        // v2 PATH FIX: data -> content[] -> productList[]
        const rawContent = lastRaw?.data?.content;
        let pageItems = [];
        
        if (Array.isArray(rawContent)) {
            pageItems = rawContent.flatMap(block => block.productList || []);
        } else {
            // Back-compat / Fallback for different API versions
            pageItems = lastRaw?.data?.productList || [];
        }

        pageItems.forEach(item => items.push(normalizeToContract(item)));
        telemetry.pages_scanned++;
    } catch (e) { 
        console.error(`[CJ API] Page ${pageNum} Crash:`, e.message);
    }
    
    return { items, raw: lastRaw };
  }

  /**
   * 🔍 FETCH PRODUCT DETAIL (v12.1)
   */
  async getProductDetail(pid) {
    if (this.cache.has(pid)) return this.cache.get(pid);

    try {
        const response = await axios.get(`${BRIDGE_BASE}${this.CONFIG.DETAIL_ENDPOINT}`, { 
            params: { pid } 
        });
        
        if (response.data?.code === 200) {
            const detail = response.data.data;
            this.cache.set(pid, detail);
            return detail;
        }
    } catch (e) {
        console.error(`[CJ DETAIL] Failed for ${pid}:`, e.message);
    }
    return null;
  }

  /**
   * 🚢 FETCH SHIPPING OPTIONS (v13.0)
   */
  async getShippingOptions(pid, countryCode = 'US') {
    try {
        const response = await axios.get(`${BRIDGE_BASE}${this.CONFIG.FREIGHT_ENDPOINT}`, {
            params: { pid, countryCode }
        });
        
        if (response.data && response.data.code === 200) {
            const list = response.data.data || [];
            return list.map(opt => ({
                name: opt.logisticName || "Standard Shipping",
                cost: parseFloat(opt.amount || 0),
                deliveryTime: opt.logisticTime || "7-15 Days"
            }));
        }
    } catch (e) {
        console.error(`[CJ SHIPPING] Failed for ${pid}:`, e.message);
    }
    return []; // v14.1: Return empty for Pure API Truth (no fallbacks)
  }

  /**
   * 🚀 BATCH ENRICHMENT WORKER (v12.1)
   * Fetches details for products in batches to maintain performance.
   */
  async enrichProductList(products, onEnriched, concurrency = 5) {
    const results = [...products];
    const queue = [...products];
    
    const worker = async () => {
        while (queue.length > 0) {
            const product = queue.shift();
            if (!product) continue;

            const detail = await this.getProductDetail(product.product_id);
            if (detail) {
                const refreshed = normalizeToContract(detail, true); // true = IS_DETAIL
                if (refreshed) {
                    onEnriched(product.product_id, refreshed);
                }
            }
        }
    };

    // Run parallel workers
    const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(worker);
    await Promise.all(workers);
  }

  /**
   * 🛒 ENRICH SINGLE PRODUCT (v14.2)
   * Fetches and normalizes a single product ID with depth.
   */
  async enrichSingleProduct(pid) {
    const detail = await this.getProductDetail(pid);
    if (detail) {
        return normalizeToContract(detail, true);
    }
    return null;
  }

  /**
   * 🧼 SCIENTIFIC SCORING (v6.1 - TYPE ANCHORED)
   */
  calculateAlignmentScore(ebayProduct, normalizedCj, ebayIntel = null) {
  /**
   * 📊 PURE API SELLABILITY (v14.5)
   * Derived 100% from Lists (Popularity) and Stock (Availability).
   */
  calculatePureSellability(cjProduct) {
    const listFactor = Math.min(50, (cjProduct.lists || 0) / 20); // 1000 lists = 50 pts
    const stockFactor = Math.min(50, (cjProduct.stock || 0) / 100); // 5000 stock = 50 pts
    
    return Math.round(listFactor + stockFactor);
  }

  /**
   * 🧼 SCIENTIFIC SCORING (v6.1 - TYPE ANCHORED)
   */
  calculateAlignmentScore(ebayProduct, normalizedCj, ebayIntel = null) {
    const intel = ebayIntel || deconstructTitle(ebayProduct.title);
    const cjTitle = normalizedCj.title.toLowerCase();
    
    let baseScore = 20; 
    
    const ebayWords = ebayProduct.title.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
    
    const intersect = ebayWords.filter(w => cjTitle.includes(w));
    const overlapPercent = (intersect.length / Math.max(1, ebayWords.length));
    baseScore += Math.round(overlapPercent * 80);

    if (intel.product_type && cjTitle.includes(intel.product_type)) {
        baseScore += 20;
    }
    
    const finalScore = Math.min(100, baseScore);
    
    return { 
        alignmentScore: finalScore, 
        matchReason: finalScore > 80 ? "High Relevance" : (finalScore > 50 ? "Keyword Match" : "Broad Retrieval")
    };
  }

  /**
   * 🧠 COMMERCE INTELLIGENCE ENGINE (v14.5 - PRECISION FORMULA)
   * Mandate: Profit = eBay Price - (CJ Cost + Shipping)
   */
   buildIntelligencePayload(normalizedCj, ebayProduct) {
    const ebayPrice = Number(ebayProduct.price || 0);
    const cjCost = Number(normalizedCj.price || 0);
    
    // v14.0: Strict Logistics (No Benchmarks)
    let shippingCost = Number(normalizedCj.shipping?.shipping_cost || 0);
    let shippingLabel = shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : "FREE";
    
    if (normalizedCj.shipping?.shipping_cost === null || normalizedCj.shipping?.shipping_cost === undefined) {
        shippingLabel = "PENDING API DATA";
        shippingCost = 0; // Reset for profit calculation but show pending
    }

    // 2. Net Profit Calculation (PRECISION V14.5)
    // Formula: eBay Price - (CJ Cost + Shipping Fee)
    const exactShippingData = normalizedCj.shipping?.shipping_cost !== null;
    const netProfit = exactShippingData ? ebayPrice - (cjCost + shippingCost) : null;

    // 3. Margin Signaling & Sellability
    const sellability = this.calculatePureSellability(normalizedCj);
    let marginSignal = "UNVERIFIED";
    if (netProfit !== null) {
        if (netProfit > 10) marginSignal = "High Profit";
        else if (netProfit >= 3) marginSignal = "Medium Profit";
        else if (netProfit > 0) marginSignal = "Low Profit";
        else marginSignal = "LOSS";
    }

    return {
        financials: { 
            net_profit: netProfit,
            margin_signal: marginSignal,
            sellability_score: sellability,
            shipping_cost: shippingCost,
            shipping_used: shippingCost,
            shipping_source: normalizedCj.shipping?.isReal ? "REAL" : "UNAVAILABLE",
            status: netProfit !== null ? (netProfit > 0 ? "PROFITABLE" : "LOSS") : "PENDING",
            shipping_label: shippingLabel
        },
        shipping: { 
            delivery_estimate: normalizedCj.shipping?.delivery_days || "NO API DATA", 
            warehouse: normalizedCj.warehouse || "GLOBAL",
            origin: normalizedCj.shipping?.from || "GLOBAL",
            isReal: normalizedCj.shipping?.isReal
        },
        metadata: {
            sku: normalizedCj.sku,
            cj_url: normalizedCj.cj_url,
            lists: normalizedCj.lists || 0
        }
    };
  }

  normalizeResult(normalized) {
    return {
      ...normalized,
      id: normalized.product_id,
      image: normalized.images?.[0] || "",
      source: 'CJ',
      url: `https://cjdropshipping.com/product-detail.html?id=${normalized.product_id}`
    };
  }

  // KEEP AUTH UTILS FOR CONNECTIVITY
  async testConnection() {
    try {
        const response = await axios.post(`${BRIDGE_BASE}/api/cj/auth`, { 
            apiKey: import.meta.env.VITE_CJ_API_KEY 
        });
        return { cjConnectionStatus: response.data?.status === 'AUTH_SUCCESS' ? "CONNECTED" : "FAILED" };
    } catch (e) {
        return { cjConnectionStatus: "FAILED", message: e.message };
    }
  }
}

export default new CJService();
