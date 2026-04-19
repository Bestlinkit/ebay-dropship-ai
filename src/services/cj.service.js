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
    
    // Telemetry Init
    const telemetry = {
        query_mode: "DIRECT_MATCH",
        pages_scanned: 0,
        results_merged: 0,
        fallback_triggered: false
    };

    try {
        const mergedMap = new Map();
        let currentQuery = manualQuery || ebayIntel.queries.strict;

        if (manualQuery) {
            telemetry.query_mode = "MANUAL_OVERRIDE";
        }

        // Step 1: Paginated Search (Broad retrieval)
        // Note: We always fetch 20 items per page.
        const { items: results, raw: rawResponse } = await this.performPaginatedSearch(currentQuery, telemetry, pageNum);
        
        // Step 2: Scoring (Ranking ONLY)
        const scored = results.map(item => {
            const alignment = this.calculateAlignmentScore(product, item, ebayIntel);
            const intelligence = this.buildIntelligencePayload(item, product);
            return { ...item, ...alignment, intelligence };
        });

        // Step 3: Multi-Key Ranking Prioritization
        const ranked = scored.sort((a,b) => {
            if (b.alignmentScore !== a.alignmentScore) return b.alignmentScore - a.alignmentScore;
            const profitA = typeof a.intelligence.financials.net_profit === 'number' ? a.intelligence.financials.net_profit : -999;
            const profitB = typeof b.intelligence.financials.net_profit === 'number' ? b.intelligence.financials.net_profit : -999;
            if (profitB !== profitA) return profitB - profitA;
            return (b.stock || 0) - (a.stock || 0);
        });

        return { 
            status: ranked.length > 0 ? "SUCCESS" : "NO_MATCH_FOUND", 
            products: ranked, 
            mode: telemetry.query_mode,
            raw: rawResponse,
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

        const pageItems = lastRaw?.data?.productList || [];
        pageItems.forEach(item => items.push(normalizeToContract(item)));
        
        telemetry.pages_scanned++;
    } catch (e) { 
        console.error(`[CJ API] Page ${pageNum} Crash:`, e.message);
    }
    
    return { items, raw: lastRaw };
  }

  /**
   * 🧼 SCIENTIFIC SCORING (v6.1 - TYPE ANCHORED)
   */
  calculateAlignmentScore(ebayProduct, normalizedCj, ebayIntel = null) {
    const intel = ebayIntel || deconstructTitle(ebayProduct.title);
    const cjTitle = normalizedCj.title.toLowerCase();
    
    // v6.4 Relevance Anchor Logic (Ranking ONLY, no filtering)
    let baseScore = 20; // Lower base for more granular ranking
    
    // 1. Keyword Overlap (Up to 80 points)
    const ebayWords = ebayProduct.title.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
    
    const intersect = ebayWords.filter(w => cjTitle.includes(w));
    const overlapPercent = (intersect.length / Math.max(1, ebayWords.length));
    baseScore += Math.round(overlapPercent * 80);

    // 2. SOFT ANCHOR: Product Type Match
    // Priority: If product type matches, boost score (ranking preference)
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
   * 🧠 COMMERCE INTELLIGENCE ENGINE (v6.1 - HARDENED)
   */
   buildIntelligencePayload(normalizedCj, ebayProduct) {
    const ebayPrice = Number(ebayProduct.price);
    const cjPrice = Number(normalizedCj.price);
    
    // Default estimated shipping is $5.00
    const EST_SHIPPING = 5.00;
    
    let netProfit = "NAN_ERROR";
    
    if (!isNaN(ebayPrice) && !isNaN(cjPrice)) {
        // v6.4 Formula: eBay Price - CJ Cost - $5 Shipping
        netProfit = ebayPrice - cjPrice - EST_SHIPPING;
    }

    return {
        financials: { 
            net_profit: netProfit,
            roi_percent: 0, // Removed per request
            status: "ESTIMATED",
            shipping_label: `Benchmark ($${EST_SHIPPING.toFixed(2)})`
        },
        shipping: { 
            delivery_estimate: normalizedCj.shipping?.delivery_days || "7-15 Days (Est.)", 
            warehouse: normalizedCj.warehouse || "CN (default)"
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
