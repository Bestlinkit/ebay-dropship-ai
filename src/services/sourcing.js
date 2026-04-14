import ebayService from './ebay';

/**
 * eBay Profit Decision Engine (v4.0)
 * Stage II: Intelligence Due Diligence & Risk Calculation
 */
class SourcingService {
  constructor() {
    this.weights = {
      demand: 0.35,        // Prioritized revenue velocity
      competition: 0.20,
      priceStability: 0.10,
      profitMargin: 0.25,   // Prioritized net yield
      trend: 0.10
    };
  }

  /**
   * Calculates the 'Sell Score' (Formerly OPS)
   * High-integrity decision metric prioritizing sellability and profit.
   */
  calculateSellScore(product, supplierCost = null) {
    if (!product) return { score: 0, labels: { demand: 'Low', competition: 'High', profit: 'Low', trend: 'Stable' } };

    const signals = {
      demand: this._calcDemandScore(product),
      competition: this._calcCompetitionScore(product),
      priceStability: this._calcPriceStability(product),
      profitMargin: supplierCost ? this._calcProfitScore(product.price, supplierCost) : 65, 
      trend: product.trendIndex || 50
    };

    const weightedScore = Object.keys(this.weights).reduce((acc, key) => {
      return acc + (signals[key] * this.weights[key]);
    }, 0);

    const score = Math.round(weightedScore);
    const risk = this.calculateRisk(score);

    return {
      score,
      risk,
      labels: {
        demand: this._getLabel(signals.demand, ['Low', 'Medium', 'High']),
        competition: this._getLabel(signals.competition, ['High', 'Medium', 'Low']),
        profit: this._getLabel(signals.profitMargin, ['Low', 'Medium', 'High']),
        trend: this._getLabel(signals.trend, ['Declining', 'Stable', 'Rising'])
      },
      status: this._getStatus(score),
      color: this._getColor(score),
      summary: this.getAIIntelligenceSummary(score, signals, product)
    };
  }

  /**
   * Investment Risk Classification
   */
  calculateRisk(score) {
    if (score >= 80) return { label: 'Low Risk', level: 'Low', color: '#22C55E' };
    if (score >= 55) return { label: 'Medium Risk', level: 'Medium', color: '#FBBF24' };
    return { label: 'High Risk', level: 'High', color: '#EF4444' };
  }

  /**
   * Deterministic Decision Layer (AI Broadcast)
   */
  getAIIntelligenceSummary(score, signals, product) {
    const targetPrice = (product.price * 0.9).toFixed(2);
    
    if (score >= 80) {
      return `High marketplace demand paired with low saturation. Strong potential for resale if sourced below $${targetPrice}. Market winner protocol active.`;
    }
    if (score >= 50) {
      return `Balanced market signals. Performance depends on supplier agility and pricing precision. Recommended for moderate inventory depth.`;
    }
    return `Oversaturated competitive node with yield degradation. High risk of idle inventory. Suggest skipping or alternative category node exploration.`;
  }

  _getStatus(score) {
    if (score >= 80) return 'TOP PICK';
    if (score >= 50) return 'GOOD OPPORTUNITY';
    return 'LOW VALUE';
  }

  _getColor(score) {
    if (score >= 80) return '#22C55E';
    if (score >= 50) return '#FBBF24';
    return '#EF4444';
  }

  _getLabel(value, labels) {
    if (value >= 70) return labels[2];
    if (value >= 40) return labels[1];
    return labels[0];
  }

  _calcDemandScore(product) {
    const sold = product.soldCount || 0;
    if (sold > 120) return 95;
    if (sold > 60) return 80;
    if (sold > 15) return 55;
    return 35;
  }

  _calcCompetitionScore(product) {
    const count = product.totalFound || 1000;
    if (count < 100) return 95;
    if (count < 400) return 75;
    if (count < 1500) return 45;
    return 25;
  }

  _calcPriceStability(product) {
    if (!product.priceRange) return 65;
    const { min, max, avg } = product.priceRange;
    const spread = (max - min) / (avg || 1);
    if (spread < 0.12) return 95;
    if (spread < 0.45) return 65;
    return 35;
  }

  _calcProfitScore(marketPrice, supplierCost) {
    const margin = (marketPrice - supplierCost) / marketPrice;
    if (margin > 0.45) return 98;
    if (margin > 0.30) return 85;
    if (margin > 0.15) return 60;
    return 30;
  }

  getPricingIntelligence(product, supplierCost, categoryId = null) {
    if (!supplierCost) return null;
    const fees = ebayService.getCategoryFee(categoryId || product.categoryId);
    const cost = parseFloat(supplierCost);
    const marketAvg = product.price || 50;
    const suggestedPrice = marketAvg * 0.94;
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
      isRecommended: margin >= 0.15
    };
  }
}

export default new SourcingService();
