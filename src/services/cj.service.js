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

        // 🧼 SOFT RELEVANCE FILTERING (Category Family Match)
        const dedupedList = rawDeduped.filter(item => {
            const cjIntel = deconstructTitle(item.title);
            return validateMatch(intel, cjIntel);
        });
        
        // DETERMINISTIC FAILURE CHECK
        if (dedupedList.length === 0) {
            return {
                status: "NO_MATCH_FOUND",
                reason: "INSUFFICIENT_QUERY_COVERAGE",
                queries_used: searchVariants,
                suggestion: "Try increasing attribute generalization or checking the base product category.",
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
                const fullProduct = normalizeToContract({ ...baseProduct.raw_source, ...detailData });
                
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

  normalizeEbayProduct(title, categoryPath = "") {
    if (!title) return { keyword: "item" };
    const noise = /\b(trending|luxury|premium|best|hot|new|top|official|boho|glam|party|holiday)\b/gi;
    let clean = String(title).replace(noise, ' ').replace(/[^a-zA-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();
    return { keyword: clean.split(' ').slice(0, 4).join(' ').toLowerCase() };
  }

  generateSearchVariants(normalized) {
    const { keyword } = normalized;
    const words = keyword.split(' ');
    const variants = new Set([keyword]);
    if (words.length > 2) variants.add(words.slice(0, 2).join(' '));
    return Array.from(variants).slice(0, 2);
  }

  calculateAlignmentScore(ebayProduct, normalizedCj, ebayIntel) {
    const cjIntel = deconstructTitle(normalizedCj.title);
    
    // NEW REALISTIC 100-POINT MODEL (Mandate v4.5)
    
    // 1. Margin Score (0-25) - Relative to target eBay listing
    const ebayPrice = Number(ebayProduct.price);
    const cjPrice = normalizedCj.price;
    const margin = ebayPrice > 0 ? (ebayPrice - cjPrice) / ebayPrice : 0;
    const marginScore = Math.min(25, Math.max(0, margin * 50)); // Typical 50% margin = 25 pts

    // 2. Shipping Origin (0-20)
    let shippingScore = 5; // Default Unknown
    const from = normalizedCj.shipping?.from;
    if (from === 'US') shippingScore = 20;
    else if (from === 'CN') shippingScore = 8;
    else if (from) shippingScore = 15; // Global/EU

    // 3. Delivery Speed (0-15)
    let speedScore = 0;
    const daysStr = normalizedCj.shipping?.delivery_days || "";
    if (daysStr.includes('3-7')) speedScore = 15;
    else if (daysStr.includes('7-15')) speedScore = 10;
    else if (daysStr.includes('15+')) speedScore = 5;

    // 4. Rating (0-15) - Actual CJ Data Only
    let ratingScore = 0;
    if (normalizedCj.rating) {
        const rating = parseFloat(normalizedCj.rating);
        if (rating >= 4.8) ratingScore = 15;
        else if (rating >= 4.5) ratingScore = 10;
        else ratingScore = 5;
    }

    // 5. Inventory (0-10)
    let stockScore = 0;
    if (normalizedCj.stock !== null) {
        if (normalizedCj.stock > 500) stockScore = 10;
        else if (normalizedCj.stock > 100) stockScore = 6;
        else if (normalizedCj.stock > 0) stockScore = 2;
    }

    // 6. Match Intent (0-15)
    let matchScore = 0;
    if (ebayIntel.product_type === cjIntel.product_type) matchScore += 10;
    const attributeOverlap = ebayIntel.attributes.filter(a => cjIntel.attributes.includes(a));
    matchScore += Math.min(5, attributeOverlap.length * 2.5);

    const score = Math.round(marginScore + shippingScore + speedScore + ratingScore + stockScore + matchScore);
    
    return { 
        alignmentScore: score, 
        matchReason: score > 80 ? "Premium Supplier Match" : (score > 60 ? "Verified Market Pair" : "Informal Discovery")
    };
  }

  /**
   * 🧠 COMMERCE INTELLIGENCE ENGINE (POST-NORMALIZATION)
   */
   buildIntelligencePayload(normalizedCj, ebayProduct) {
    const ebayPrice = Number(ebayProduct.price) || 0;
    const cjPrice = normalizedCj.price;
    const shippingCost = 5.00; // Estimated Standard Shipping (v4.5 Fallback)

    // ROI Engine (REAL FORMULA ONLY)
    // ROI % = (eBay Price - CJ Cost - Shipping) / CJ Cost * 100
    const profit = ebayPrice - cjPrice - shippingCost;
    const roiPercent = cjPrice > 0 ? (profit / cjPrice) * 100 : 0;
    const marginPercent = ebayPrice > 0 ? (profit / ebayPrice) * 100 : 0;
    const breakEven = cjPrice + shippingCost;

    const riskFlags = [];
    if (normalizedCj.stock !== null && normalizedCj.stock < 10) riskFlags.push("Critical Low Stock");
    if (profit < 0) riskFlags.push("Negative Potential");

    return {
        status: "CJ_INTELLIGENCE_READY",
        ebay_product: ebayProduct,
        cj_product: normalizedCj,
        roi: { 
            roi_value: profit, 
            roi_percent: roiPercent, 
            margin_percent: marginPercent,
            break_even: breakEven,
            profit_label: marginPercent > 30 ? "HIGH" : (marginPercent > 15 ? "MEDIUM" : "LOW") 
        },
        shipping: { 
            delivery_estimate: normalizedCj.shipping?.delivery_days || "UNKNOWN", 
            warehouse: normalizedCj.warehouse || "UNKNOWN",
            origin: normalizedCj.shipping?.from || "GLOBAL"
        },
        risk: { risk_level: riskFlags.length > 0 ? "HIGH" : "LOW", risk_flags: riskFlags },
        variants: { has_variants: normalizedCj.has_variants, variants: normalizedCj.variants },
        rating: normalizedCj.rating || "N/A",
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
