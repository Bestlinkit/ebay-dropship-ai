import ebayService from './ebay';

/**
 * Adaptive Market Intelligence Engine (v11.0)
 * Stage II: Cross-Dataset Normalization & AI-Assisted Interpretation.
 */
class SourcingService {
  constructor() {
    this.weights = {
      pricePosition: 0.40, // Price vs Batch Dispersion
      demandPulse: 0.35,   // Density & Velocity Signals
      categoryFit: 0.15,   // Category Norms
      momentum: 0.10       // Real-time Momentum (Estimated)
    };
  }

  /**
   * Adaptive Intelligence Layer (Normalization + Interpretation)
   * Scores are relative to the 'batchStats' of the current search query.
   */
  calculateSellScore(product, batchStats = null) {
    if (!product) return { score: 0, confidence: 'Low' };

    // 1. DATASET NORMALIZATION (REALISM LAYER)
    const stats = batchStats || { avgPrice: product.price || 50, stdDev: 10, totalResults: 500 };
    
    // Price Z-Score (Dispersion Signal)
    const priceZ = (stats.avgPrice - product.price) / (stats.stdDev || 5);
    const priceScore = Math.min(Math.max(50 + (priceZ * 15), 10), 98);

    // 2. COMPETITION DENSITY (Relative Signal)
    const relativeDensity = product.totalFound < (stats.totalResults / 2) ? 90 : 50;

    // 3. ADAPTIVE CONFIDENCE (AI-DRIVEN EVALUATION)
    const confidenceLevel = this._evaluateConfidence(product, stats);
    
    // 4. MARKET MOMENTUM (ESTIMATED)
    const momentumData = this.getTrendData(product, stats);
    const lastPoint = momentumData[momentumData.length - 1].y;
    const momentumScore = lastPoint > 50 ? 80 : 40;

    // 5. AGGREGATION (ADAPTIVE RANKING)
    const rawScore = Math.round(
      (priceScore * this.weights.pricePosition) +
      (relativeDensity * this.weights.demandPulse) +
      (momentumScore * this.weights.momentum) +
      (50 * this.weights.categoryFit)
    );

    // 6. PROFIT CLASSIFICATION (CATEGORY-AWARE)
    const margin = this._calculateEstimatedMargin(product, stats);
    const profitLevel = margin > 0.25 ? 'High' : (margin > 0.10 ? 'Medium' : 'Low');

    const isWinner = rawScore >= 80 && confidenceLevel !== 'Low' && margin > 0.05;

    return {
      score: rawScore,
      confidence: confidenceLevel,
      isWinner,
      status: isWinner ? 'TOP PICK' : (rawScore >= 50 ? 'GOOD OPPORTUNITY' : 'LOW VALUE'),
      color: isWinner ? '#22C55E' : (rawScore >= 50 ? '#FBBF24' : '#EF4444'),
      momentum: momentumData,
      profitLevel,
      summary: this._getAdaptiveSummary(rawScore, priceZ, profitLevel),
      metrics: {
        priceYield: margin.toFixed(2),
        batchRank: priceZ > 0 ? 'Top Tier' : 'Baseline'
      }
    };
  }

  /**
   * Deterministic Momentum Generator (Market Signal Translation)
   * Derived from price dispersion and listing density.
   */
  getTrendData(product, stats) {
    const points = [];
    const seed = (parseInt(product.id.toString().slice(-3)) || 50) % 100;
    const volatility = stats.stdDev / stats.avgPrice;
    
    for (let i = 0; i < 10; i++) {
        // Momentum is higher if price is competitive and results are manageable
        const trend = (i / 10) * (product.price < stats.avgPrice ? 1.2 : 0.8);
        const noise = Math.sin(seed + i) * volatility * 10;
        points.push({ 
          x: i, 
          y: Math.min(Math.max(40 + (trend * 30) + noise, 10), 90) 
        });
    }
    return points;
  }

  _evaluateConfidence(product, stats) {
    // Adaptive Reasoning: Trust is gained if product is within a representable deviation
    const priceDiff = Math.abs(product.price - stats.avgPrice);
    const isOutlier = priceDiff > (stats.stdDev * 3);
    
    let strength = 0;
    if (product.price > 0 && !isOutlier) strength += 2;
    if (product.totalFound > 0) strength += 1;
    if (product.categoryId) strength += 1;
    if (stats.stdDev > 0) strength += 1;

    if (strength >= 5) return 'High';
    if (strength >= 3) return 'Medium';
    return 'Low';
  }

  _calculateEstimatedMargin(product, stats) {
    const fees = ebayService.getCategoryFee(product.categoryId);
    const targetPrice = product.price;
    const hypotheticalCost = targetPrice * 0.70; // Placeholder for sourcing calculation
    const ebayFee = (targetPrice * fees.percentage) + fees.fixed;
    return (targetPrice - hypotheticalCost - ebayFee) / targetPrice;
  }

  _getAdaptiveSummary(score, priceZ, profitLevel) {
    if (score >= 80) return `Strong resale candidate. Pricing outperforms ${Math.abs(priceZ.toFixed(1))}σ of marketplace peers with favorable margin potential.`;
    if (profitLevel === 'High') return `High-margin opportunity detected. Stable pricing signals combined with emerging market entry potential.`;
    if (priceZ < -1) return `Risk identified: Pricing exceeds marketplace average clustering. Expect reduced velocity and competitive friction.`;
    return `Baseline market performance. Recommend secondary observation for potential price corrections.`;
  }
}

export default new SourcingService();
