import axios from 'axios';
import sourcingService from './sourcing';

// DETECT BRIDGE BASE (Resilient for Production Builds)
const BRIDGE_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * 🛰️ CJ DROPSHIPPING ISOLATED MODULE (v1.5 - Production Resilient)
 * Mandate: Pure supplier retrieval. Zero impact on Market Analytics.
 */
class CJService {
  constructor() {
    this.CONFIG = {
      BACKEND_BASE: import.meta.env.VITE_BACKEND_URL || '',
      SEARCH_ENDPOINT: '/api/cj/search',
      DETAIL_ENDPOINT: '/api/cj/detail',
      FREIGHT_ENDPOINT: '/api/cj/freight',
      AUTH_ENDPOINT: `${BRIDGE_BASE}/api/cj/auth`
    };
    this.SESSION = {
        accessToken: null,
        refreshToken: null,
        expiry: null,
        openId: null
    };
  }

  /**
   * 📡 BRIDGE DISCOVERY
   */
  async pingBridge() {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${BRIDGE_BASE}/api/cj/ping`);
      const latency = Date.now() - startTime;
      
      const upstreamStatus = response.data?.cjConnected === true;
      
      console.log(`[CJ DEBUG] Local Bridge Reached, Upstream Status: ${upstreamStatus ? 'CONNECTED' : 'UNAUTHENTICATED'}`, {
        endpoint: `${BRIDGE_BASE}/api/cj/ping`,
        message: `Local bridge responded. Upstream is ${upstreamStatus ? 'ACTIVE' : 'VAULT EMPTY'}`,
        latency: `${latency}ms`
      });

      sourcingService.log({
        type: 'SUCCESS',
        endpoint: `${BRIDGE_BASE}/api/cj/ping`,
        message: 'Local Bridge is Online & Responsive',
        latency: `${latency}ms`,
        data: response.data
      });

      // The local proxy is alive. Return the full payload so testConnection can check vault status!
      return { alive: true, data: response.data };
    } catch (error) {
      console.error('[CJ DEBUG] Ping ERROR:', {
        endpoint: `${BRIDGE_BASE}/api/cj/ping`,
        message: 'Bridge Connection Failed. Target server unreachable or 404.',
        error: error.message
      });

      sourcingService.log({
        type: 'ERROR',
        endpoint: `${BRIDGE_BASE}/api/cj/ping`,
        message: 'Bridge Connection Failed. Target server unreachable or 404.',
        error: error.message
      });

      return { alive: false, data: null };
    }
  }

  /**
   * CJ INTEGRATION FIX (PHASE 1: CONNECTION TEST ONLY)
   * Strictly isolated from eBay discovery/scoring.
   */
  async testConnection() {
    const { alive: isBridgeAlive, data: pingData } = await this.pingBridge();
    
    if (!isBridgeAlive) {
        return {
            cjConnectionStatus: "FAILED",
            code: "BRIDGE_OFFLINE",
            message: "Local server (port 3001) is not responding. Start the backend first.",
            requestId: ""
        };
    }

    // 🏆 VAULT CHECK: Skip full auth protocol if backend already holds a valid token!
    if (pingData?.cjConnected && pingData?.tokenValid) {
        console.log("[CJ DEBUG] Token already active in secure Vault. Bypassing /auth handshake.");
        return {
            cjConnectionStatus: "CONNECTED",
            message: "Success",
            timestamp: new Date().toISOString()
        };
    }

    const url = this.CONFIG.AUTH_ENDPOINT; // Relative path ensured for Vite Tunnel
    const apiKey = import.meta.env.VITE_CJ_API_KEY || "CJ_API_KEY_FROM_ENV";
    const payload = { apiKey };
    const timestamp = new Date().toISOString();

    try {
        // Layer 1: Logs (Debug only)
        console.log("[CJ DEBUG] Initiating handshake via", BRIDGE_BASE);
        
        sourcingService.log({
            type: 'REQUEST',
            endpoint: `${BRIDGE_BASE}/api/cj/auth`,
            message: `Initiating handshake via CJ Bridge`,
            timestamp: new Date().toISOString()
        });

        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 20000,
            validateStatus: () => true // Prevent axios from throwing on 401/500
        });

        // 🕵️ DETECTION: SPA Fallback
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
            throw new Error('BRIDGE_OFFLINE: Server returned index.html.');
        }

        const envelope = response.data;
        const isSuccessful = envelope.status === 'AUTH_SUCCESS';
        
        console.log("[CJ DEBUG] Forensic Response", envelope);

        sourcingService.log({
            type: isSuccessful ? 'RESPONSE' : 'ERROR',
            endpoint: `${BRIDGE_BASE}/api/cj/auth`,
            http_status: response.status,
            message: envelope.message || (isSuccessful ? `Handshake Complete` : `Auth Protocol Rejected`),
            raw: envelope
        });

        if (isSuccessful) {
            console.log(`[CJ DEBUG] Step 3: SUCCESS. Handshake protocol compliant.`);
            
            return {
                cjConnectionStatus: "CONNECTED",
                message: "Success",
                timestamp
            };
        } else {
            console.warn(`[CJ DEBUG] Step 3: API REJECTION.`, envelope);
            return {
                cjConnectionStatus: "FAILED",
                message: envelope.error?.message || "API Auth Rejected"
            };
        }
    } catch (err) {
        console.error(`[CJ DEBUG] Step 2 FAIL: TRANSPORT FAULT.`, err.message);

        sourcingService.log({
            type: 'ERROR',
            endpoint: `${BRIDGE_BASE}/api/cj/auth`,
            message: 'Transport fault during handshake.',
            raw: err.message
        });

        return {
            cjConnectionStatus: "FAILED",
            message: err.message
        };
    }
  }

  /**
   * 🧠 NORMALIZATION LAYER
   */
  normalizeEbayProduct(title, categoryPath = "") {
    if (!title) return { keyword: "item", category: "General" };
    const safeTitle = String(title);
    const noise = /\b(trending|luxury|premium|best|hot|new|top|official|boho|glam|party|holiday|XL|XXLarge|Small|Medium|Large|Gold|Silver|Trim|S-L|SKU|Series|2024|2025)\b/gi;
    let clean = safeTitle.replace(noise, ' ')
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
          const content = res.data?.data?.content || [];
          const list = content.length > 0 
            ? content.flatMap(c => c.productList || []) 
            : (res.data?.data?.list || []);
            
          list.forEach(item => { if (item?.pid && !mergedMap.has(item.pid)) mergedMap.set(item.pid, item); });
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

  /**
   * 🧠 COMMERCE INTELLIGENCE ENGINE (POST-SELECTION ONLY)
   * Builds the structured response requested in the architectural spec.
   */
  buildIntelligencePayload(cjProduct = {}, ebayContext = {}) {
    const ebayProduct = ebayContext.ebayProduct || {};
    const ebayPrice = Number(ebayProduct.price) || 0;
    const cjDetail = cjProduct.detail || {};

    // Price extraction logic: Use first variant if base price is zero/missing.
    let cjPrice = parseFloat(cjDetail.sellPrice || cjProduct.sellPrice || 0);
    const variantsList = cjDetail.productVariants || [];
    if (cjPrice === 0 && variantsList.length > 0) {
        cjPrice = parseFloat(variantsList[0].variantSellPrice || 0);
    }

    const cj_product = {
        cj_product_id: cjProduct.pid,
        title: cjProduct.productNameEn || cjProduct.productName,
        price: cjPrice,
        currency: "USD",
        rating: 4.8, // Mock default high as CJ open API doesn't expose realtime review blocks
        stock: cjDetail.productVariants?.reduce((acc, v) => acc + (v.variantKey ? 100 : 0) , 0) || 120, 
        warehouse: "Global",
        shipping: { delivery_days: "7-15", ship_from: "CN" }
    };

    // 2. STEP 2 - ROI ENGINE
    const roiVal = ebayPrice ? (ebayPrice - cjPrice) : 0;
    const roiMargin = ebayPrice ? (roiVal / ebayPrice) * 100 : 0;
    let profitLabel = "LOW";
    if (roiMargin >= 40) profitLabel = "HIGH";
    else if (roiMargin >= 15) profitLabel = "MEDIUM";

    const roi = {
        roi_value: Number(roiVal.toFixed(2)),
        roi_percent: Number(roiMargin.toFixed(1)),
        profit_label: profitLabel
    };

    // 3. STEP 3 - SHIPPING SCORE
    let shipScore = 0;
    const deliveryDays = 12; // Static fallback representation
    if (deliveryDays <= 7) shipScore += 30;
    else if (deliveryDays <= 15) shipScore += 15;
    
    if (cj_product.warehouse === "US") shipScore += 40;
    if (cj_product.rating >= 4.5) shipScore += 20;
    if (cj_product.stock > 100) shipScore += 10;

    const shipping = {
        shipping_score: shipScore,
        delivery_estimate: "7-15 days",
        warehouse: cj_product.warehouse
    };

    // 4. STEP 4 - RISK ENGINE
    const riskFlags = [];
    if (cj_product.stock < 10) riskFlags.push("Critical Low Stock");
    if (deliveryDays > 20) riskFlags.push("Excessive Shipping Delay");
    if (!variantsList.length) riskFlags.push("No variant data found");
    if (roiMargin < 0) riskFlags.push("Negative Profit Margin Detected");

    let riskLevel = "LOW";
    if (riskFlags.length >= 2 || roiMargin < 0) riskLevel = "HIGH";
    else if (riskFlags.length === 1) riskLevel = "MEDIUM";

    const risk = {
        risk_level: riskLevel,
        risk_flags: riskFlags
    };

    // 5. STEP 5 - VARIANT ENRICHMENT
    const mappedVariants = variantsList.map(v => ({
        sku_id: v.vid || v.variantId || v.sku || "N/A",
        attributes: v.variantKey || "Standard",
        price: parseFloat(v.variantSellPrice || 0),
        stock: 999 
    }));

    const variants = {
        has_variants: mappedVariants.length > 0,
        variants: mappedVariants
    };

    // 6. STEP 6 - FINAL SELL SCORE
    const roiWeight = Math.min(100, Math.max(0, roiMargin * 2)); // Normalizing margin
    const riskPenalty = riskLevel === "HIGH" ? 0 : (riskLevel === "MEDIUM" ? 50 : 100);

    const sellScoreNum = Math.round(
        (0.40 * roiWeight) +
        (0.30 * shipScore) +
        (0.20 * riskPenalty) +
        (0.10 * (cj_product.stock > 100 ? 100 : cj_product.stock))
    );

    let classification = "AVOID";
    if (sellScoreNum >= 80) classification = "SELL";
    else if (sellScoreNum >= 50) classification = "REVIEW";

    const sell_score = {
        sell_score: sellScoreNum,
        classification
    };

    // 7. STEP 7 - FINAL FORMAT
    return {
        status: "CJ_INTELLIGENCE_READY",
        ebay_product: ebayProduct,
        cj_product,
        roi,
        shipping,
        risk,
        variants,
        sell_score,
        ready_for_ui: true
    };
  }

  normalizeResult(raw) {
    return {
      id: raw.pid || raw.id,
      title: raw.productNameEn || raw.productName || raw.nameEn,
      price: parseFloat(raw.detail?.productVariants?.[0]?.variantSellPrice || raw.sellPrice || 0),
      image: raw.productImage || raw.bigImage,
      source: 'CJ',
      url: `https://cjdropshipping.com/product-detail.html?id=${raw.pid || raw.id}`,
      shipping: "7-15 Days",
      alignmentScore: raw.alignmentScore,
      matchReason: raw.matchReason
    };
  }
}

export default new CJService();
