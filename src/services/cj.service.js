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
    
    // 🧠 QUERY INTELLIGENCE LAYER
    const ebayIntel = deconstructTitle(product.title);
    const searchVariants = [ebayIntel.clean_query]; // Use strict deconstructed query
    
    // Fallback if extraction failed
    if (!ebayIntel.product_type) {
        searchVariants.push(product.title.split(' ').slice(0, 3).join(' '));
    }

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
        
        // 🧼 STRICT POST-SEARCH FILTERING (Constraint-based Matching)
        const dedupedList = rawDeduped.filter(item => {
            const cjIntel = deconstructTitle(item.title);
            return validateMatch(ebayIntel, cjIntel);
        });
        
        // DETERMINISTIC FAILURE CHECK
        if (dedupedList.length === 0) {
            // If the API technically succeeded (returned 200/Success) but found 0 matches after strict filter
            if (technicallySuccessful) {
                return {
                    status: "CJ_EMPTY_RESULT",
                    reason: "NO_MATCHING_PRODUCTS_AFTER_STRICT_FILTER",
                    query: ebayIntel.clean_query,
                    telemetry
                };
            }

            return { 
                status: "CJ_PARSE_FAILED", 
                raw_response: responses.map(r => r.data),
                detected_schemas: telemetry.schemas_detected,
                reason: telemetry.errors.length === responses.length ? "ALL_REQUESTS_FAILED" : "ZERO_MATCHES_OR_SCHEMA_MISMATCH",
                action: "LOG_AND_SKIP"
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
                    const alignment = this.calculateAlignmentScore(product, fullProduct, ebayIntel);
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
    
    // 1. Product Type Match (50% Weight)
    const typeMatch = (ebayIntel.product_type === cjIntel.product_type) ? 50 : 0;

    // 2. Price Gap (30% Weight)
    const ebayPrice = Number(ebayProduct.price);
    const cjPrice = normalizedCj.price;
    const priceGapRatio = ebayPrice > 0 ? Math.abs(ebayPrice - cjPrice) / ebayPrice : 1;
    const priceScore = Math.max(0, 30 - (priceGapRatio * 100 * 0.5)); // Scale gap penalty

    // 3. Shipping Speed & Warehouse (20% Weight)
    // Bonus for Local/US Warehouse
    let shippingScore = 10; // Base baseline
    const warehouse = normalizedCj.warehouse?.toLowerCase() || "";
    if (warehouse.includes('us') || warehouse.includes('united states') || warehouse.includes('local')) {
        shippingScore = 20;
    }
    
    const score = Math.round(typeMatch + priceScore + shippingScore);
    
    return { 
        alignmentScore: score, 
        matchReason: score > 80 ? "High-Precision Match" : (score > 60 ? "Structured Approximation" : "Broad Match")
    };
  }

  /**
   * 🧠 COMMERCE INTELLIGENCE ENGINE (POST-NORMALIZATION)
   */
  buildIntelligencePayload(normalizedCj, ebayProduct) {
    const ebayPrice = Number(ebayProduct.price) || 0;
    const cjPrice = normalizedCj.price;

    const roiVal = ebayPrice - cjPrice;
    const roiMargin = ebayPrice ? (roiVal / ebayPrice) * 100 : 0;

    const riskFlags = [];
    if (normalizedCj.stock < 10) riskFlags.push("Critical Low Stock");
    if (roiMargin < 0) riskFlags.push("Negative Margin");

    const sellScoreNum = Math.round((roiMargin > 50 ? 50 : (roiMargin > 0 ? roiMargin : 0)) + (normalizedCj.stock > 100 ? 50 : 25));

    return {
        status: "CJ_INTELLIGENCE_READY",
        ebay_product: ebayProduct,
        cj_product: normalizedCj,
        roi: { roi_value: roiVal, roi_percent: roiMargin, profit_label: roiMargin > 30 ? "HIGH" : "MEDIUM" },
        shipping: { delivery_estimate: "7-15 days", warehouse: normalizedCj.warehouse },
        risk: { risk_level: riskFlags.length > 0 ? "HIGH" : "LOW", risk_flags: riskFlags },
        variants: { has_variants: normalizedCj.has_variants, variants: normalizedCj.variants },
        sell_score: { sell_score: sellScoreNum, classification: sellScoreNum > 70 ? "SELL" : "REVIEW" },
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
