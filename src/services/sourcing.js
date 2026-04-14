import ebayService from './ebay';

/**
 * Real Market Intelligence Engine (v5.0)
 * Stage II: Context-Aware Due Diligence & Predicted Yield
 */
class SourcingService {
  constructor() {
    this.weights = {
      demand: 0.40,        // Revenue velocity
      yield: 0.30,         // Price vs Batch Average
      competition: 0.20,   // Density gap
      trend: 0.10          // Trend direction
    };
  }

  /**
   * Calculates the 'Sell Score' (Context-Aware)
   * Deterministic metrics relative to the current marketplace batch.
   */
  calculateSellScore(product, batchContext = null) {
    if (!product) return { score: 0, confidence: 'Low' };

    // Batch Signals (Calculated in UI/Discovery before render)
    const context = batchContext || { avgPrice: product.price || 50, totalResults: 500 };
    
    // 1. PRICE YIELD SIGNAL (Real market delta)
    const priceDelta = (context.avgPrice - product.price) / (context.avgPrice || 1);
    const yieldScore = Math.min(Math.max(50 + (priceDelta * 100), 10), 98);

    // 2. COMPETITION DENSITY (Real search density)
    const densityScore = product.totalFound < 300 ? 90 : (product.totalFound < 1000 ? 60 : 35);

    // 3. DEMAND PULSE (Product specific metadata)
    const demandScore = product.soldCount > 0 ? 85 : 50;

    // 4. SIGNAL AGGREGATION (Pure Market Data)
    const weightedScore = Math.round(
      (demandScore * this.weights.demand) +
      (yieldScore * this.weights.yield) +
      (densityScore * this.weights.competition) +
      (50 * this.weights.trend) // Neutral fallback for trend
    );

    // 5. DETERMINISTIC CONFIDENCE LAYER
    const confidence = this._calculateConfidence(product, context);
    
    // 6. MULTI-FACTOR WINNER VALIDATION
    const isWinner = weightedScore >= 80 && confidence !== 'Low' && priceDelta > -0.15;

    return {
      score: weightedScore,
      confidence,
      isWinner,
      status: isWinner ? 'TOP PICK' : (weightedScore >= 50 ? 'GOOD OPPORTUNITY' : 'LOW VALUE'),
      color: isWinner ? '#22C55E' : (weightedScore >= 50 ? '#FBBF24' : '#EF4444'),
      summary: this.getAIIntelligenceSummary(weightedScore, { yield: yieldScore, density: densityScore, demand: demandScore }, product, context),
      metrics: {
        priceYield: priceDelta.toFixed(2),
        density: product.totalFound
      }
    };
  }

  /**
   * AI-Driven Intelligence Review (Real Context)
   */
  getAIIntelligenceSummary(score, signals, product, context) {
    const priceDiff = ((product.price / context.avgPrice - 1) * 100).toFixed(1);
    const sign = priceDiff > 0 ? "higher" : "lower";
    
    if (score >= 80) {
      return `Targeted arbitrage opportunity identified. Pricing is ${Math.abs(priceDiff)}% ${sign} than marketplace average with high demand velocity.`;
    }
    if (signals.density < 40) {
      return `Oversaturated competitive environment. Margin degradation expected due to high listing density in this category.`;
    }
    return `Passive market performance. Stable pricing detected, but lacks high-velocity demand signals. Suggested as a secondary inventory node.`;
  }

  _calculateConfidence(product, context) {
    let signals = 0;
    if (product.price > 0) signals++;
    if (product.totalFound > 0) signals++;
    if (product.categoryId) signals++;
    if (context.avgPrice > 0) signals++;

    if (signals >= 4) return 'High';
    if (signals >= 2) return 'Medium';
    return 'Low';
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
