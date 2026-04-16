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
   * Utilities & Intent Extraction (v11.0)
   */
  detectCategory(title) {
    if (!title) return null;
    const t = title.toLowerCase();
    
    // 🧬 2026 Trend-Aware Categorization Map (Priority Ordered)
    const categories = [
        // High Signal / Tech First
        { id: 'electronics', keywords: ['phone', 'tablet', 'laptop', 'charger', 'cable', 'magnetic', 'wireless', 'earbuds', 'headphone'] },
        // Beauty & Wellness
        { id: 'soap', keywords: ['soap', 'cleanser', 'bar', 'wash', 'turmeric', 'kojic'] },
        { id: 'wellness', keywords: ['therapy', 'massager', 'skincare', 'facial', 'red light'] },
        // Fashion
        { id: 'jeans', keywords: ['jeans', 'denim', 'pants', 'trousers', 'slim fit'] },
        { id: 'shoes', keywords: ['shoes', 'sneakers', 'boots', 'sandals', 'footwear'] },
        { id: 'shirt', keywords: ['shirt', 't-shirt', 'tee', 'top', 'blouse', 'hoodie'] },
        // Home & Auto
        { id: 'home', keywords: ['organizer', 'blender', 'kitchen', 'home', 'storage', 'lamp'] },
        { id: 'auto', keywords: ['car', 'dash cam', 'vacuum', 'safety', 'in-car'] },
        // Pets & Fitness
        { id: 'pets', keywords: ['dog', 'cat', 'pet', 'grooming', 'interactive', 'leash'] },
        { id: 'fitness', keywords: ['yoga', 'jump rope', 'resistance', 'gym', 'workout'] }
    ];

    for (const cat of categories) {
        if (cat.keywords.some(kw => t.includes(kw))) return cat.id;
    }
    return null;
  }

  extractSearchTiers(title) {
    if (!title) return [];
    
    // 1. CLEANING & NOISE REMOVAL
    const t = title.toLowerCase();
    const stopwords = [
        'with', 'from', 'best', 'sale', 'free', 'shipping', '2026', 'new', 'hot', 'top', 
        'rated', 'high', 'quality', 'vibrant', 'limited', 'stock', 'original', 'official',
        'vitamin', 'citrus', 'premium', 'ultra', 'professional', 'heavy', 'duty'
    ];
    
    // Remove punctuation and stopwords
    const clean = t.replace(/[^\w\s]/gi, ' ');
    let words = clean.split(/\s+/).filter(w => w.length > 3 && !stopwords.includes(w));

    const category = this.detectCategory(title);
    const tiers = [];
    
    if (category) {
        // Core Strategy: [Key Attribute] + [Category Object]
        // Filter out the category name itself from the attributes
        const attributes = words.filter(w => !category.includes(w) && !w.includes(category));
        
        // Tier 1: Primary Attribute + Category
        if (attributes.length > 0) {
            tiers.push(`${attributes[0]} ${category}`);
        }

        // Tier 2: Secondary Attributes + Category
        if (attributes.length > 1) {
            tiers.push(`${attributes[0]} ${attributes[1]} ${category}`);
        }

        // Tier 3: Category Only (Broadest)
        tiers.push(category);
    } else {
        // Fallback: Signal-based slicing
        // Group by 2 and 3 high-length words
        if (words.length >= 2) tiers.push(words.slice(0, 2).join(' '));
        if (words.length >= 3) tiers.push(words.slice(0, 3).join(' '));
        if (words.length > 0) tiers.push(words[0]);
    }

    // Dedupe and ensure lowercase
    const finalTiers = [...new Set(tiers.map(s => s.trim().toLowerCase()))].filter(Boolean);
    
    console.log(`[Intent Reduction] Tiers Generated:`, finalTiers);
    return finalTiers.slice(0, 3);
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
    const { query, originalQuery } = context;
    
    // v21.0: If extension is active, we bypass tiers and use the full original title
    // This prevents the "soap" override bug.
    const searchSequence = originalQuery ? [originalQuery] : [query];
    
    let finalResult = {
        status: 'EMPTY',
        sources: { eprolo: 'PENDING', aliexpress: 'PENDING' },
        telemetry: { eprolo: null, aliexpress: null },
        products: [],
        successfulTier: null
    };

    console.log(`[Iterative Search] v21.0 Mode: Using Full Query -> "${searchSequence[0]}"`);

    for (const tierQuery of searchSequence) {
        const result = await this.runUnifiedPipeline({ query: tierQuery, targetPrice: context.targetPrice }, fetchers(tierQuery));
        
        finalResult.telemetry = { ...finalResult.telemetry, ...result.telemetry };
        finalResult.sources = { ...finalResult.sources, ...result.sources };

        if (result.products.length > 0) {
            finalResult = {
                ...finalResult,
                status: result.status,
                products: result.products,
                successfulTier: tierQuery
            };
            break; 
        }

        if (tierQuery === searchSequence[searchSequence.length - 1]) {
            const hasTechFailure = Object.values(result.sources).some(s => ['PARSE_FAILURE', 'PARSER_FAILURE', 'EMPTY_LISTING', 'WRONG_PAGE_TYPE'].includes(s));
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
    if (Object.values(sources).some(s => s !== 'SUCCESS' && s !== 'OK')) status = this.Status.PARTIAL;

    const rawProducts = [
      ...(eproloRes.status === 'fulfilled' ? (eproloRes.value.products || []) : []),
      ...(aliRes.status === 'fulfilled' ? (aliRes.value.products || []) : [])
    ];

    return {
      status,
      sources,
      telemetry,
      products: this.dedupe(rawProducts)
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
