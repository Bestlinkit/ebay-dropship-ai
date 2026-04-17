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
      interpretation: this._getInterpretationReport(resellScore, product, batchContext, metrics), // New structured data
      momentum: Array.from({ length: 14 }, (_, i) => ({ x: i, y: Math.floor(resellScore * (0.8 + Math.random() * 0.4)) })),
      status: resellScore >= 80 ? 'TOP PICK' : (resellScore >= 60 ? 'TRENDING' : 'CONSIDERING'),
      profitLevel: resellScore >= 70 ? 'High' : (resellScore >= 40 ? 'Medium' : 'Low'),
      color: resellScore >= 70 ? "#10b981" : "#f59e0b",
      isWinner: resellScore >= 85,
      isHandpicked: resellScore >= 90, // AI Handpicked Flag
      metrics // Pass metrics for UI justification
    };
  }

  /**
   * Generates a structured analysis for high-fidelity UI rendering (v25.0)
   */
  _getInterpretationReport(score, product, context, metrics) {
    const { positioning, saturation, velocity, category } = metrics;
    
    const insights = [];

    // 🔴 SATURATION ANALYSIS
    insights.push({
      id: 'saturation',
      icon: 'Layers',
      label: 'Market Density',
      value: saturation.density > 800 ? 'Critical Saturation' : (saturation.density < 200 ? 'Blue Ocean' : 'Balanced Node'),
      description: saturation.density > 800 
        ? `High keyword density (${saturation.density} listings) creates extreme visibility friction.` 
        : (saturation.density < 200 ? `Sparse competition detected. Significant vacancy for rank capture.` : `Stable listing volume. Standard differentiation required.`),
      type: saturation.density > 800 ? 'negative' : (saturation.density < 200 ? 'positive' : 'neutral')
    });

    // 🟡 POSITIONING ANALYSIS
    insights.push({
      id: 'positioning',
      icon: 'Target',
      label: 'Price Health',
      value: positioning.zScore < -0.3 ? 'Aggressive Edge' : (positioning.zScore > 0.5 ? 'Pricing Friction' : 'Market Standard'),
      description: positioning.zScore < -0.3 
        ? `Entry price is ${Math.abs(positioning.zScore).toFixed(1)}σ below median. High capture potential.`
        : (positioning.zScore > 0.5 ? `Priced too high above market median. Margin at risk.` : `Price aligns with category standards. Margin depends on shipping.`),
      type: positioning.zScore < -0.3 ? 'positive' : (positioning.zScore > 0.5 ? 'negative' : 'neutral')
    });

    // 🔵 VELOCITY ANALYSIS
    insights.push({
      id: 'velocity',
      icon: 'Zap',
      label: 'Demand Strength',
      value: velocity.ratio > 10 ? 'High Velocity' : (velocity.ratio < 2 ? 'Stagnant' : 'Moderate Flow'),
      description: velocity.ratio > 10 
        ? `Exceptional movement detected (${velocity.ratio.toFixed(1)}% conversion ratio).`
        : (velocity.ratio < 2 ? `Low sales velocity in past 30 days. High storage/inventory risk.` : `Consistent demand floor. Reliable category performer.`),
      type: velocity.ratio > 10 ? 'positive' : (velocity.ratio < 2 ? 'negative' : 'neutral')
    });

    // 🏆 FINAL VERDICT
    let verdict = "";
    if (score >= 90) verdict = "PRIME OPPORTUNITY: High-liquidity node with exceptional rank potential. Immediate action advised.";
    else if (score >= 80) verdict = "STRATEGIC MATCH: Elite positioning and healthy demand signals indicate strong ROI potential.";
    else if (score >= 60) verdict = "VALIDATED FIT: Moderate volume expected with precise keyword optimization.";
    else {
      const reason = saturation.density > 800 ? "extreme competitor density" : 
                    (positioning.zScore > 0.5 ? "uncompetitive price positioning" : "stagnant demand signals");
      verdict = `AVOIDANCE ADVISED: Market node currently restricted by ${reason}. High CAC risk.`;
    }

    return {
      insights,
      verdict,
      scoreLabel: score >= 80 ? 'Strong' : (score >= 60 ? 'Decent' : 'Weak')
    };
  }

  _getHumanizedMarketSummary(score, product, context, metrics) {
    const report = this._getInterpretationReport(score, product, context, metrics);
    const parts = report.insights.map(i => `[${i.label}: ${i.value}] ${i.description}`);
    parts.push(`[Verdict] ${report.verdict}`);
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
