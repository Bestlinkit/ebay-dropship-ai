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
    const { product, manualQuery } = context;
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

        // Step 1: Direct Discovery (Exact Title or Manual Query)
        const directResults = await this.performPaginatedSearch(currentQuery, telemetry);
        directResults.forEach(item => mergedMap.set(item.product_id, item));

        // Step 2: Fallback Trigger Analysis
        const scoredInitial = Array.from(mergedMap.values()).map(item => ({
            ...item,
            ...this.calculateAlignmentScore(product, item, ebayIntel)
        }));

        const maxScore = scoredInitial.length > 0 ? Math.max(...scoredInitial.map(i => i.alignmentScore)) : 0;

        // Trigger Fallback IF: No results OR All results below threshold
        // (v6.1 Rule: maxScore < 50 triggers broader scan)
        if (!manualQuery && (scoredInitial.length === 0 || maxScore < 50)) {
            telemetry.fallback_triggered = true;
            telemetry.query_mode = "FALLBACK_EXPANSION";
            const fallbackQuery = ebayIntel.queries.fallback;
            
            const fallbackResults = await this.performPaginatedSearch(fallbackQuery, telemetry);
            fallbackResults.forEach(item => {
                if (!mergedMap.has(item.product_id)) {
                    mergedMap.set(item.product_id, item);
                }
            });
        }

        const allCandidates = Array.from(mergedMap.values());
        telemetry.results_merged = allCandidates.length;

        if (allCandidates.length === 0) {
            return {
                status: "NO_MATCH_FOUND",
                query: currentQuery,
                telemetry
            };
        }

        // Step 3: Scientific Scoring (Post-Retrieval)
        const scoredFinal = allCandidates.map(item => {
            const alignment = this.calculateAlignmentScore(product, item, ebayIntel);
            const intelligence = this.buildIntelligencePayload(item, product);
            return { ...item, ...alignment, intelligence };
        });

        // Step 4: Multi-Key Ranking Prioritization (v6.1 Rule)
        // 1. Type Match (Boolean anchor)
        // 2. Net Profit (High to Low)
        // 3. Stock Depth (High to Low)
        const ranked = scoredFinal.sort((a,b) => {
            // Anchor 1: Product Type Match (Score contains penalty already)
            if (b.alignmentScore !== a.alignmentScore) return b.alignmentScore - a.alignmentScore;
            
            // Anchor 2: Net Profit
            const profitA = typeof a.intelligence.financials.net_profit === 'number' ? a.intelligence.financials.net_profit : -999;
            const profitB = typeof b.intelligence.financials.net_profit === 'number' ? b.intelligence.financials.net_profit : -999;
            if (profitB !== profitA) return profitB - profitA;

            // Anchor 3: Stock
            const stockA = typeof a.stock === 'number' ? a.stock : 0;
            const stockB = typeof b.stock === 'number' ? b.stock : 0;
            return stockB - stockA;
        });

        return { 
            status: "SUCCESS", 
            products: ranked, 
            mode: telemetry.query_mode,
            telemetry: { latency: Date.now() - startTime, ...telemetry } 
        };
    } catch (err) { 
        console.error("[CJ v6.1 Fault]", err);
        return { status: "ERROR", message: err.message }; 
    }
  }

  async performPaginatedSearch(keyword, telemetry) {
    const results = [];
    for (let pageNum = 1; pageNum <= 5; pageNum++) {
        try {
            const response = await axios.get(`${BRIDGE_BASE}${this.CONFIG.SEARCH_ENDPOINT}`, { 
                params: { keyword, pageNum, pageSize: 20 } 
            });
            const data = response.data?.data?.productList || [];
            if (data.length === 0) break;
            data.forEach(item => results.push(normalizeToContract(item)));
            telemetry.pages_scanned++;
            if (data.length < 20) break;
        } catch (e) { break; }
    }
    return results;
  }

  /**
   * 🧼 SCIENTIFIC SCORING (v6.1 - TYPE ANCHORED)
   */
  calculateAlignmentScore(ebayProduct, normalizedCj, ebayIntel = null) {
    const intel = ebayIntel || deconstructTitle(ebayProduct.title);
    const cjTitle = normalizedCj.title.toLowerCase();
    
    // v6.1 Relevance Anchor Logic
    let baseScore = 40; // Base presence score
    
    // 1. Keyword Overlap (Up to 60 points)
    const ebayWords = ebayProduct.title.toLowerCase().split(' ').filter(w => w.length > 2);
    const intersect = ebayWords.filter(w => cjTitle.includes(w));
    const overlapPercent = (intersect.length / Math.max(1, ebayWords.length));
    baseScore += Math.round(overlapPercent * 60);

    // 2. CRITICAL ANCHOR: Product Type Match (v6.1 Protection)
    // If "Jeans" searched but missing from CJ title, reduce score heavily.
    if (intel.product_type && !cjTitle.includes(intel.product_type)) {
        baseScore = Math.max(5, baseScore - 50); // Hard penalty pushes irrelevant items to bottom
    }
    
    const finalScore = Math.min(100, baseScore);
    
    return { 
        alignmentScore: finalScore, 
        matchReason: finalScore > 80 ? "High Relevance" : (finalScore > 50 ? "Category Match" : "Broad Retrieval")
    };
  }

  /**
   * 🧠 COMMERCE INTELLIGENCE ENGINE (v6.1 - HARDENED)
   */
   buildIntelligencePayload(normalizedCj, ebayProduct) {
    const ebayPrice = Number(ebayProduct.price);
    const cjPrice = Number(normalizedCj.price);
    
    let profit = "UNKNOWN";
    let roiPercent = 0;
    
    const shippingCost = normalizedCj.shipping?.cost !== null ? Number(normalizedCj.shipping.cost) : 5.00;
    const isEstimated = normalizedCj.shipping?.cost === null;

    if (!isNaN(ebayPrice) && !isNaN(cjPrice)) {
        profit = ebayPrice - cjPrice - shippingCost;
        const totalValue = cjPrice + shippingCost;
        roiPercent = totalValue > 0 ? (profit / totalValue) * 100 : 0;
    }

    return {
        financials: { 
            net_profit: profit, 
            roi_percent: roiPercent, 
            status: isEstimated ? "ESTIMATED" : "CONFIRMED",
            shipping_label: normalizedCj.shipping?.cost !== null ? `$${Number(normalizedCj.shipping.cost).toFixed(2)}` : "Benchmark ($5.00)"
        },
        shipping: { 
            delivery_estimate: normalizedCj.shipping?.delivery_days || "Not Available", 
            warehouse: normalizedCj.warehouse || "Not Available"
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
