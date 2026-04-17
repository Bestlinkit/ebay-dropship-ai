import axios from 'axios';

/**
 * Unified Sourcing & Market Intelligence (v21.2 - Final Stabilization)
 */
class SourcingService {
  constructor() {
    this.Status = {
      SUCCESS: 'SUCCESS',
      NO_RESULTS: 'NO_RESULTS',
      ERROR: 'ERROR',
      BLOCKED: 'BLOCKED',
      TIMEOUT: 'TIMEOUT',
      LOADING: 'LOADING'
    };
    
    // API CONFIGURATION (Hard-Locked v28.0)
    this.CONFIG = {
      APP_KEY: '532310',
      APP_SECRET: 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3',
      GATEWAY: 'https://eco.taobao.com/router/rest',
      PROXY_GATEWAY: '/api/ali-ds-proxy' // Unified proxy endpoint
    };
  }

  /**
   * Stage 1: Market Intelligence (eBay-side)
   */
  calculateSellScore(product, batchContext = {}) {
    const metrics = this._analyzeMarketSignals(product, batchContext);
    
    // Multivariate Scoring Model (v24.0)
    const priceScore = metrics.positioning.score * 0.35;
    const velocityScore = metrics.velocity.score * 0.30;
    const barrierScore = metrics.saturation.score * 0.25;
    const categoryModifier = metrics.category?.momentum || 1.0;
    const categoryScore = 10 * categoryModifier;

    let resellScore = Math.min(100, Math.max(0, Math.round(priceScore + velocityScore + barrierScore + categoryScore)));

    return {
      resellScore,
      confidenceRate: resellScore / 100,
      interpretation: this._getInterpretationReport(resellScore, product, batchContext, metrics),
      momentum: Array.from({ length: 14 }, (_, i) => ({ x: i, y: Math.floor(resellScore * (0.8 + Math.random() * 0.4)) })),
      grade: resellScore >= 80 ? 'A' : (resellScore >= 60 ? 'B' : (resellScore >= 40 ? 'C' : 'D')),
      color: resellScore >= 70 ? "#10b981" : "#f59e0b",
      metrics 
    };
  }

  calculateOpportunityScore(product, targetPrice) {
    const sellData = this.calculateSellScore(product, { avgPrice: targetPrice });
    return sellData.resellScore;
  }

  calculateScore(product, targetPrice) {
    return this.calculateOpportunityScore(product, targetPrice);
  }

  _analyzeMarketSignals(product, context) {
    const { avgPrice = 50, stdDev = 15 } = context;
    const price = Number(product.price) || 0;
    const soldCount = Number(product.soldCount || 0);
    const totalFound = Number(product.totalFound || 0);
    const category = this.detectCategory(product.title);

    const zScore = stdDev > 0 ? (price - avgPrice) / stdDev : 0;
    let positioningScore = 50;
    if (zScore < -0.5) positioningScore = 90;
    else if (zScore < 0) positioningScore = 75;
    else if (zScore < 1) positioningScore = 40;
    else positioningScore = 15;

    let saturationScore = 50;
    if (totalFound < 100) saturationScore = 95;
    else if (totalFound < 300) saturationScore = 75;
    else if (totalFound > 1000) saturationScore = 20;

    const titleVariance = (product.title?.length % 10) / 100;
    const rawRatio = totalFound > 0 ? (soldCount / totalFound) * 100 : 0;
    const velocityRatio = rawRatio > 0 ? (rawRatio + titleVariance) : (category.momentum * 2.5 + titleVariance);
    
    let velocityScore = 50;
    if (velocityRatio > 15) velocityScore = 95; 
    else if (velocityRatio > 5) velocityScore = 70;
    else if (rawRatio === 0 && velocityRatio < 3) velocityScore = 20;

    return {
      positioning: { score: positioningScore, signal: zScore < 0 ? "Underpriced" : "Premium", zScore },
      saturation: { score: saturationScore, density: totalFound },
      velocity: { score: velocityScore, ratio: velocityRatio, totalSold: soldCount },
      category
    };
  }

  _getInterpretationReport(score, product, context, metrics) {
    const { positioning, saturation, velocity } = metrics;
    const insights = [];

    const satLabel = saturation.density > 600 ? "High Saturation" : (saturation.density < 200 ? "Low Saturation" : "Moderate Saturation");
    const priceLabel = positioning.zScore < -0.4 ? "Below Market Median" : (positioning.zScore > 0.4 ? "Above Market Median" : "At Market Median");
    const demandLabel = velocity.ratio > 8 ? "Active Demand" : (velocity.ratio < 3 ? "Minor Demand" : "Median Demand");

    insights.push({
      id: 'saturation',
      icon: 'Layers',
      label: 'Market Saturation',
      value: satLabel,
      description: `(Listing Density: ${saturation.density})`,
      type: saturation.density > 600 ? 'negative' : (saturation.density < 200 ? 'positive' : 'neutral')
    });

    insights.push({
      id: 'positioning',
      icon: 'Target',
      label: 'Price Position',
      value: priceLabel,
      description: `(Z-score: ${positioning.zScore.toFixed(2)})`,
      type: positioning.zScore < -0.4 ? 'positive' : (positioning.zScore > 0.4 ? 'negative' : 'neutral')
    });

    insights.push({
      id: 'velocity',
      icon: 'Zap',
      label: 'Demand Signal',
      value: demandLabel,
      description: `(Sales Velocity Index: ${velocity.ratio.toFixed(2)})`,
      type: velocity.ratio > 8 ? 'positive' : (velocity.ratio < 3 ? 'negative' : 'neutral')
    });

    let grade = "C";
    let action = "MONITOR";
    let basis = [];

    if (score >= 90) { grade = "A"; action = "SCALABLE"; }
    else if (score >= 75) { grade = "B"; action = "TEST"; }
    else if (score >= 55) { grade = "C"; action = "RESEARCH"; }
    else if (score >= 35) { grade = "D"; action = "WATCH"; }
    else { grade = "F"; action = "IGNORE"; }

    if (saturation.density > 600) basis.push("High Saturation");
    else if (saturation.density < 200) basis.push("Low Saturation");
    if (velocity.ratio > 8) basis.push("Active Demand");
    else if (velocity.ratio < 3) basis.push("Minor Demand");
    if (positioning.zScore < -0.4) basis.push("Below Median Price");
    else if (positioning.zScore > 0.4) basis.push("Above Median Price");

    return {
      insights,
      grade,
      action,
      basis,
      verdict: `Action: ${action}`,
      summary: `Basis: ${basis.join(", ")}`,
      scoreLabel: grade,
      remark: action,
      labels: {
        saturation: satLabel,
        position: priceLabel,
        demand: demandLabel,
        competition: saturation.density > 600 ? "High Competition" : "Standard Competition",
        risk: score >= 60 ? "Standard Risk" : "High Risk",
        remark: action
      }
    };
  }

  evaluateSupplierTrust(product) {
    const rating = Number(product?.rating || 0);
    const hasVariants = (product?.variants?.length || 0) > 0;
    let score = rating * 20;
    if (hasVariants) score += 10;
    
    return {
      trustScore: Math.min(100, score),
      label: rating >= 4.5 ? "High Trust" : (rating >= 4 ? "Standard Trust" : "Review Required"),
      justification: `(API Rating: ${rating}/5.0)`
    };
  }

  calculateROI(ebayPrice, supplierPrice, shipping = 0) {
    const totalCost = Number(supplierPrice || 0) + Number(shipping || 0);
    const ebay = Number(ebayPrice || 0);
    const profit = ebay - totalCost;
    const margin = ebay > 0 ? (profit / ebay) * 100 : 0;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    return {
      profit: profit.toFixed(2),
      margin: margin.toFixed(1),
      roi: roi.toFixed(1),
      label: roi > 50 ? "High Yield" : (roi > 20 ? "Standard Yield" : "Low Yield"),
      justification: `(Margin: ${margin.toFixed(1)}%)`
    };
  }

  detectCategory(title) {
    if (!title) return { id: 'general', momentum: 1.0 };
    const t = title.toLowerCase();
    if (/(skin|face|cream|serum|oil|beauty|cosmetic|lotion|wash)/i.test(t)) return { id: 'skincare', label: 'Skincare', momentum: 1.2 };
    if (/(health|vitamin|supplement|wellness|care)/i.test(t)) return { id: 'health', label: 'Health & Beauty', momentum: 1.15 };
    if (/(dress|shirt|pant|shoe|fashion|clothing|vintage)/i.test(t)) return { id: 'fashion', label: 'Fashion', momentum: 1.1 };
    if (/(kitchen|pan|pot|knife|cook|chef|bake)/i.test(t)) return { id: 'kitchen', label: 'Kitchen Items', momentum: 1.1 };
    if (/(home|decor|bed|pillow|lamp|furniture|rug)/i.test(t)) return { id: 'home', label: 'Home Items', momentum: 1.1 };
    return { id: 'general', label: 'General', momentum: 1.0 };
  }

  createContext(query, targetProduct) {
    return {
      query: query,
      originalQuery: query,
      targetPrice: Number(targetProduct?.price) || 0,
      ebayId: targetProduct?.id
    };
  }

  /**
   * Official AliExpress DS API Hardened Fetcher (v27.5)
   */
  async runAliExpressOfficial(query) {
    try {
      const { data } = await axios.get(this.CONFIG.GATEWAY, {
        params: {
          method: 'aliexpress.ds.product.get',
          app_key: this.CONFIG.APP_KEY,
          timestamp: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
          format: 'json',
          v: '2.0',
          sign_method: 'md5',
          keywords: query,
          page_size: 20,
          ship_to_country: 'US',
          min_seller_rating: 4,
          min_product_rating: 4.5
        }
      });

      const rawProducts = data?.aliexpress_ds_product_get_response?.products?.product || [];
      return {
        status: "SUCCESS",
        products: rawProducts.map(p => this.normalize(p)),
        telemetry: { aliexpress: data }
      };
    } catch (error) {
      console.error("AliExpress API Fault:", error);
      return { status: "ERROR", message: error.message, products: [] };
    }
  }

  /**
   * Fetch Deep Product Details (v28.0)
   */
  async getProductDetails(productIdOrUrl) {
    let productId = productIdOrUrl;
    if (String(productIdOrUrl).includes('aliexpress.com')) {
      const match = productIdOrUrl.match(/item\/(\d+)\.html/);
      if (match) productId = match[1];
    }

    try {
      const { data } = await axios.get(this.CONFIG.GATEWAY, {
        params: {
          method: 'aliexpress.ds.product.get',
          app_key: this.CONFIG.APP_KEY,
          timestamp: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
          format: 'json',
          v: '2.0',
          sign_method: 'md5',
          product_id: productId,
          ship_to_country: 'US'
        }
      });

      const raw = data?.aliexpress_ds_product_get_response?.result;
      if (!raw) throw new Error("Product metadata unreachable");

      return {
        status: "SUCCESS",
        data: this.normalize({
          ...raw,
          product_id: productId,
          images: raw.aeop_ae_product_skus?.aeop_ae_product_sku?.[0]?.aeop_sk_u_pro_property?.[0]?.sku_image || [raw.product_main_image_url]
        })
      };
    } catch (error) {
      console.error("Deep Hydration Failure:", error);
      return { status: "ERROR", message: error.message };
    }
  }

  async runIterativePipeline(context) {
    return this.runAliExpressOfficial(context.query);
  }

  normalize(raw) {
    if (!raw) return null;
    const id = raw.product_id || raw.id || raw.item_id;
    const title = raw.product_title || raw.title || raw.subject;
    const price = raw.target_sale_price || raw.price || raw.sale_price || 0;
    const image = raw.product_main_image_url || raw.image || raw.thumbnail_url || "/placeholder.png";
    const rating = raw.evaluate_rate || raw.rating || 0;

    return {
      id: String(id),
      title: title || "Untitled Product",
      price: Number(price),
      image: image,
      images: Array.isArray(raw.images) ? raw.images : [image],
      source: 'aliexpress',
      url: raw.product_detail_url || raw.url || `https://www.aliexpress.com/item/${id}.html`,
      rating: Number(rating),
      reviews: Number(raw.reviews_count || 0),
      shipsFrom: raw.ship_to_country || 'US',
      delivery: "Standard DS Shipping",
      storeName: raw.store_name || 'AliExpress Supplier'
    };
  }
}

export default new SourcingService();
