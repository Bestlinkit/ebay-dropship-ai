import ebayService from './ebay';

/**
 * Stable Sourcing Intelligence (v8.0)
 * Deterministic logic for ROI, Trust, and Scoring.
 */
class SourcingService {
  constructor() {
    this.Status = {
      LOADING: 'LOADING',
      PARTIAL: 'PARTIAL',
      COMPLETE: 'COMPLETE',
      AUTH_ERROR: 'AUTH_ERROR',
      CONFIG_ERROR: 'CONFIG_ERROR'
    };
  }

  /**
   * Deterministic ROI Engine (Rule 7)
   * Calculates ROI only when both prices exist. No fakes.
   */
  calculateROI(ebayPrice, supplierCost, shipping = 0) {
    const cost = Number(supplierCost);
    const ship = Number(shipping);
    const target = Number(ebayPrice);

    // 🚨 STABLE FLOW GUARD: No missing or zero prices permitted for ROI
    if (!cost || cost <= 0 || !target || target <= 0) {
      return null; 
    }

    const totalCost = cost + ship;
    const expected = Math.round(((target - totalCost) / totalCost) * 100);
    const conservative = Math.round(((target - (totalCost * 1.2)) / totalCost) * 100);

    return { expected, conservative };
  }

  /**
   * Supplier Trust Evaluator (Rule 4)
   * AliExpress specific trust metrics.
   */
  evaluateSupplierTrust(product) {
    // Return early if no trust data
    if (product.source === 'aliexpress') {
      if (!product.rating) return { level: 'Low', score: 0, label: "No rating available" };
      
      let score = 0;
      if (product.rating >= 4.8) score = 90;
      else if (product.rating >= 4.5) score = 70;
      else if (product.rating >= 4.0) score = 50;
      else score = 30;

      const level = score >= 80 ? 'High' : (score >= 50 ? 'Medium' : 'Low');
      return { level, score, label: `${product.rating} / 5` };
    }

    // Eprolo Trust (Pattern-based)
    if (product.source === 'EPROLO') {
      return { level: 'High', score: 95, label: "Verified Eprolo Catalog" };
    }

    return { level: 'Medium', score: 50, label: "Unknown Source" };
  }

  /**
   * Unified Opportunity Score (v8.0)
   * Weighted by ROI and Trust.
   */
  calculateOpportunityScore(product, targetPrice) {
    const roi = this.calculateROI(targetPrice, product.price, product.shipping || 0);
    const trust = this.evaluateSupplierTrust(product);
    
    let score = 0;
    
    // 1. ROI Contribution (60%)
    if (roi) {
      const roiVal = Math.min(Math.max(roi.expected, 0), 100);
      score += (roiVal * 0.6);
    } else {
      score -= 20; // Penalty for missing price data
    }

    // 2. Trust Contribution (40%)
    score += (trust.score * 0.4);

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Humanized Summary Generator
   */
  getActionableSummary(product, targetPrice) {
    const roi = this.calculateROI(targetPrice, product.price, product.shipping || 0);
    const trust = this.evaluateSupplierTrust(product);

    if (!roi) return "Awaiting pricing data to calculate feasibility.";
    
    if (roi.expected > 40 && trust.level === 'High') {
      return `Strong opportunity. High ROI (${roi.expected}%) combined with a trusted supplier makes this a top candidate for optimization.`;
    }
    
    if (roi.expected > 20) {
      return `Viable option. Moderate ROI potential. Verify variants and shipping times before proceeding.`;
    }

    return `Marginal feasibility. The ROI (${roi.expected}%) may be too tight after fees and marketing costs.`;
  }

  /**
   * Content-Aware Deduplication
   */
  dedupe(products) {
    const seen = new Set();
    return products.filter(p => {
      const key = `${p.source}_${p.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Data Normalization Guard (Rule 8)
   * Enforces optional charting and strict typing.
   */
  normalize(raw) {
    if (!raw) return null;
    return {
      id: raw?.id || raw?.productId || `gen_${Math.random()}`,
      title: raw?.title || "Untitled Product",
      price: Number(raw?.price) || null,
      image: raw?.image || "/placeholder.png",
      images: Array.isArray(raw?.images) ? raw.images : [raw?.image].filter(Boolean),
      source: (raw?.source || 'unknown').toLowerCase(),
      url: raw?.url || "",
      rating: raw?.rating || null,
      reviews: raw?.reviews || null,
      status: raw?.status || 'PENDING'
    };
  }
}

export default new SourcingService();
