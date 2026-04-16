import ebayService from './ebay';

/**
 * Unified Sourcing & Market Intelligence (v9.0)
 * Dual-Stage Engine: Discovery (Stage 1) & Sourcing (Stage 2).
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
   * Stage 1: Market Intelligence (eBay-side)
   * Deterministic sell score based on market batch context.
   */
  calculateSellScore(product, batchContext = {}) {
    const { avgPrice = 50, stdDev = 10 } = batchContext;
    const price = Number(product.price) || 0;
    
    // 1. Scoring Logic
    let resellScore = 50;
    
    // Price Competitiveness Component
    if (price > 0) {
      if (price < avgPrice - (stdDev * 0.5)) resellScore += 20; 
      else if (price < avgPrice) resellScore += 10;
      else if (price > avgPrice + stdDev) resellScore -= 15;
    }

    // Velocity & Volume Component
    const soldCount = Number(product.soldCount || 0);
    if (soldCount > 50) resellScore += 15;
    else if (soldCount > 10) resellScore += 5;

    // Saturation Component
    const totalFound = Number(product.totalFound || 0);
    if (totalFound < 300) resellScore += 10;
    else if (totalFound > 1000) resellScore -= 10;

    resellScore = Math.min(100, Math.max(0, resellScore));

    // 2. Confidence Level
    let confidence = 'Medium';
    if (resellScore >= 80) confidence = 'High';
    if (resellScore < 40) confidence = 'Low';

    // 3. Momentum Generation (Simulated for Visuals based on Score)
    const momentum = Array.from({ length: 14 }, (_, i) => ({
      x: i,
      y: Math.min(100, Math.max(10, Math.floor(resellScore * (0.8 + Math.random() * 0.4))))
    }));

    // 4. Status Mapping
    let status = 'CONSIDERING';
    if (resellScore >= 80) status = 'TOP PICK';
    else if (resellScore >= 60) status = 'TRENDING';

    const profitLevel = resellScore >= 70 ? 'High' : (resellScore >= 40 ? 'Medium' : 'Low');

    return {
      resellScore,
      confidence,
      summary: this._getHumanizedMarketSummary(resellScore),
      momentum,
      status,
      profitLevel,
      color: resellScore >= 70 ? "#10b981" : "#f59e0b",
      isWinner: resellScore >= 80
    };
  }

  _getHumanizedMarketSummary(score) {
    if (score >= 80) return "Strong market momentum. High sales velocity combined with competitive pricing makes this a top candidate for your store.";
    if (score >= 60) return "Moderate opportunity. The product has steady sales history, but competition is active. Success requires optimized marketing.";
    return "Low market alignment. High saturation or weak demand metrics suggest limited profitability unless uniquely positioned.";
  }

  /**
   * Stage 2: Supplier Sourcing Intelligence
   * ROI, Trust, and Opportunity Score.
   */
  calculateROI(ebayPrice, supplierCost, shipping = 0) {
    const cost = Number(supplierCost);
    const ship = Number(shipping);
    const target = Number(ebayPrice);

    if (!cost || cost <= 0 || !target || target <= 0) return null;

    const totalCost = cost + ship;
    const expected = Math.round(((target - totalCost) / totalCost) * 100);
    const conservative = Math.round(((target - (totalCost * 1.2)) / totalCost) * 100);

    return { expected, conservative };
  }

  evaluateSupplierTrust(product) {
    if (product.source === 'eprolo') {
      return { level: 'High', score: 95, label: "Verified Eprolo Catalog" };
    }
    
    if (product.source === 'aliexpress') {
      const rating = Number(product.rating || 0);
      if (rating === 0) return { level: 'Low', score: 30, label: "No rating available" };
      
      let score = rating >= 4.8 ? 90 : (rating >= 4.5 ? 70 : (rating >= 4.0 ? 50 : 30));
      const level = score >= 80 ? 'High' : (score >= 50 ? 'Medium' : 'Low');
      return { level, score, label: `${rating} / 5` };
    }

    return { level: 'Medium', score: 50, label: "Secondary Source" };
  }

  calculateOpportunityScore(product, targetPrice) {
    const roi = this.calculateROI(targetPrice, product.price, product.shipping || 0);
    const trust = this.evaluateSupplierTrust(product);
    
    let score = 0;
    if (roi) score += (Math.min(Math.max(roi.expected, 0), 100) * 0.6);
    else score -= 20;

    score += (trust.score * 0.4);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Global Search Utilities
   */
  getGlobalSearchUrl(source, query) {
    if (!query) return '#';
    const q = encodeURIComponent(query);
    if (source === 'eprolo') return `https://www.eprolo.com/all-products.html?keyword=${q}`;
    if (source === 'aliexpress') return `https://www.aliexpress.com/wholesale?SearchText=${q}`;
    return '#';
  }

  /**
   * Utilities & Intent Extraction (v10.0)
   */
  detectCategory(title) {
    if (!title) return null;
    const t = title.toLowerCase();
    
    // Categorization Map (Priority Ordered)
    const categories = [
        { id: 'soap', keywords: ['soap', 'cleanser', 'bar', 'wash'] },
        { id: 'jeans', keywords: ['jeans', 'denim', 'pants', 'trousers'] },
        { id: 'shoes', keywords: ['shoes', 'sneakers', 'boots', 'sandals', 'footwear'] },
        { id: 'shirt', keywords: ['shirt', 't-shirt', 'tee', 'top', 'blouse'] },
        { id: 'watch', keywords: ['watch', 'smartwatch', 'chronograph'] },
        { id: 'glasses', keywords: ['glasses', 'sunglasses', 'eyewear'] },
        { id: 'bag', keywords: ['bag', 'backpack', 'handbag', 'purse', 'tote'] },
        { id: 'jewelry', keywords: ['ring', 'necklace', 'bracelet', 'earrings'] },
        { id: 'electronics', keywords: ['phone', 'tablet', 'laptop', 'charger', 'cable'] }
    ];

    for (const cat of categories) {
        if (cat.keywords.some(kw => t.includes(kw))) return cat.id;
    }
    return null;
  }

  extractSearchTiers(title) {
    if (!title) return [];
    const category = this.detectCategory(title);
    const clean = title.replace(/[^\w\s]/gi, ' ').toLowerCase();
    const words = clean.split(/\s+/).filter(w => w.length > 3 && !['with', 'from', 'best', 'sale', 'free', 'shipping'].includes(w));

    const tiers = [];
    
    if (category) {
        // Tier 1: Category + Top 1 Attribute
        const attr1 = words.find(w => w !== category);
        if (attr1) tiers.push(`${attr1} ${category}`);

        // Tier 2: Category + Top 2 Attribute
        const attr2 = words.find(w => w !== category && w !== attr1);
        if (attr2) tiers.push(`${attr2} ${category}`);

        // Tier 3: Category Only
        tiers.push(category);
    } else {
        // Fallback for unknown categories: Slice strategy
        tiers.push(words.slice(0, 2).join(' '));
        tiers.push(words.slice(0, 3).join(' '));
    }

    // Dedupe and limit
    return [...new Set(tiers)].filter(Boolean).slice(0, 3);
  }

  /**
   * Pipeline Orchestration Logic (Iterative Search)
   */
  createContext(query, targetProduct) {
    const tiers = this.extractSearchTiers(query);
    return {
      query: tiers[0] || query,
      originalQuery: query,
      tiers: tiers,
      targetPrice: Number(targetProduct?.price) || 0,
      ebayId: targetProduct?.id
    };
  }

  /**
   * Iterative Pipeline Orchestrator
   * Runs through search tiers until inventory is discovered.
   */
  async runIterativePipeline(context, fetchers) {
    const { query, tiers } = context;
    const searchSequence = tiers.length > 0 ? tiers : [query];
    
    let finalResult = {
        status: 'EMPTY',
        sources: { eprolo: 'PENDING', aliexpress: 'PENDING' },
        telemetry: { eprolo: null, aliexpress: null },
        data: [],
        successfulTier: null
    };

    console.log(`[Iterative Search] Starting tiers:`, searchSequence);

    for (const tierQuery of searchSequence) {
        console.log(`[Iterative Search] Attempting Tier: "${tierQuery}"`);
        
        const result = await this.runUnifiedPipeline({ query: tierQuery, targetPrice: context.targetPrice }, fetchers(tierQuery));
        
        // Merge telemetry
        finalResult.telemetry = { ...finalResult.telemetry, ...result.telemetry };
        finalResult.sources = { ...finalResult.sources, ...result.sources };

        if (result.data.length > 0) {
            finalResult = {
                ...finalResult,
                status: result.status,
                data: result.data,
                successfulTier: tierQuery,
                isFallback: tierQuery === tiers[tiers.length - 1] && tiers.length > 1
            };
            break; 
        }

        // If even the last tier fails, check if we had any technical failures
        if (tierQuery === searchSequence[searchSequence.length - 1]) {
            const hasTechFailure = Object.values(result.sources).some(s => ['PARSE_FAILURE', 'BLOCKED_RESPONSE', 'API_ERROR'].includes(s));
            finalResult.status = hasTechFailure ? 'TECHNICAL_FAILURE' : 'BROADER_CATEGORY_REQUIRED';
        }
    }

    return finalResult;
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
      eprolo: eproloRes.status === 'fulfilled' ? (eproloRes.value.status || 'OK') : 'FAILED',
      aliexpress: aliRes.status === 'fulfilled' ? (aliRes.value.status || 'OK') : 'FAILED'
    };

    const telemetry = {
      eprolo: eproloRes.status === 'fulfilled' ? eproloRes.value.debugInfo : null,
      aliexpress: aliRes.status === 'fulfilled' ? aliRes.value.debugInfo : null
    };

    let status = this.Status.COMPLETE;
    if (Object.values(sources).some(s => s === 'FAILED' || s === 'BLOCKED' || s === 'BLOCKED_RESPONSE' || s === 'PARSE_FAILURE')) status = this.Status.PARTIAL;
    if (Object.values(sources).every(s => s === 'FAILED' || s === 'BLOCKED' || s === 'BLOCKED_RESPONSE' || s === 'PARSE_FAILURE')) status = 'SYSTEM_DOWN';

    const rawData = [
      ...(eproloRes.status === 'fulfilled' ? (eproloRes.value.data || []) : []),
      ...(aliRes.status === 'fulfilled' ? (aliRes.value.data || []) : [])
    ];

    return {
      status,
      sources,
      telemetry,
      data: this.dedupe(rawData)
    };
  }

  async safeFetch(fn, label) {
    return Promise.race([
      (async () => {
        try { return await fn(); } 
        catch (e) { throw (e instanceof Error) ? e : new Error(String(e)); }
      })(),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), 8000))
    ]);
  }

  /**
   * Legacy Ranking (Maintain support for Revision flow)
   */
  rankProduct(product) {
    return this.calculateSellScore(product, { avgPrice: product.price || 50 });
  }

  /**
   * Utilities
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
