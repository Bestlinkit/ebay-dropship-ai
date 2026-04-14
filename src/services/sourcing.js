import ebayService from './ebay';

/**
 * Hardened Sourcing Intelligence Engine (v3.0 - OPS & Profit Maximizer)
 * Deterministic Weighted Model & Real-Market Telemetry Pulse
 */
class SourcingService {
  constructor() {
    this.weights = {
      demand: 0.30,
      competition: 0.25,
      priceStability: 0.15,
      profitMargin: 0.20,
      trend: 0.10
    };
    
    this.COOLDOWN_KEY = 'dropai_discovery_cooldown';
  }

  /**
   * Calculates the Product Opportunity Score (OPS)
   * Deterministic 0-100 score based on real marketplace signals.
   */
  calculateOPS(product, supplierCost = null) {
    if (!product) return { score: 0, labels: { demand: 'Low', competition: 'High', profit: 'Low', trend: 'Stable' } };

    const signals = {
      demand: this._calcDemandScore(product),
      competition: this._calcCompetitionScore(product),
      priceStability: this._calcPriceStability(product),
      profitMargin: supplierCost ? this._calcProfitScore(product.price, supplierCost) : 60, // Fallback if no supplier cost yet
      trend: product.trendIndex || 50
    };

    const weightedScore = Object.keys(this.weights).reduce((acc, key) => {
      return acc + (signals[key] * this.weights[key]);
    }, 0);

    const score = Math.round(weightedScore);
    
    return {
      score,
      labels: {
        demand: this._getLabel(signals.demand, ['Low', 'Medium', 'High']),
        competition: this._getLabel(signals.competition, ['High', 'Medium', 'Low']), // Inverted for competition
        profit: this._getLabel(signals.profitMargin, ['Low', 'Medium', 'High']),
        trend: this._getLabel(signals.trend, ['Declining', 'Stable', 'Rising'])
      },
      status: score >= 80 ? 'HIGH' : (score >= 50 ? 'MODERATE' : 'LOW'),
      color: score >= 80 ? '#10b981' : (score >= 50 ? '#f59e0b' : '#ef4444'),
      reasoning: this.getDecisionLogic(score, signals)
    };
  }

  _getLabel(value, labels) {
    if (value >= 70) return labels[2];
    if (value >= 40) return labels[1];
    return labels[0];
  }

  _calcDemandScore(product) {
    // Derived from sold count or listing activity
    const sold = product.soldCount || 0;
    if (sold > 100) return 90;
    if (sold > 50) return 75;
    if (sold > 10) return 50;
    return 30;
  }

  _calcCompetitionScore(product) {
    // High results = High competition = Low score
    const count = product.totalFound || 500;
    if (count < 50) return 95;
    if (count < 200) return 70;
    if (count < 1000) return 40;
    return 20;
  }

  _calcPriceStability(product) {
    if (!product.priceRange) return 60;
    const { min, max, avg } = product.priceRange;
    const spread = (max - min) / (avg || 1);
    if (spread < 0.15) return 90;
    if (spread < 0.4) return 60;
    return 30;
  }

  _calcProfitScore(marketPrice, supplierCost) {
    const margin = (marketPrice - supplierCost) / marketPrice;
    if (margin > 0.4) return 95;
    if (margin > 0.25) return 75;
    if (margin > 0.15) return 50;
    return 20;
  }

  /**
   * AI Profit Maximizer Logic
   */
  getPricingIntelligence(product, supplierCost, categoryId = null) {
    if (!supplierCost) return null;

    const fees = ebayService.getCategoryFee(categoryId || product.categoryId);
    const cost = parseFloat(supplierCost);
    const marketAvg = product.price || 50;
    
    // Suggest 5% below market average for conversion anchor
    const suggestedPrice = marketAvg * 0.95;
    const ebayFee = (suggestedPrice * fees.percentage) + fees.fixed;
    const netProfit = suggestedPrice - cost - ebayFee;
    const margin = netProfit / suggestedPrice;

    return {
      suggestedPrice: suggestedPrice.toFixed(2),
      breakdown: {
        cost: cost.toFixed(2),
        ebayFee: ebayFee.toFixed(2),
        netProfit: netProfit.toFixed(2),
        margin: (margin * 100).toFixed(1)
      },
      positioning: this._classifyPositioning(suggestedPrice, marketAvg),
      marketDiff: (((suggestedPrice / marketAvg) - 1) * 100).toFixed(1),
      isRecommended: margin >= 0.15,
      probability: this._calculateSalesProbability(margin, suggestedPrice, marketAvg)
    };
  }

  _classifyPositioning(price, avg) {
    const diff = (price / avg) - 1;
    if (diff < -0.1) return { label: 'Competitive', color: '#10b981' };
    if (diff < 0.1) return { label: 'Balanced', color: '#f59e0b' };
    return { label: 'Premium', color: '#ef4444' };
  }

  _calculateSalesProbability(margin, price, avg) {
    const diff = (price / avg) - 1;
    if (diff < -0.05 && margin >= 0.15) return 'High';
    if (diff <= 0.05) return 'Medium';
    return 'Low';
  }

  /**
   * Deterministic Decision Reasoning (No generic AI text)
   */
  getDecisionLogic(score, signals) {
    const drivers = [];
    if (signals.demand >= 70) drivers.push("High marketplace demand spike");
    if (signals.competition >= 70) drivers.push("Low saturation gap");
    if (signals.priceStability >= 70) drivers.push("Price corridor stability");
    if (signals.profitMargin >= 70) drivers.push("Strong margin potential");

    if (score >= 80) return drivers.slice(0, 2).join(" + ") + " = high selling probability";
    if (score < 40) return "Oversaturated market with low margin potential";
    return drivers.length > 0 ? drivers[0] + " detected" : "Market neutral signals";
  }

  /**
   * DUPLICATE GUARD
   */
  isCoolingDown(productId) {
    const raw = localStorage.getItem(this.COOLDOWN_KEY);
    const registry = raw ? JSON.parse(raw) : {};
    const lastProcessed = registry[productId];
    if (!lastProcessed) return false;
    return (Date.now() - lastProcessed) / (1000 * 60 * 60) < 24;
  }

  markProcessed(productId) {
    const raw = localStorage.getItem(this.COOLDOWN_KEY);
    const registry = raw ? JSON.parse(raw) : {};
    registry[productId] = Date.now();
    localStorage.setItem(this.COOLDOWN_KEY, JSON.stringify(registry));
  }
}

export default new SourcingService();
