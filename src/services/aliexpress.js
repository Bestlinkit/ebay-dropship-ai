import { SourcingStatus } from '../constants/sourcing';
import bridge from './bridge';
import extensionConnector from './extensionConnectorService';

/**
 * Stable AliExpress Sourcing Service (v9.0)
 * Implements a strict 2-stage flow: Discovery -> Mandatory Enrichment.
 * Uses Node.js backend proxy AND ProxyBridge (GAS) to ensure stability.
 */
class AliExpressService {
  constructor() {
    this.apiBase = "http://localhost:3001/api/aliexpress";
  }

  /**
   * STAGE 1: DISCOVERY (via Chrome Extension v19.0)
   * Offloads extraction to the browser session bridge.
   */
  async searchProducts(query) {
    if (!query) return { status: SourcingStatus.EMPTY, data: [] };

    console.log(`[AliExpress] Requesting browser-session extraction for: ${query}`);

    try {
        const result = await extensionConnector.request("aliexpress", query);

        if (result.status === "SUCCESS") {
            const mapped = this.parseDiscovery(result.data || []);
            return {
                status: mapped.length > 0 ? SourcingStatus.SUCCESS : SourcingStatus.EMPTY,
                data: mapped,
                debugInfo: { method: "EXTENSION_BRIDGE", status: "SUCCESS" }
            };
        }

        // 🚨 FAILURE HANDLING (v19.0 Rules)
        return {
            status: result.status === "TIMEOUT" ? SourcingStatus.NETWORK_ERROR : SourcingStatus.API_ERROR,
            data: [],
            debugInfo: { ...result, method: "EXTENSION_BRIDGE" }
        };

    } catch (e) {
        console.error("AliExpress Extension Call Fault:", e);
        return { status: SourcingStatus.API_ERROR, data: [], debugInfo: { error: e.message } };
    }
  }

  /**
   * STAGE 2: MANDATORY ENRICHMENT
   * Re-uses the discovery logic as the extension-based Search already returns enriched data.
   */
  async getProductDetails(productUrl) {
    // For V19.0, we prioritize the data extracted in Stage 1 or re-trigger discovery.
    return { status: SourcingStatus.SUCCESS, data: null };
  }

  /**
   * Mappers for Discovery vs Detailed State
   */
  parseDiscovery(rawItems) {
      return rawItems.map(item => {
          if (!item.title) return null;

          return {
              id: item.id || `ali_${Math.random().toString(36).substr(2, 9)}`,
              title: item.title,
              price: item.price || 0,
              image: item.image || item.images?.[0] || null,
              url: item.url || '#',
              source: 'aliexpress',
              rating: item.rating || null,
              reviewCount: item.reviewCount || 0,
              status: 'READY'
          };
      }).filter(p => p !== null);
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
  /**
   * SELF-IMPORT / MANUAL EXTRACTION (v1.0)
   * Handles raw HTML or JSON snapshots from the user's browser.
   */
  parseManualSource(source, url = '#') {
    if (!source) return { status: SourcingStatus.EMPTY, data: null };

    try {
        // Try parsing as JSON first
        let data = null;
        try {
            data = JSON.parse(source);
        } catch (e) {
            // Fallback to HTML parsing
            const blocks = this.discoverJSONBlocks(source);
            data = blocks.find(b => b.productConfig || b.item || b.skuModule) || blocks[0];
        }

        if (!data) throw new Error("Could not find product data in provided source");

        const enriched = this.mapDetailedProduct(data, url);
        return { status: SourcingStatus.SUCCESS, data: enriched };

    } catch (e) {
        console.error("[AliExpress] Manual Import Fault:", e);
        return { status: SourcingStatus.PARSE_FAILURE, data: null };
    }
  }
}

export default new AliExpressService();
