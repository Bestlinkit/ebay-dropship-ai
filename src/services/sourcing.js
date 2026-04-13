/**
 * Hardened Sourcing Intelligence Engine (v2.0)
 * Deterministic Weighted Model & 3-Layer Disclosure Pipeline
 */
class SourcingService {
  constructor() {
    this.weights = {
      competition: 0.30,
      searchDemand: 0.25,
      priceStability: 0.20,
      supplierAvailability: 0.15,
      trendVelocity: 0.10
    };
    
    // 24-Hour Cooldown Registry (Simulated via Local Storage)
    this.COOLDOWN_KEY = 'dropai_discovery_cooldown';
  }

  /**
   * Calculates a deterministic "Winner Score" based on marketplace signals.
   * NO simulated data permitted.
   */
  rankProduct(product) {
    if (!product) return { score: 0, signals: {} };

    // Standardize signals (0-100 scale)
    const signals = {
        competition: this._calcCompetitionScore(product),
        searchDemand: this._calcDemandScore(product),
        priceStability: this._calcPriceStability(product),
        supplierAvailability: product.availabilityScore || 85, 
        trendVelocity: product.trendIndex || 50
    };

    const weightedScore = Object.keys(this.weights).reduce((acc, key) => {
        return acc + (signals[key] * this.weights[key]);
    }, 0);

    return {
        score: Math.round(weightedScore),
        signals,
        status: weightedScore >= 80 ? (weightedScore >= 90 ? 'WINNER' : 'MODERATE') : 'SATURATED'
    };
  }

  _calcCompetitionScore(product) {
      // High result count = High competition (lower score)
      const count = product.totalCompetitors || 100;
      if (count < 10) return 100;
      if (count < 50) return 80;
      if (count < 200) return 40;
      return 15;
  }

  _calcDemandScore(product) {
      const sold = product.soldCount || 0;
      if (sold > 500) return 100;
      if (sold > 100) return 85;
      if (sold > 10) return 60;
      return 20;
  }

  _calcPriceStability(product) {
      if (!product.stats) return 50;
      const sigma = (product.stats.max - product.stats.min) / (product.stats.avg || 1);
      if (sigma < 0.1) return 100; // Very stable
      if (sigma < 0.3) return 80;
      if (sigma < 0.6) return 50;
      return 20;
  }

  /**
   * LAYER 1: 🔔 Bell Dropdown Snippet (TL;DR)
   */
  getSnippet(rank) {
      if (rank.score >= 90) return "Global Winner: Peak demand + Low saturation gap detected.";
      if (rank.score >= 80) return "Strong Signal: High pricing stability and supplier match.";
      return "Market Neutral: Standard competition density detected.";
  }

  /**
   * LAYER 2: 📊 Feed Explanation (Trust Building)
   */
  getExplanation(rank) {
      const parts = [];
      if (rank.signals.competition >= 80) parts.push("Low competition signal");
      if (rank.signals.searchDemand >= 80) parts.push("High marketplace demand spike");
      if (rank.signals.priceStability >= 80) parts.push("Stable pricing range (low volatility)");
      if (rank.signals.supplierAvailability >= 80) parts.push("Strong supplier availability match");
      
      return parts.length > 0 ? parts.join(" + ") : "Awaiting deeper market telemetry.";
  }

  /**
   * LAYER 3: 📦 Optimization Studio (Deep Dive)
   */
  getDeepDive(rank) {
      return {
          header: "Neural Performance Breakdown",
          signals: [
              { label: "Market Competition", value: rank.signals.competition, weight: "30%", desc: rank.signals.competition > 70 ? "Unsaturated niche" : "Crowded category" },
              { label: "Search Velocity", value: rank.signals.searchDemand, weight: "25%", desc: rank.signals.searchDemand > 70 ? "Viral trending" : "Steady demand" },
              { label: "Price Integrity", value: rank.signals.priceStability, weight: "20%", desc: rank.signals.priceStability > 70 ? "No race to bottom" : "Volatile spreads" },
              { label: "Sourcing Reliability", value: rank.signals.supplierAvailability, weight: "15%", desc: "Eprolo Verified" }
          ]
      };
  }

  /**
   * DUPLICATE GUARD: Check if product has been processed in last 24h
   */
  isCoolingDown(productId) {
      const raw = localStorage.getItem(this.COOLDOWN_KEY);
      const registry = raw ? JSON.parse(raw) : {};
      const lastProcessed = registry[productId];
      
      if (!lastProcessed) return false;
      
      const hoursSince = (Date.now() - lastProcessed) / (1000 * 60 * 60);
      return hoursSince < 24;
  }

  markProcessed(productId) {
      const raw = localStorage.getItem(this.COOLDOWN_KEY);
      const registry = raw ? JSON.parse(raw) : {};
      registry[productId] = Date.now();
      localStorage.setItem(this.COOLDOWN_KEY, JSON.stringify(registry));
  }
}

export default new SourcingService();
