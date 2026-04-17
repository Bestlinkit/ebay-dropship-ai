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
    const { avgPrice = 50, stdDev = 10 } = batchContext;
    const price = Number(product.price) || 0;
    let resellScore = 50;
    
    if (price > 0) {
      if (price < avgPrice - (stdDev * 0.5)) resellScore += 20; 
      else if (price < avgPrice) resellScore += 10;
      else if (price > avgPrice + stdDev) resellScore -= 15;
    }

    const soldCount = Number(product.soldCount || 0);
    if (soldCount > 50) resellScore += 15;
    const totalFound = Number(product.totalFound || 0);
    if (totalFound < 300) resellScore += 10;

    resellScore = Math.min(100, Math.max(0, resellScore));
    return {
      resellScore,
      confidence: resellScore >= 80 ? 'High' : (resellScore < 40 ? 'Low' : 'Medium'),
      summary: this._getHumanizedMarketSummary(resellScore, product, batchContext),
      momentum: Array.from({ length: 14 }, (_, i) => ({ x: i, y: Math.floor(resellScore * (0.8 + Math.random() * 0.4)) })),
      status: resellScore >= 80 ? 'TOP PICK' : (resellScore >= 60 ? 'TRENDING' : 'CONSIDERING'),
      profitLevel: resellScore >= 70 ? 'High' : (resellScore >= 40 ? 'Medium' : 'Low'),
      color: resellScore >= 70 ? "#10b981" : "#f59e0b",
    };
  }

  _getHumanizedMarketSummary(score, product, context) {
    const { avgPrice = 50 } = context;
    const price = Number(product.price) || 0;
    const isUnderAverage = price < avgPrice;
    const isHighlyCompetitive = Number(product.totalFound || 0) > 500;
    const hasHighVelocity = Number(product.soldCount || 0) > 100;

    let summary = "";

    if (score >= 85) {
      summary = `Elite opportunity. ${isUnderAverage ? "Aggressive pricing" : "Premium placement"} backed by ${hasHighVelocity ? "massive" : "solid"} demand signals and ${isHighlyCompetitive ? "validated" : "low"} competition.`;
    } else if (score >= 70) {
      summary = `Strong market fit. Pricing aligns with ${isUnderAverage ? "budget-conscious" : "mid-tier"} segments. High likelihood of consistent conversion.`;
    } else if (score >= 50) {
      summary = `Moderate alignment. ${isHighlyCompetitive ? "High saturation requires" : "Strategic focus on"} optimized marketing and unique listing hooks to drive volume.`;
    } else {
      summary = `Challenging node. High friction detected. Success limited to niche pivots or significant price restructuring.`;
    }

    return summary;
  }

  calculateROI(ebayPrice, supplierCost, shipping = 0) {
    const cost = Number(supplierCost);
    const target = Number(ebayPrice);
    if (!cost || cost <= 0 || !target || target <= 0) return null;
    const totalCost = cost + Number(shipping);
    return { expected: Math.round(((target - totalCost) / totalCost) * 100) };
  }

  evaluateSupplierTrust(product) {
    if (product.source === 'eprolo') return { level: 'High', score: 95, label: "Verified Eprolo" };
    if (product.source === 'aliexpress') {
      const rating = Number(product.rating || 0);
      const score = rating >= 4.5 ? 80 : 40;
      return { level: score >= 80 ? 'High' : 'Low', score, label: `${rating} / 5` };
    }
    return { level: 'Medium', score: 50, label: "Secondary" };
  }

  calculateOpportunityScore(product, targetPrice) {
    const roi = this.calculateROI(targetPrice, product.price);
    const trust = this.evaluateSupplierTrust(product);
    let score = roi ? (roi.expected * 0.6) : 0;
    score += (trust.score * 0.4);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  detectCategory(title) {
    if (!title) return null;
    const t = title.toLowerCase();
    const categories = [
        { id: 'electronics', keywords: ['phone', 'tablet', 'laptop', 'wireless'] },
        { id: 'beauty', keywords: ['soap', 'cleanser', 'skincare'] }
    ];
    for (const cat of categories) {
        if (cat.keywords.some(kw => t.includes(kw))) return cat.id;
    }
    return null;
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
