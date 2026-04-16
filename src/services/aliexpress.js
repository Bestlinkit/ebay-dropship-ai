import { SourcingStatus } from '../constants/sourcing';

/**
 * Stable AliExpress Sourcing Service (v8.0)
 * Implements a strict 2-stage flow: Discovery -> Mandatory Enrichment.
 * Uses Node.js backend proxy to bypass CORS and ensure stability.
 */
class AliExpressService {
  constructor() {
    this.apiBase = "http://localhost:3001/api/aliexpress";
  }

  /**
   * STAGE 1: DISCOVERY (Lightweight)
   * Returns only essential discovery data for the search results grid.
   */
  async searchProducts(query) {
    if (!query) return { status: SourcingStatus.EMPTY, data: [] };

    const debugInfo = {
        source: 'AliExpress',
        method: 'JSON_JS_HYBRID',
        responseLength: 0,
        blocksFound: 0,
        status: null
    };

    try {
      const response = await fetch(`${this.apiBase}/search?q=${encodeURIComponent(query)}`);
      debugInfo.httpStatus = response.status;

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const html = await response.text();
      debugInfo.responseLength = html?.length || 0;

      // 1. BLOCKED DETECTION
      const isBlocked = !html || html.length < 2000 || html.includes('captcha') || html.includes('punish') || html.includes('Slide to verify');
      if (isBlocked) {
          return { status: SourcingStatus.BLOCKED_RESPONSE, data: [], debugInfo: { ...debugInfo, status: 'BLOCKED' } };
      }

      const jsonBlocks = this.discoverJSONBlocks(html);
      debugInfo.blocksFound = jsonBlocks.length;

      let rawItems = [];

      for (const block of jsonBlocks) {
          const items = this.deepExtractItems(block);
          if (items.length > 0) rawItems.push(...items);
      }

      // If heavy JSON blocks failed, try lightweight scrapers
      if (rawItems.length < 5) {
          rawItems.push(...this.mineScripts(html));
      }

      const mapped = this.parseDiscovery(rawItems);
      const unique = this.simpleDedupe(mapped);

      // 2. PARSE FAILURE DETECTION (Crucial: HTML is large and has signals, but 0 items)
      const hasProductSignals = html.includes('runParams') || html.includes('initialData') || html.includes('productId');
      if (unique.length === 0 && hasProductSignals) {
          return { status: SourcingStatus.PARSE_FAILURE, data: [], debugInfo: { ...debugInfo, status: 'PARSE_FAILURE' } };
      }

      return {
          status: unique.length > 0 ? SourcingStatus.SUCCESS : SourcingStatus.EMPTY,
          data: unique,
          debugInfo: { ...debugInfo, status: unique.length > 0 ? 'SUCCESS' : 'EMPTY' }
      };

    } catch (e) {
      console.error("AliExpress Discovery Internal Core Fault:", e);
      return { status: SourcingStatus.NETWORK_ERROR, data: [], debugInfo: { ...debugInfo, error: e.message } };
    }
  }

  /**
   * STAGE 2: MANDATORY ENRICHMENT
   * Fetches full product data including gallery, variants, and trust metrics.
   */
  async getProductDetails(productUrl) {
    if (!productUrl || productUrl === '#') return { status: SourcingStatus.API_ERROR, data: null };

    try {
      const response = await fetch(`${this.apiBase}/detail?url=${encodeURIComponent(productUrl)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const html = await response.text();
      const jsonBlocks = this.discoverJSONBlocks(html);
      
      // Look for the product details block (usually the largest one or containing 'productConfig')
      let detailBlock = jsonBlocks.find(b => b.productConfig || b.item || b.skuModule) || jsonBlocks[0];
      
      if (!detailBlock) throw new Error("Could not parse product details");

      const enriched = this.mapDetailedProduct(detailBlock, productUrl);
      
      return {
          status: SourcingStatus.SUCCESS,
          data: enriched
      };

    } catch (e) {
      console.error("AliExpress Enrichment Fault:", e);
      return { status: SourcingStatus.API_ERROR, data: null };
    }
  }

  /**
   * Mappers for Discovery vs Detailed State
   */
  parseDiscovery(rawItems) {
      return rawItems.map(item => {
          const title = item.title || item.productTitle || item.subject || "";
          const price = this.extractDiscoveryPrice(item);
          const image = item.image?.imgUrl || item.product_main_image_url || item.imageUrl || item.image || null;

          if (!title || !image) return null;

          return {
              id: item.productId || item.product_id || `ali_${Math.random().toString(36).substr(2, 9)}`,
              title: title.trim(),
              price: price,
              image: image,
              url: item.productDetailUrl || (item.productId ? `https://www.aliexpress.com/item/${item.productId}.html` : '#'),
              source: 'aliexpress', // STRICT LOWERCASE TAGGING
              status: 'FETCHED' // Needs enrichment
          };
      }).filter(p => p && p.title.length > 10);
  }

  mapDetailedProduct(data, originUrl) {
      const item = data.item || data.productConfig || data;
      const evaluation = data.evaluation || data.feedback || {};
      
      // 🚨 CRITICAL RULE: Trust Metrics Extraction
      const rating = parseFloat(evaluation.starRating || evaluation.avgRating);
      const reviews = parseInt(evaluation.totalCount || evaluation.feedbackCount);

      const variants = this.extractVariants(data);
      const images = this.extractGallery(data);
      const price = this.extractDiscoveryPrice(data);

      return {
          id: item.productId || item.product_id,
          title: item.title || item.subject,
          price: price,
          image: images[0] || null,
          images: images,
          source: 'aliexpress',
          url: originUrl,
          description: this.extractDescription(data),
          variants: variants,
          // Trust Metrics
          rating: !isNaN(rating) ? rating : null,
          reviews: !isNaN(reviews) ? reviews : null,
          sellerRating: data.seller?.storeRating || null,
          ratingDisplay: !isNaN(rating) ? `${rating} / 5` : "No rating available",
          status: 'READY'
      };
  }

  /**
   * Helper Extractors
   */
  extractDiscoveryPrice(item) {
      const priceObj = item.prices?.salePrice || item.prices?.minPrice || item.priceModule?.minAmount || item.price || item.minPrice;
      if (typeof priceObj === 'object') return parseFloat(priceObj.value || priceObj.amount || 0);
      return parseFloat(priceObj) || 0;
  }

  extractVariants(data) {
      const skuModule = data.skuModule || {};
      const skus = skuModule.skuPriceList || [];
      return skus.map(s => ({
          id: s.skuId,
          sku: s.skuIdStr,
          price: parseFloat(s.skuVal?.skuActivityAmount?.value || s.skuVal?.skuAmount?.value || 0),
          stock: s.skuVal?.availQuantity || 0,
          options: (s.skuPropIds || "").split(',').filter(Boolean)
      }));
  }

  extractGallery(data) {
      const imageModule = data.imageModule || {};
      return imageModule.imagePathList || [];
  }

  extractDescription(data) {
      // Descriptions are often in a separate module or property
      return data.descriptionModule?.description || "";
  }

  discoverJSONBlocks(html) {
    const candidates = [];
    const regex = /(?:window\.(?:__SSR_DATA__|runParams|initialData)\s*=\s*)?({[\s\S]{500,500000}})/g; 
    let match;
    while ((match = regex.exec(html)) !== null) {
        let potential = match[1];
        try {
            let balance = 0;
            let endIdx = -1;
            for (let i = 0; i < potential.length; i++) {
                if (potential[i] === '{') balance++;
                else if (potential[i] === '}') balance--;
                if (balance === 0 && i > 0) {
                    endIdx = i + 1;
                    break;
                }
            }
            if (endIdx > 0) {
                candidates.push(JSON.parse(potential.substring(0, endIdx)));
            }
        } catch (e) {}
    }
    return candidates;
  }

  deepExtractItems(data) {
    const results = [];
    const findItems = (obj) => {
        if (!obj) return;
        if (Array.isArray(obj)) {
            if (obj.some(o => o && (o.productId || o.product_id))) {
                results.push(...obj);
                return;
            }
            obj.forEach(findItems);
        } else if (typeof obj === 'object') {
            Object.values(obj).forEach(findItems);
        }
    };
    findItems(data);
    return results;
  }

  mineScripts(html) {
    const rawItems = [];
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        const clusters = match[1].match(/{[^{}]{10,1000}}/g);
        if (clusters) {
            clusters.forEach(cluster => {
                if (cluster.includes("price") || cluster.includes("productId")) {
                    try { rawItems.push(JSON.parse(cluster)); } catch (e) {}
                }
            });
        }
    }
    return rawItems;
  }

  simpleDedupe(products) {
    const seen = new Set();
    return products.filter(p => {
        if (!p.id || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
    });
  }
}

export default new AliExpressService();
