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
   * 🏗️ PIPELINE ORCHESTRATION (CJ-ONLY)
   */
  async runIterativePipeline(context) {
    const { product } = context;
    const startTime = Date.now();
    
    // 🧠 QUERY INTELLIGENCE LAYER (v4.5 Parallel Expansion)
    const intel = deconstructTitle(product.title);
    const searchVariants = [intel.queries.strict, intel.queries.expanded, intel.queries.broad]; 
    
    // Telemetry and Tracking
    const telemetry = {
        queries_used: searchVariants,
        technically_successful: false,
        merged_count: 0
    };

    try {
        const fetchPromises = searchVariants.map(keyword => 
          axios.get(`${BRIDGE_BASE}${this.CONFIG.SEARCH_ENDPOINT}`, { params: { keyword } })
            .catch(err => ({ error: true, message: err.message, keyword }))
        );

        const responses = await Promise.all(fetchPromises);
        const mergedMap = new Map();
        let technicallySuccessful = false;
        const telemetry = {
            total_responses: responses.length,
            errors: [],
            schemas_detected: []
        };

        for (const res of responses) {
            if (res.error) {
                telemetry.errors.push(res.message);
                continue;
            }

            const rawData = res.data?.data || res.data;
            if (this.isValidCJResponse(res.data)) {
                technicallySuccessful = true;
            }
            const schema = this.detectSchema(rawData);
            telemetry.schemas_detected.push(schema);

            // Defensive Extraction
            const allArrays = this.recursiveFindArrays(rawData);
            allArrays.forEach(arr => {
                arr.forEach(item => {
                    const normalized = normalizeToContract(item);
                    if (normalized) {
                        const id = normalized.product_id;
                        if (!mergedMap.has(id)) mergedMap.set(id, normalized);
                    }
                });
            });
        }

        const rawDeduped = Array.from(mergedMap.values());
        telemetry.merged_count = rawDeduped.length;

        // 🧼 BROAD CATEGORY FILTERING (v4.7 Rule)
        const dedupedList = rawDeduped.filter(item => {
            const cjIntel = deconstructTitle(item.title);
            return validateMatch(intel, cjIntel);
        });
        
        // DETERMINISTIC FAILURE CHECK (v4.7 - LOW_MATCH_DENSITY)
        if (dedupedList.length === 0) {
            return {
                status: "LOW_MATCH_DENSITY",
                reason: "CATEGORY_TOO_RESTRICTIVE_OR_KEYWORD_OVERFITTING",
                action: "BROADEN_CATEGORY_SCOPE",
                queries_tried: searchVariants,
                telemetry
            };
        }

        // Phase II: Detail Enrichment (Top 5 matches)
        const enrichedCandidates = [];
        for (const baseProduct of dedupedList.slice(0, 5)) {
            try {
                const detailRes = await axios.get(`${BRIDGE_BASE}${this.CONFIG.DETAIL_ENDPOINT}`, { 
                    params: { pid: baseProduct.product_id } 
                });
                const detailData = detailRes.data?.data || detailRes.data;
                const fullProduct = normalizeToContract({ ...baseProduct.raw, ...detailData });
                
                if (fullProduct) {
                    const alignment = this.calculateAlignmentScore(product, fullProduct, intel);
                    enrichedCandidates.push({ ...fullProduct, ...alignment });
                }
            } catch (e) {
                console.error(`[CJ Pipeline] Detail Fetch Error for ${baseProduct.product_id}:`, e.message);
            }
        }

        const ranked = enrichedCandidates.sort((a,b) => b.alignmentScore - a.alignmentScore).slice(0, 3);
        
        return { 
            status: "SUCCESS", 
            products: ranked, 
            telemetry: { 
                latency: Date.now() - startTime, 
                count: ranked.length,
                ...telemetry 
            } 
        };
    } catch (err) { 
        return { 
            status: "CJ_PARSE_FAILED", 
            reason: "CRYITICAL_PIPELINE_FAULT",
            message: err.message 
        }; 
    }
  }

  calculateAlignmentScore(ebayProduct, normalizedCj, ebayIntel) {
    const cjIntel = deconstructTitle(normalizedCj.title);
    
    // v4.7 STRICT 40/60 SPLIT
    let categoryScore = 0;
    let attributeScore = 0;

    // 1. Category Match (40%)
    if (validateMatch(ebayIntel, cjIntel)) {
        categoryScore = 40;
    }

    // 2. Attribute Match (60%)
    const intersect = ebayIntel.attributes.filter(a => cjIntel.attributes.includes(a));
    const totalPossible = Math.max(1, ebayIntel.attributes.length);
    attributeScore = Math.min(60, (intersect.length / totalPossible) * 60);

    const score = Math.round(categoryScore + attributeScore);
    
    return { 
        alignmentScore: score, 
        matchReason: score > 80 ? "Premium Supplier Match" : (score > 40 ? "Verified Category Match" : "Broad Discovery")
    };
  }

  /**
   * 🧠 COMMERCE INTELLIGENCE ENGINE (POST-NORMALIZATION)
   */
   buildIntelligencePayload(normalizedCj, ebayProduct) {
    const ebayPrice = Number(ebayProduct.price) || 0;
    const cjPrice = normalizedCj.price;
    
    // v4.7 SHIPPING RULE: No defaults.
    const shippingCost = normalizedCj.shipping?.cost || null;
    const isEstimated = shippingCost === null;

    // Net Profit = eBay Price - CJ Price - Shipping
    const totalCost = cjPrice + (shippingCost || 0);
    const profit = ebayPrice - totalCost;
    const roiPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    const riskFlags = [];
    if (normalizedCj.stock !== null && normalizedCj.stock < 10) riskFlags.push("Low Stock");

    return {
        status: "CJ_INTELLIGENCE_READY",
        ebay_product: ebayProduct,
        cj_product: normalizedCj,
        financials: { 
            net_profit: profit, 
            roi_percent: roiPercent, 
            status: isEstimated ? "ESTIMATED ONLY" : "REAL",
            shipping_label: isEstimated ? "UNKNOWN" : `$${shippingCost.toFixed(2)}`
        },
        shipping: { 
            delivery_estimate: normalizedCj.shipping?.delivery_days || "UNKNOWN", 
            warehouse: normalizedCj.warehouse || "UNKNOWN",
            origin: normalizedCj.shipping?.from || "GLOBAL"
        },
        stock: normalizedCj.stock !== null ? normalizedCj.stock : "UNKNOWN",
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
