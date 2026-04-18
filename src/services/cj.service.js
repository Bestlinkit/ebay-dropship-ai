import axios from 'axios';

/**
 * 🛰️ CJ DROPSHIPPING ISOLATED MODULE (v1.0)
 * Mandate: Pure supplier retrieval. Zero impact on Market Analytics.
 */
class CJService {
  constructor() {
    this.CONFIG = {
      BACKEND_BASE: import.meta.env.VITE_BACKEND_URL || '',
      SEARCH_ENDPOINT: '/api/cj/search',
      DETAIL_ENDPOINT: '/api/cj/detail',
      FREIGHT_ENDPOINT: '/api/cj/freight',
      AUTH_ENDPOINT: '/api/cj/auth'
    };
    this.SESSION = {
        accessToken: null,
        refreshToken: null,
        expiry: null,
        openId: null
    };
  }

  /**
   * CJ INTEGRATION FIX (PHASE 1: CONNECTION TEST ONLY)
   * Strictly isolated from eBay discovery/scoring.
   */
  async testConnection() {
    const url = this.CONFIG.AUTH_ENDPOINT;
    const apiKey = import.meta.env.VITE_CJ_API_KEY || "CJ_API_KEY_FROM_ENV";
    const payload = { apiKey };
    const timestamp = new Date().toISOString();

    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });

        const raw = response.data;

        if (raw.code === '200' || raw.success === true) {
            // SUCCESS: Store tokens
            this.SESSION = {
                accessToken: raw.data?.accessToken,
                refreshToken: raw.data?.refreshToken,
                expiry: raw.data?.accessTokenExpiry,
                openId: raw.data?.openId
            };

            return {
                cjConnectionStatus: "CONNECTED",
                message: "Success",
                openId: raw.data?.openId || "",
                timestamp
            };
        } else {
            // FAILURE: Return raw error only
            return {
                cjConnectionStatus: "FAILED",
                code: raw.code || "UNKNOWN",
                message: raw.message || "API Error",
                requestId: raw.requestId || ""
            };
        }
    } catch (err) {
        // NETWORK/TRANSPORT FAILURE: Return raw error only
        return {
            cjConnectionStatus: "FAILED",
            code: err.code || "TRANSPORT_ERROR",
            message: err.message,
            requestId: ""
        };
    }
  }

  /**
   * 🧠 NORMALIZATION LAYER
   */
  normalizeEbayProduct(title, categoryPath = "") {
    if (!title) return { keyword: "item", category: "General" };
    const noise = /\b(trending|luxury|premium|best|hot|new|top|official|boho|glam|party|holiday|XL|XXLarge|Small|Medium|Large|Gold|Silver|Trim|S-L|SKU|Series|2024|2025)\b/gi;
    let clean = title.replace(noise, ' ')
                     .replace(/[^a-zA-Z\s]/g, ' ')
                     .replace(/\s+/g, ' ')
                     .trim();
    const words = clean.split(' ').filter(w => w.length > 2);
    const keyword = words.slice(0, 4).join(' ').toLowerCase();
    const category = categoryPath.split(' > ')[0] || "General";
    return { keyword: keyword || "item", category, raw: title };
  }

  /**
   * 🔍 MULTI-QUERY SEARCH
   */
  generateSearchVariants(normalized) {
    const { keyword, category } = normalized;
    const variants = new Set();
    variants.add(keyword);
    const words = keyword.split(' ');
    if (words.length > 2) variants.add(words.slice(0, 2).join(' '));
    if (category) variants.add(`${words[0]} ${category}`.toLowerCase());
    return Array.from(variants).slice(0, 3);
  }

  /**
   * 🏗️ PIPELINE ORCHESTRATION
   */
  async runIterativePipeline(context) {
    const { product } = context;
    const startTime = Date.now();
    const normalized = this.normalizeEbayProduct(product.title, product.categoryPath);
    const searchVariants = this.generateSearchVariants(normalized);

    try {
        const fetchPromises = searchVariants.map(keyword => 
          axios.get(this.CONFIG.SEARCH_ENDPOINT, { params: { keyword } })
            .catch(err => ({ error: true, message: err.message, status: err.response?.status, keyword }))
        );

        const responses = await Promise.all(fetchPromises);
        const mergedMap = new Map();
        responses.forEach(res => {
          if (res.error) return;
          const list = res.data?.data?.list || [];
          list.forEach(item => { if (!mergedMap.has(item.pid)) mergedMap.set(item.pid, item); });
        });

        const dedupedList = Array.from(mergedMap.values());
        if (dedupedList.length === 0) return { status: "NO_RESULTS", diagnostics: responses.map(r => ({ keyword: r.keyword, status: r.status, error: r.error ? r.message : null })) };

        const candidates = [];
        for (const item of dedupedList.slice(0, 10)) {
          try {
             const detailRes = await axios.get(this.CONFIG.DETAIL_ENDPOINT, { params: { pid: item.pid } });
             const detail = detailRes.data?.data;
             if (!detail) continue;
             const alignment = this.calculateAlignmentScore(product, item, detail);
             candidates.push({ ...item, detail, ...alignment });
          } catch (e) { console.error(`CJ Linkage Error:`, e.message); }
        }

        const ranked = candidates.sort((a,b) => b.alignmentScore - a.alignmentScore).slice(0, 3);
        return { status: "SUCCESS", products: ranked, telemetry: { latency: Date.now() - startTime, count: ranked.length } };
    } catch (err) { return { status: "ERROR", message: err.message }; }
  }

  calculateAlignmentScore(ebayProduct, cjProduct, cjDetail) {
    const ebayTitle = ebayProduct.title.toLowerCase();
    const cjTitle = (cjProduct.productNameEn || cjProduct.productName || "").toLowerCase();
    const ebayWords = new Set(ebayTitle.split(' ').filter(w => w.length > 3));
    const cjWords = new Set(cjTitle.split(' ').filter(w => w.length > 3));
    let intersection = 0;
    ebayWords.forEach(w => { if (cjWords.has(w)) intersection++; });
    const keywordScore = ebayWords.size > 0 ? (intersection / ebayWords.size) * 50 : 0;
    const ebayPrice = Number(ebayProduct.price);
    const cjPrice = parseFloat(cjDetail.productVariants?.[0]?.variantSellPrice || 0);
    const priceGap = Math.abs(ebayPrice - cjPrice);
    const priceScore = ebayPrice > 0 ? Math.max(0, 30 - (priceGap / ebayPrice) * 100) : 0;
    const categoryMatch = 20;
    const alignmentScore = Math.round(keywordScore + priceScore + categoryMatch);
    return { alignmentScore, matchReason: alignmentScore > 70 ? "High Precision Identity Match" : "Visual/Category Approximation" };
  }

  normalizeResult(raw) {
    return {
      id: raw.pid,
      title: raw.productNameEn || raw.productName,
      price: parseFloat(raw.detail?.productVariants?.[0]?.variantSellPrice || 0),
      image: raw.productImage,
      source: 'CJ',
      url: `https://cjdropshipping.com/product-detail.html?id=${raw.pid}`,
      shipping: "7-15 Days",
      alignmentScore: raw.alignmentScore,
      matchReason: raw.matchReason
    };
  }
}

export default new CJService();
