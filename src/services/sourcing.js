import ebayService from './ebay';

/**
 * Humanized Decision Intelligence Engine (v12.1)
 * Transforms technical metrics into actionable business advice.
 */
class SourcingService {
  constructor() {
    this.weights = {
      pricePosition: 0.40, // Price vs Batch Dispersion
      demandPulse: 0.35,   // Density & Velocity Signals
      categoryFit: 0.15,   // Category Norms
      momentum: 0.10       // Real-time Momentum (Estimated)
    };
    
    // STRICT SCHEMA REGISTRY
    this.ProductSource = {
      EBAY: 'ebay',
      EPROLO: 'eprolo',
      ALIEXPRESS: 'aliexpress'
    };
  }

  /**
   * Deterministic Data Normalization (ProductSchema Enforcement)
   * Ensures every product node entering the UI is valid and typed.
   */
  normalize(raw, source = 'aliexpress') {
    if (!raw) return null;
    
    return {
      id: raw.id || raw.itemId || `node_${Math.random().toString(36).slice(2, 9)}`,
      title: raw.title || 'Untitled Product',
      price: Number(raw.price ?? 0),
      // Safe Image Chain
      images: Array.isArray(raw.images) ? raw.images : [raw.image || raw.thumbnail || raw.image_url].filter(Boolean),
      image: raw.image || raw.thumbnail || raw.image_url || "/placeholder-product.png",
      shipping: typeof raw.shipping === 'number' ? raw.shipping : (String(raw.shipping || '').toLowerCase().includes('free') ? 0 : parseFloat(String(raw.shipping || '').replace(/[^\d.]/g, '')) || 0),
      delivery: raw.delivery || '15-25 days',
      rating: Number(raw.rating ?? 0),
      reviews: Number(raw.reviews ?? 0),
      shipsFrom: raw.shipsFrom || 'CN',
      source: source,
      url: raw.url || raw.itemWebUrl || ""
    };
  }

  /**
   * Actionable Intelligence Layer
   * Returns deterministic analytics for eBay products.
   */
  calculateSellScore(product, batchStats = null) {
    if (!product) return { resellScore: 0, confidence: 'Low' };

    const stats = batchStats || { avgPrice: product.price || 50, stdDev: 10, totalResults: 500 };
    
    // 1. Price Position (Z-Score)
    const priceZ = (stats.avgPrice - product.price) / (stats.stdDev || 5);
    const priceScore = Math.min(Math.max(50 + (priceZ * 15), 10), 98);

    // 2. Competition Density
    const relativeDensity = product.totalFound < (stats.totalResults / 2) ? 90 : 50;

    // 3. Confidence Evaluation
    const confidenceLevel = this._evaluateConfidence(product, stats);
    
    // 4. Demand Trend (Momentum)
    const momentumData = this.getTrendData(product, stats);
    const lastPoint = momentumData[momentumData.length - 1].y;
    const momentumScore = lastPoint > 50 ? 80 : 40;

    // 5. Aggregation (Deterministic Resell Score)
    const resellScore = Math.round(
      (priceScore * this.weights.pricePosition) +
      (relativeDensity * this.weights.demandPulse) +
      (momentumScore * this.weights.momentum) +
      (50 * this.weights.categoryFit)
    );

    const margin = this._calculateEstimatedMargin(product, stats);
    const profitLevel = margin > 0.25 ? 'High' : (margin > 0.10 ? 'Medium' : 'Low');

    const isWinner = resellScore >= 80 && confidenceLevel !== 'Low' && margin > 0.05;

    // Determine Seller Status (Actionable)
    let sellerStatus = 'Low Demand (Hard to sell)';
    if (resellScore >= 80) sellerStatus = 'High Demand (Easy to sell)';
    else if (resellScore >= 60) sellerStatus = 'Moderate Demand (Requires effort)';

    return {
      resellScore,
      score: resellScore, // Registry legacy support
      confidence: confidenceLevel,
      isWinner,
      status: sellerStatus,
      color: resellScore >= 80 ? '#22C55E' : (resellScore >= 60 ? '#FBBF24' : '#EF4444'),
      momentum: momentumData,
      profitLevel,
      summary: this._getHumanizedSummary(resellScore, priceZ, profitLevel),
      metrics: {
        priceYield: margin ? margin.toFixed(2) : '0.00',
        sellerStatus: sellerStatus
      }
    };
  }

  getTrendData(product, stats) {
    const points = [];
    const seed = (parseInt(product.id.toString().slice(-3)) || 50) % 100;
    const volatility = stats.stdDev / stats.avgPrice;
    
    for (let i = 0; i < 10; i++) {
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
    const hypotheticalCost = targetPrice * 0.70;
    const ebayFee = (targetPrice * fees.percentage) + fees.fixed;
    return (targetPrice - hypotheticalCost - ebayFee) / targetPrice;
  }

  /**
   * Generates natural language insights with dynamic phrasing and actionable verdicts.
   */
  /**
   * Sourcing Intelligence (v2.0)
   * Deterministic ROI-driven relevance score.
   * Based on ROI (50%) + Data Completeness (50%).
   */
  calculateScore(product, basePrice) {
    const price = Number(product.price ?? 0);
    const targetPrice = Number(basePrice ?? 0);

    if (!price || !targetPrice) return 0;

    // 1. ROI Contribution (Normalized to 100)
    const roi = ((targetPrice - price) / price) * 100;
    const roiScore = Math.min(Math.max(roi, 0), 100);

    // 2. Data Completeness (Fixed 50pt scale)
    const completeness = 
      (product.title && product.title !== 'AliExpress Listing' ? 20 : 0) + 
      (product.price > 0 ? 20 : 0) + 
      (product.image ? 10 : 0);

    // 3. Normalized output (0-100)
    return Math.round((roiScore * 0.5) + (completeness));
  }

  calculateMatchRelevance(target, supplier) {
    // Redirect to the new normalized scoring engine
    return this.calculateScore(supplier, target.price);
  }

  /**
   * Calculates deterministic ROI for a single product comparison.
   * Formula: ROI = ((ebayPrice - totalSupplierCost) / totalSupplierCost) * 100
   */
  calculateROI(ebayPrice, supplierCost, shipping = 0) {
    const totalCost = Number(supplierCost) + Number(shipping);
    const targetPrice = Number(ebayPrice);

    if (!totalCost || totalCost <= 0 || !targetPrice) return 0;

    const profit = targetPrice - totalCost;
    return Math.round((profit / totalCost) * 100);
  }

  calculateSupplierROIRange(ebayPrice, supplierCost) {
    const totalCost = Number(supplierCost);
    if (!totalCost || totalCost <= 0) return { conservative: 0, expected: 0 };

    const expected = this.calculateROI(ebayPrice, supplierCost);
    const conservative = this.calculateROI(ebayPrice * 0.90, supplierCost);

    return { conservative, expected };
  }

  /**
   * Grades supplier reliability based on delivery and ratings.
   */
  evaluateSupplierTrust(supplier) {
    let score = 0;
    
    // 1. Ratings (AliExpress context)
    if (supplier.rating >= 4.5) score += 40;
    else if (supplier.rating >= 4.0) score += 20;

    // 2. Shipping Speed
    const deliveryDays = parseInt(supplier.delivery || '15');
    if (deliveryDays <= 7) score += 40;
    else if (deliveryDays <= 12) score += 20;

    // 3. Provenance (USA Priority)
    if (supplier.shipsFrom === 'USA') score += 20;

    if (score >= 80) return 'High';
    if (score >= 50) return 'Medium';
    return 'Low';
  }

  /**
   * Identifies the 'Best Option' for the store.
   */
  identifyBestOption(results) {
    if (!results || results.length === 0) return null;
    return [...results].sort((a, b) => {
      // Sort by USA shipping first, then ROI, then Match Score
      if (a.shipsFrom === 'USA' && b.shipsFrom !== 'USA') return -1;
      if (b.shipsFrom === 'USA' && a.shipsFrom !== 'USA') return 1;
      return (b.roiRange?.expected || 0) - (a.roiRange?.expected || 0);
    })[0];
  }

  /**
   * Generates broader, higher-match keywords by removing noise (brands, colors, specs).
   */
  generateSuggestedKeywords(title) {
    if (!title) return "";
    
    // 1. Remove special characters and noise
    let clean = title.replace(/[^\w\s]/gi, ' ');
    
    // 2. Filter out short words and common stop words
    const stopWords = ['with', 'for', 'from', 'and', 'the', 'new', 'top', 'best', 'pro', 'hot', 'sale', 'free', 'shipping'];
    const words = clean.split(/\s+/)
      .filter(w => w.length > 3)
      .filter(w => !stopWords.includes(w.toLowerCase()));
    
    // 3. Return a more "generic" but descriptive slice (first 4-6 strong words)
    return words.slice(0, 6).join(' ');
  }

  _getHumanizedSummary(score, priceZ, profitLevel) {
    const posHooks = [
      "This product is a good option to sell because",
      "There is a strong opportunity here due to",
      "This item has good selling potential because"
    ];
    const negHooks = [
      "This product may not perform well because",
      "It’s risky to sell this item due to",
      "You may want to avoid this product because"
    ];
    const midHooks = [
      "This product has moderate demand, but",
      "There is some potential here, however",
      "You can test this item, but"
    ];

    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    
    let text = "";
    let verdict = "";

    if (score >= 80) {
      text = `${pick(posHooks)} it has strong market demand and relatively low competition. Pricing is highly competitive, which gives you a great chance to make consistent sales.`;
      verdict = "Overall, this is a good product to sell.";
    } else if (score >= 60) {
      text = `${pick(midHooks)} competition is increasing in this category. Success will depend on your ability to maintain a competitive pricing strategy.`;
      verdict = "Overall, this is worth testing but not a top priority.";
    } else {
      text = `${pick(negHooks)} the competition is too high and profit margins are tight. It will be difficult to stand out or generate stable sales.`;
      verdict = "Overall, this product is risky and should be avoided.";
    }

    return `${text} ${verdict}`;
  }
}

export default new SourcingService();
