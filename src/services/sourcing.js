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
  }

  /**
   * Stage 1: Market Intelligence (eBay-side)
   */
  calculateSellScore(product, batchContext = {}) {
    const metrics = this._analyzeMarketSignals(product, batchContext);
    
    // Multivariate Scoring Model (v24.0)
    // 1. Price Health (35%) - Distance from median/target
    const priceScore = metrics.positioning.score * 0.35;
    
    // 2. Velocity Signal (30%) - Movement vs Density
    const velocityScore = metrics.velocity.score * 0.30;
    
    // 3. Barrier Index (25%) - Saturation Density
    const barrierScore = metrics.saturation.score * 0.25;
    
    // 4. Category Momentum (10%) - Focus Alignment
    const categoryModifier = metrics.category?.momentum || 1.0;
    const categoryScore = 10 * categoryModifier;

    let resellScore = Math.min(100, Math.max(0, Math.round(priceScore + velocityScore + barrierScore + categoryScore)));

    return {
      resellScore,
      confidence: resellScore >= 80 ? 'High' : (resellScore < 40 ? 'Low' : 'Medium'),
      summary: this._getHumanizedMarketSummary(resellScore, product, batchContext, metrics),
      momentum: Array.from({ length: 14 }, (_, i) => ({ x: i, y: Math.floor(resellScore * (0.8 + Math.random() * 0.4)) })),
      status: resellScore >= 80 ? 'TOP PICK' : (resellScore >= 60 ? 'TRENDING' : 'CONSIDERING'),
      profitLevel: resellScore >= 70 ? 'High' : (resellScore >= 40 ? 'Medium' : 'Low'),
      color: resellScore >= 70 ? "#10b981" : "#f59e0b",
      isWinner: resellScore >= 85,
      metrics // Pass metrics for UI justification
    };
  }

  _analyzeMarketSignals(product, context) {
    const { avgPrice = 50, stdDev = 15 } = context;
    const price = Number(product.price) || 0;
    const soldCount = Number(product.soldCount || 0);
    const totalFound = Number(product.totalFound || 0);
    const category = this.detectCategory(product.title);

    // 📊 1. POSITIONING ANALYSIS
    const zScore = stdDev > 0 ? (price - avgPrice) / stdDev : 0;
    let positioningScore = 50;
    if (zScore < -0.5) positioningScore = 90; // Significantly underpriced
    else if (zScore < 0) positioningScore = 75; // Competitive
    else if (zScore < 1) positioningScore = 40; // Overpriced
    else positioningScore = 15; // Extreme friction

    // 📊 2. SATURATION ANALYSIS
    let saturationScore = 50;
    if (totalFound < 100) saturationScore = 95; // Rare/Niche
    else if (totalFound < 300) saturationScore = 75; // Balanced
    else if (totalFound > 1000) saturationScore = 20; // Hyper-saturated

    // 📊 3. VELOCITY ANALYSIS
    // Demand Strength inferred from movement vs density ratio
    const velocityRatio = totalFound > 0 ? (soldCount / totalFound) * 100 : 0;
    let velocityScore = 50;
    if (velocityRatio > 15) velocityScore = 95; 
    else if (velocityRatio > 5) velocityScore = 70;
    else if (soldCount === 0) velocityScore = 10;

    return {
      positioning: { score: positioningScore, signal: zScore < 0 ? "Underpriced" : "Premium", zScore },
      saturation: { score: saturationScore, density: totalFound },
      velocity: { score: velocityScore, ratio: velocityRatio, totalSold: soldCount },
      category
    };
  }

  _getHumanizedMarketSummary(score, product, context, metrics) {
    const { positioning, saturation, velocity, category } = metrics;
    
    const parts = [];

    // [SATURATION]
    const satText = saturation.density > 800 
      ? `[Saturation: Critical] High keyword density (${saturation.density} listings) creates extreme visibility friction.` 
      : (saturation.density < 200 ? `[Saturation: Sparse] Low competitive density detected. Significant vacancy in keyword node.` : `[Saturation: Moderate] Balanced listing volume. Strategy requires specific differentiators.`);
    parts.push(satText);

    // [POSITIONING]
    const posText = positioning.zScore < -0.3 
      ? `[Positioning: Aggressive] Entry price is ${Math.abs(positioning.zScore).toFixed(1)}σ below median. High capture potential.`
      : `[Positioning: Neutral] Price aligns with category standard. Margin depends on shipping optimization.`;
    parts.push(posText);

    // [PRESSURE & CATEGORY]
    let pressureText = "";
    if (category?.id === 'beauty' || category?.id === 'skincare') {
      pressureText = "[Pressure: Category Focus] Beauty niche detected. High recurring demand signals offset saturation risk.";
    } else if (category?.id === 'fashion') {
      pressureText = "[Pressure: Trend-Driven] Visual momentum is high. Volatility risk remains medium.";
    } else if (category?.id === 'home' || category?.id === 'kitchen') {
      pressureText = "[Pressure: Utility-Reliant] Stable demand floor. Resale potential linked to durability signals.";
    } else {
      pressureText = "[Pressure: General] Standard competitive model. Evidence-based capture strategy advised.";
    }
    parts.push(pressureText);

    // [VERDICT]
    let verdict = "";
    if (score >= 80) {
      verdict = `[Verdict] Elite liquidity detected. High probability of search-rank dominance via pricing edge.`;
    } else if (score >= 60) {
      verdict = `[Verdict] Validated fit. Moderate volume expected with keyword optimization.`;
    } else {
      // Humanized Avoidance Insight
      const reason = saturation.density > 800 ? "overwhelmed by extreme competitor density" : 
                    (positioning.zScore > 0.5 ? "priced too high above the market median" : "showing stagnant demand signals");
      
      verdict = `[Verdict] Avoid for now. This item is currently ${reason}, which means your effort would likely result in high advertising costs for minimal return. Better opportunities exist in lower-density price windows.`;
    }
    parts.push(verdict);

    return parts.join("\n\n");
  }

  /**
   * Enhanced Categorization (v24.0 Focal Points)
   */
  detectCategory(title) {
    if (!title) return { id: 'general', momentum: 1.0 };
    const t = title.toLowerCase();
    
    // Priority Segments
    if (/(skin|face|cream|serum|oil|beauty|cosmetic|lotion|wash)/i.test(t)) return { id: 'skincare', label: 'Skincare', momentum: 1.2 };
    if (/(health|vitamin|supplement|wellness|care)/i.test(t)) return { id: 'health', label: 'Health & Beauty', momentum: 1.15 };
    if (/(dress|shirt|pant|shoe|fashion|clothing|vintage)/i.test(t)) return { id: 'fashion', label: 'Fashion', momentum: 1.1 };
    if (/(kitchen|pan|pot|knife|cook|chef|bake)/i.test(t)) return { id: 'kitchen', label: 'Kitchen Items', momentum: 1.1 };
    if (/(home|decor|bed|pillow|lamp|furniture|rug)/i.test(t)) return { id: 'home', label: 'Home Items', momentum: 1.1 };

    // Commodities
    if (/(book|cd|dvd|media|magazine)/i.test(t)) return { id: 'media', label: 'Books/Media', momentum: 0.8 };

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

  async runIterativePipeline(context, fetchers) {
    const { query } = context;
    const result = await this.runUnifiedPipeline(context, fetchers(query));
    
    return {
        status: result.status, // SUCCESS | NO_RESULTS | ERROR | BLOCKED | TIMEOUT
        sources: result.sources,
        telemetry: result.telemetry,
        products: result.products
    };
  }

  async runUnifiedPipeline(context, fetchers) {
    const { fetchEprolo, fetchAliExpress } = fetchers;
    const results = await Promise.allSettled([
      this.safeFetch(fetchEprolo, "EPROLO"),
      this.safeFetch(fetchAliExpress, "ALIEXPRESS")
    ]);

    const eproloRes = results[0];
    const aliRes = results[1];

    const sources = {
      eprolo: eproloRes.status === 'fulfilled' ? (eproloRes.value.status) : 'ERROR',
      aliexpress: aliRes.status === 'fulfilled' ? (aliRes.value.status) : 'ERROR'
    };

    const telemetry = {
      eprolo: eproloRes.status === 'fulfilled' ? eproloRes.value : null,
      aliexpress: aliRes.status === 'fulfilled' ? aliRes.value : null
    };

    // Determine final status based on hierarchy (Directive v21.2)
    const statuses = Object.values(sources);
    let finalStatus = 'SUCCESS';

    if (statuses.includes('SUCCESS')) finalStatus = 'SUCCESS';
    else if (statuses.includes('BLOCKED')) finalStatus = 'BLOCKED';
    else if (statuses.includes('TIMEOUT')) finalStatus = 'TIMEOUT';
    else if (statuses.every(s => s === 'NO_RESULTS' || s === 'EMPTY')) finalStatus = 'NO_RESULTS';
    else finalStatus = 'ERROR';

    const rawProducts = [
      ...(eproloRes.status === 'fulfilled' ? (eproloRes.value.products || []) : []),
      ...(aliRes.status === 'fulfilled' ? (aliRes.value.products || []) : [])
    ];

    return {
      status: finalStatus,
      sources,
      telemetry,
      products: this.dedupe(rawProducts)
    };
  }

  async safeFetch(fn, label) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 15000))
      ]);
    } catch (e) {
      return { status: e.message === 'TIMEOUT' ? 'TIMEOUT' : 'ERROR', products: [] };
    }
  }

  dedupe(products) {
    const seen = new Set();
    return products.filter(p => {
      const key = `${p.source}_${p.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  normalize(raw) {
    return {
      id: raw?.id || `gen_${Math.random()}`,
      title: raw?.title || "Untitled Product",
      price: Number(raw?.price) || 0,
      image: raw?.image || "/placeholder.png",
      images: Array.isArray(raw?.images) ? raw.images : [raw?.image].filter(Boolean),
      source: (raw?.source || 'unknown').toLowerCase(),
      url: raw?.url || "",
      rating: raw?.rating || 0
    };
  }
}

export default new SourcingService();
