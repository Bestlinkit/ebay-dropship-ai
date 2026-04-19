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
   * 🏗️ PIPELINE ORCHESTRATION (v5.0 - HIGH VOLUME DISCOVERY)
   * Mandate: Fetch up to 5 pages, do not filter results, merge for ranking.
   */
  async runIterativePipeline(context) {
    const { product, manualQuery } = context;
    const startTime = Date.now();
    const targetKeyword = manualQuery || product.title;
    
    // Telemetry and Tracking
    const telemetry = {
        query_used: targetKeyword,
        pages_fetched: 0,
        raw_count: 0,
        merged_count: 0
    };

    try {
        const mergedMap = new Map();
        
        // v5.0 - Multi-Page Discovery Loop
        for (let pageNum = 1; pageNum <= 5; pageNum++) {
            try {
                const response = await axios.get(`${BRIDGE_BASE}${this.CONFIG.SEARCH_ENDPOINT}`, { 
                    params: { 
                        keyword: targetKeyword,
                        pageNum: pageNum,
                        pageSize: 20
                    } 
                });

                const rawData = response.data?.data || response.data;
                const products = rawData.productList || [];
                
                if (products.length === 0) break; // End of catalog reached

                products.forEach(item => {
                    const normalized = normalizeToContract(item);
                    if (normalized && !mergedMap.has(normalized.product_id)) {
                        mergedMap.set(normalized.product_id, normalized);
                    }
                });

                telemetry.pages_fetched = pageNum;
                if (products.length < 20) break; // Last page reached
            } catch (pageErr) {
                console.error(`[CJ Pipeline] Page ${pageNum} Fetch Error:`, pageErr.message);
                break;
            }
        }

        const allProducts = Array.from(mergedMap.values());
        telemetry.merged_count = allProducts.length;

        if (allProducts.length === 0) {
            return {
                status: "NO_MATCH_FOUND",
                reason: "ZERO_CATALOG_HITS",
                query: targetKeyword,
                telemetry
            };
        }

        // Phase II: Global Ranking & Scoring (No Filtering)
        const scoredCandidates = allProducts.map(fullProduct => {
            const alignment = this.calculateAlignmentScore(product, fullProduct);
            return { ...fullProduct, ...alignment };
        });

        // Sort by Score
        const ranked = scoredCandidates.sort((a,b) => b.alignmentScore - a.alignmentScore);
        
        return { 
            status: "SUCCESS", 
            products: ranked, 
            telemetry: { 
                latency: Date.now() - startTime, 
                ...telemetry 
            } 
        };
    } catch (err) { 
        return { 
            status: "ERROR", 
            reason: "PIPELINE_CRASH",
            message: err.message 
        }; 
    }
  }

  calculateAlignmentScore(ebayProduct, normalizedCj) {
    const ebayTitle = ebayProduct.title.toLowerCase();
    const cjTitle = normalizedCj.title.toLowerCase();
    
    // v5.0 Basic Overlap Detection (Ranking Only)
    const ebayWords = ebayTitle.split(' ').filter(w => w.length > 2);
    const intersect = ebayWords.filter(w => cjTitle.includes(w));
    
    // 40% base for existing + up to 60% for keyword match
    const overlapPercent = (intersect.length / Math.max(1, ebayWords.length));
    const score = Math.round(40 + (overlapPercent * 60));
    
    return { 
        alignmentScore: score, 
        matchReason: score > 80 ? "High Relevance" : (score > 60 ? "Moderate Match" : "Data Discovery")
    };
  }

  /**
   * 🧠 COMMERCE INTELLIGENCE ENGINE (v5.0 - Hardened Analytics)
   */
   buildIntelligencePayload(normalizedCj, ebayProduct) {
    const ebayPrice = Number(ebayProduct.price);
    const cjPrice = Number(normalizedCj.price);
    
    // v5.0 $NaN Protection Rule
    let profit = "UNKNOWN";
    let roiPercent = 0;
    
    const shippingCost = normalizedCj.shipping?.cost !== null ? Number(normalizedCj.shipping.cost) : 5.00;
    const isEstimated = normalizedCj.shipping?.cost === null;

    if (!isNaN(ebayPrice) && !isNaN(cjPrice)) {
        profit = ebayPrice - cjPrice - shippingCost;
        const totalInvestment = cjPrice + shippingCost;
        roiPercent = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;
    }

    return {
        status: "SUCCESS",
        ebay_product: ebayProduct,
        cj_product: normalizedCj,
        financials: { 
            net_profit: profit, 
            roi_percent: roiPercent, 
            status: isEstimated ? "ESTIMATED" : "CONFIRMED",
            shipping_label: normalizedCj.shipping?.cost !== null 
                ? `$${Number(normalizedCj.shipping.cost).toFixed(2)}` 
                : "Not Provided by CJ"
        },
        shipping: { 
            delivery_estimate: normalizedCj.shipping?.delivery_days || "Not Available", 
            warehouse: normalizedCj.warehouse || "Not Available",
            origin: normalizedCj.shipping?.from || "Not Available"
        },
        stock: normalizedCj.stock !== null ? normalizedCj.stock : "Not Available",
        ready_for_ui: true
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
