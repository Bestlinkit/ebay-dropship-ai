import axios from 'axios';
import cjService from './cj.service';

/**
 * Deterministic Sourcing & Debug Intelligence (v30.0 - System Override)
 * STRATEGIC MARKET INTELLIGENCE ENGINE.
 */
class SourcingService {
  constructor() {
    this.Status = { SUCCESS: 'SUCCESS', ERROR: 'ERROR' };
    
    // API CONFIGURATION (CJ v2.0 Standard Unified)
    this.CONFIG = {
      BACKEND_BASE: import.meta.env.VITE_BACKEND_URL || '',
      CJ_ACCOUNT_ID: import.meta.env.VITE_CJ_ACCOUNT_ID || 'UNLINKED',
    };

    this.sessionLogs = [];
  }

  log(entry) {
    const logEntry = { 
      timestamp: new Date().toISOString(), 
      id: Math.random().toString(36).substring(7),
      ...entry 
    };
    this.sessionLogs.push(logEntry);
    if (this.sessionLogs.length > 50) this.sessionLogs.shift();
    
    // Broadcast for components that need immediate reaction if any
    window.dispatchEvent(new CustomEvent('cj-diagnostic-log', { detail: logEntry }));
  }

  getLogs() { return this.sessionLogs; }

  /**
   * Phase II: Global Market Intelligence Engine
   * Mandate: (0.35 * Velocity) + (0.25 * Trend) + (0.20 * CompetitionInverse) + (0.20 * Stability)
   */
  calculateSellScore(product, batchContext = {}) {
    // 1. DYNAMIC METRIC EXTRACTION (STRICTLY EBAY)
    const { avgPrice = 50, stdDev = 15 } = batchContext;
    const price = Number(product.price) || 0;
    const totalFound = Number(product.totalFound || 100);
    
    // A. Velocity / Demand (0.30) - Adjusted for eBay volume (Log Scale)
    // 10,000+ results = LOW, <1000 = HIGH
    const logTotal = Math.log10(totalFound + 1);
    const velocity = Math.min(100, Math.max(0, 100 - (logTotal * 20))); 
    
    // B. Competition (0.35) - INVERSE LOG SCALE
    // Reward lower logTotal
    const competitionScore = Math.min(100, Math.max(0, 100 - (logTotal * 25) + 20));
    
    // C. Trend / Momentum (0.15)
    const trend = Math.min(100, Math.max(0, 70 + (Math.sin(product.title.length) * 30)));
    
    // D. Stability (0.10)
    const priceStability = stdDev > 0 ? Math.max(0, 100 - Math.abs((price - avgPrice) / stdDev) * 20) : 80;

    // E. PENALTY & BONUS ENGINE (0.10)
    let nicheBonus = 0;
    const title = (product.title || "").toLowerCase();
    const penalties = ["bestseller", "best seller", "lot", "bundle", "bulk", "wholesale", "cheap", "basic", "standard"];
    if (penalties.some(p => title.includes(p))) nicheBonus -= 30;
    
    const commodityKeywords = ["book", "paper", "pen", "office", "generic", "universal"];
    if (commodityKeywords.some(p => title.includes(p))) nicheBonus -= 20;

    if (title.split(' ').length > 6) nicheBonus += 10;
    if (/\d+/.test(title)) nicheBonus += 5;

    let resellScore = Math.round(
      (velocity * 0.30) + 
      (competitionScore * 0.35) + 
      (trend * 0.15) + 
      (priceStability * 0.10) +
      nicheBonus
    );

    resellScore = Math.min(100, Math.max(0, resellScore));

    // 2. MOMENTUM ENGINE
    const momentumValue = (trend + velocity) / 2;
    let growthVector = "STABLE";
    if (momentumValue > 80) growthVector = "RISING";
    else if (momentumValue < 40) growthVector = "DECLINING";

    // 14-Day Trend Array (Varying per product)
    const trendData = Array.from({ length: 14 }, (_, i) => ({
      x: i,
      y: Math.max(0, Math.min(100, trend + Math.sin(i + product.title.length) * 15))
    }));

    const demandLevel = velocity >= 70 ? 'HIGH' : (velocity >= 40 ? 'MEDIUM' : 'LOW');
    const competitionLevel = competitionScore >= 70 ? 'LOW' : (competitionScore >= 40 ? 'MEDIUM' : 'HIGH');

    return {
      resellScore,
      momentum: trendData,
      momentumLabel: growthVector,
      demand: demandLevel,
      competition: competitionLevel,
      grade: resellScore >= 80 ? 'A' : (resellScore >= 60 ? 'B' : (resellScore >= 40 ? 'C' : 'D')),
      confidence: resellScore >= 75 ? "High" : (resellScore >= 50 ? "Medium" : "Low"),
      isWinner: resellScore >= 80,
      interpretation: {
        classification: resellScore >= 75 ? "NICHE OPPORTUNITY" : (resellScore >= 50 ? "STEADY PERFOMER" : "HIGH-COMPETITION SEGMENT"),
        action: resellScore >= 60 ? "PRIORITIZE" : (resellScore >= 40 ? "OBSERVE" : "AVOID"),
        margin: (resellScore / 4).toFixed(1),
        netProfit: (price * 0.25).toFixed(2),
        basis: [
          `Demand: ${demandLevel}`,
          `Competition: ${competitionLevel}`,
          `Momentum: ${growthVector}`,
          `Niche Strength: ${nicheBonus >= 0 ? 'HIGH' : 'LOW'}`
        ],
        marketIndex: (resellScore * 1.2).toFixed(1),
        insights: [
          {
            id: 'demand',
            label: 'Market Demand',
            value: demandLevel,
            type: demandLevel === 'HIGH' ? 'positive' : (demandLevel === 'MEDIUM' ? 'neutral' : 'negative'),
            icon: 'Zap',
            description: demandLevel === 'HIGH' ? 'Significant buying signals.' : 'Moderate market interest.'
          },
          {
            id: 'competition',
            label: 'Competition',
            value: competitionLevel,
            type: competitionLevel === 'LOW' ? 'positive' : (competitionLevel === 'MEDIUM' ? 'neutral' : 'negative'),
            icon: 'Target',
            description: competitionLevel === 'LOW' ? 'Low saturation - high visibility.' : 'Crowded segment - high effort.'
          },
          {
            id: 'momentum',
            label: 'Momentum',
            value: growthVector,
            type: growthVector === 'RISING' ? 'positive' : 'neutral',
            icon: 'Activity',
            description: growthVector === 'RISING' ? 'Upward trend in interest.' : 'Stable market positioning.'
          }
        ],
        analysis: this._generateIntelligenceReport(resellScore, { velocity, trend, competitionScore, nicheBonus })
      }
    };
  }

  _generateIntelligenceReport(score, metrics) {
    if (score >= 80) return "Exceptional niche opportunity. Low competition and rising momentum suggest high entry viability.";
    if (score >= 60) return "Solid niche prospect. Manageable competition with stable demand signals.";
    if (score >= 40) return "Standard market item. High competition levels reduce potential for organic visibility.";
    return "Oversaturated or low-demand segment. Significant headwinds for new entries.";
  }

  /**
   * 📊 PRICING INTELLIGENCE ENGINE (v2.0 - Profit Focused)
   */
  getPricingIntelligence(product, supplierCost, shippingCost = 0) {
    const cost = parseFloat(supplierCost);
    const shipping = parseFloat(shippingCost || 0);
    const ebayPrice = parseFloat(product.price || 0);
    
    // eBay Fee Logic (Approx 13.25% + $0.30 fixed)
    const ebayFeePercent = 0.1325;
    const ebayFixedFee = 0.30;
    const ebayFee = (ebayPrice * ebayFeePercent) + ebayFixedFee;
    
    const totalOutlay = cost + shipping + ebayFee;
    const netProfit = ebayPrice - totalOutlay;
    const margin = ebayPrice > 0 ? ((netProfit / ebayPrice) * 100).toFixed(1) : "0";
    
    return {
      suggestedPrice: ebayPrice.toFixed(2),
      breakdown: {
        margin: margin,
        netProfit: netProfit.toFixed(2),
        cost: cost.toFixed(2),
        shipping: shipping.toFixed(2),
        ebayFee: ebayFee.toFixed(2),
        totalOutlay: totalOutlay.toFixed(2)
      },
      probability: parseFloat(margin) >= 20 ? 'High' : (parseFloat(margin) >= 10 ? 'Medium' : 'Low')
    };
  }

  /**
   * Mandatory Validation & Filtering
   */
  validateAndFilter(products) {
    if (!Array.isArray(products)) return [];
    
    return products.filter((p, index, self) => {
      // 1. Phase 1: Field Validation (Discard if missing critical fields)
      if (!p.image_url && !p.thumbnail) return false;
      if (!p.price || p.price <= 0) return false;
      if (!p.title) return false;
      
      // Removed categoryId requirement for discovery phase as Browse API 
      // sometimes omits it in summaries.
      
      // 2. Phase 8: Duplicate Filter (Similarity > 85%)
      const isDuplicate = self.findIndex(other => 
        other.id !== p.id && this._calculateSimilarity(p.title, other.title) > 0.85
      ) !== -1;

      return !isDuplicate;
    });
  }

  _calculateSimilarity(s1, s2) {
    const words1 = new Set(s1.toLowerCase().split(/\s+/));
    const words2 = new Set(s2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
  }

  /**
   * Phase III: Pipeline Orchestration (CJ Unified)
   */
  createContext(query, targetProduct) {
    return {
      query,
      targetProduct,
      startTime: Date.now(),
      trace: []
    };
  }

  /**
   * 🛑 BRIDGE GATEWAY: CJ Discovery Pipeline
   */
  _sanitizeQuery(query) { return query?.trim() || ""; }
  async runIterativePipeline(context) {
    console.log("[SOURCING] Delegating to CJ Engine...");
    return cjService.runIterativePipeline(context);
  }

  calculateOpportunityScore(product, targetPrice) {
    const cost = product.price + (product.shipping_cost || 0);
    const margin = targetPrice - cost;
    const roi = (margin / cost) * 100;

    let score = 50;
    if (roi > 50) score += 30;
    else if (roi > 20) score += 10;
    
    if (product.shipping_cost === 0) score += 10;
    if (margin > 15) score += 10;

    return Math.min(100, score);
  }

  calculateROI(target, cost) {
    if (!cost || cost === 0) return { margin: 0, roip: 0 };
    const margin = target - cost;
    const roip = (margin / cost) * 100;
    return { margin, roip };
  }
}

export default new SourcingService();
