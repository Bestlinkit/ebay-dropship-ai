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
   * 🚢 FETCH SHIPPING OPTIONS (v14.8 - Shipping Fix Only)
   * PART 1 & 2: Force correct flat payload and include warehouse.
   */
  async getShippingOptions(sku, countryCode = 'US', warehouseId = null, quantity = 1) {
    console.log("SHIPPING FUNCTION ACTIVE");
    if (!sku) return { methods: [], status: "no_sku" };
    
    // 🧠 STEP 3 — HARD DEBUG LOG (MANDATORY)
    console.log("CJ SHIPPING REQUEST", {
        sku,
        quantity: 1,
        countryCode,
        warehouseId
    });

    try {
        const payload = {
            sku,
            quantity: 1,
            countryCode,
            warehouseId
        };

        const response = await axios.post(`${BRIDGE_BASE}${this.CONFIG.FREIGHT_ENDPOINT}`, payload);
        
        // 🧠 v14.13: RAW DEBUG LOG (BEFORE MAPPING)
        console.log("CJ RAW METHODS:", response.data?.data);

        if (response.data && response.data.code === 200) {
            const list = response.data.data || [];
            if (list.length > 0) {
                const methods = list.map(opt => ({
                    name: opt.logisticName || "Standard Shipping",
                    cost: parseFloat(opt.amount ?? 0), // Use nullish coalescing to preserve 0
                    deliveryTime: opt.logisticTime || "7-15 Days",
                    warehouse: warehouseId || (opt.logisticName?.toUpperCase().includes('US') ? 'US' : 'CN')
                }));
                return { methods, status: "resolved" };
            }
            return { methods: [], status: "resolved" }; // Resolved but empty
        }
        return { methods: [], status: "error" };
    } catch (e) {
        console.error(`[CJ SHIPPING] Fault for SKU ${sku}:`, e.message);
        return { methods: [], status: "error" };
    }
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
   * 🛒 ENRICH SINGLE PRODUCT (v14.7 - Intelligence Preservation)
   * Fetches and normalizes a single product ID with depth, while preserving intelligence context.
   */
  async enrichSingleProduct(pid, ebayProduct = null) {
    console.log("ENRICH FUNCTION ACTIVE");
    const detail = await this.getProductDetail(pid);
    if (detail) {
        const normalized = normalizeToContract(detail, true);
        if (ebayProduct) {
            normalized.intelligence = this.buildIntelligencePayload(normalized, ebayProduct);
        }
        return normalized;
    }
    return null;
  }

  /**
   * 📊 STRATEGIC SELLABILITY ENGINE (v14.18)
   * High-authority scoring based on margins, logistics, and supply stability.
   */
  calculateStrategicSellability(normalizedCj, ebayProduct) {
    let score = 0;
    const details = {};

    // 1. Price Gap Vector (40 pts)
    const ebayPrice = parseFloat(ebayProduct.price || 0);
    const cjPrice = parseFloat(normalizedCj.price || 0);
    const gap = ebayPrice - cjPrice;
    
    if (gap > 20) score += 40;
    else if (gap > 10) score += 25;
    else if (gap > 0) score += 10;
    details.priceGap = gap;

    // 2. Logistics Availability (20 pts)
    const hasRealShipping = normalizedCj.shipping?.isReal || (normalizedCj.shipping?.options?.length > 0);
    if (hasRealShipping) score += 20;
    details.hasShipping = hasRealShipping;

    // 3. Delivery Velocity (20 pts)
    const deliveryDays = parseInt(normalizedCj.shipping?.delivery_days || 15);
    if (deliveryDays <= 7) score += 20;
    else if (deliveryDays <= 12) score += 10;
    details.deliveryDays = deliveryDays;

    // 4. Supply Stability (20 pts)
    const stock = normalizedCj.stock || 0;
    const lists = normalizedCj.lists || 0;
    
    if (stock > 500 && lists > 50) score += 20;
    else if (stock > 100) score += 10;
    details.stock = stock;
    details.lists = lists;

    console.log("SELLABILITY INPUT", { sku: normalizedCj.sku, ...details });
    console.log("SELLABILITY OUTPUT", score);

    console.log("STEP 7: SELLABILITY", score);
    return Math.min(100, score);
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
   * 🧠 COMMERCE INTELLIGENCE ENGINE (v14.7 - PROTECTION LAYER)
   * PART 1: Intelligence Engine must NEVER be overwritten by CJ enrichment.
   */
   buildIntelligencePayload(normalizedCj, ebayProduct) {
    // 🔒 LOCK FIELDS (Part 1 - Mandatory)
    const ebayPrice = Number(ebayProduct.price || 0);
    const demand = ebayProduct.demand || 50; 
    const competition = ebayProduct.competition || "Medium";
    const momentum = ebayProduct.momentum || "Stable";
    const cjCost = Number(normalizedCj.price || 0);
    
    // 🧠 v14.18: STRATEGIC SCORING (NO MORE HARDCODED 50)
    const sellabilityScore = this.calculateStrategicSellability(normalizedCj, ebayProduct);
    
    // v14.7: Shipping Logic (Stabilized)
    const shippingCost = Number(normalizedCj.shipping?.shipping_cost || 0);
    const hasShipping = normalizedCj.shipping?.shipping_cost !== null && normalizedCj.shipping?.shipping_cost !== undefined;
    
    let shippingLabel = hasShipping ? `$${shippingCost.toFixed(2)}` : "Fetching shipping...";
    
    // 2. Net Profit Calculation (PRECISION V14.7)
    // Formula: eBay Price - (CJ Cost + Shipping Fee)
    const netProfit = hasShipping ? (ebayPrice - (cjCost + shippingCost)) : (ebayPrice - cjCost);
    const profitStatus = hasShipping ? (netProfit > 0 ? "PROFITABLE" : "LOSS") : "estimated (excluding shipping)";

    // 3. Margin Signaling 
    let marginSignal = "UNVERIFIED";
    if (netProfit !== null) {
        if (netProfit > 10) marginSignal = "High Profit";
        else if (netProfit >= 3) marginSignal = "Medium Profit";
        else if (netProfit > 0) marginSignal = "Low Profit";
        else marginSignal = "LOSS";
    }

    // 4. Strategic Justification Engine (v14.14)
    const lists = normalizedCj.lists || 0;
    const rating = parseFloat(normalizedCj.rating || 0);
    
    let marketIntegrity = "VARIABLE";
    if (rating >= 4.5 && lists > 50) marketIntegrity = "HIGH-AUTHORITY";
    else if (rating >= 4.0 || lists > 10) marketIntegrity = "STABLE";

    let strategicAdvantage = "Opportunity Identified";
    if (netProfit > 10 && demand > 70) strategicAdvantage = "High Velocity / High Margin";
    else if (netProfit > 5 && competition === "Low") strategicAdvantage = "Blue Ocean Entry";
    else if (lists > 100) strategicAdvantage = "Proven Market Winner";
    else if (demand > 80) strategicAdvantage = "Unmet Demand Capture";

    let intensity = "MODERATE";
    if (demand > 80 || lists > 200) intensity = "HIGH";
    else if (demand < 30) intensity = "LOW";

    return {
        financials: { 
            net_profit: netProfit,
            margin_signal: marginSignal,
            sellability_score: sellabilityScore, // DYNAMIC
            shipping_cost: shippingCost,
            shipping_source: normalizedCj.shipping?.isReal ? "REAL" : "UNAVAILABLE",
            status: profitStatus,
            shipping_label: shippingLabel,
            locked: {
                ebay_price: ebayPrice,
                demand,
                competition,
                momentum
            }
        },
        shipping: { 
            resolved: hasShipping,
            delivery_estimate: normalizedCj.shipping?.delivery_days || "Fetching...", 
            warehouse: normalizedCj.warehouse || "China",
            origin: normalizedCj.shipping?.from || "China",
            isReal: normalizedCj.shipping?.isReal,
            methods: normalizedCj.shipping?.options || []
        },
        strategic: {
            market_integrity: marketIntegrity,
            strategic_advantage: strategicAdvantage,
            momentum_intensity: intensity
        },
        metadata: {
            sku: normalizedCj.sku,
            cj_url: normalizedCj.cj_url,
            lists: lists
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
