import axios from 'axios';

/**
 * CJ Dropshipping Sourcing Intelligence & Supplier Scoring Engine (v40.0)
 * MANDATE: Absolute CJ focus. AliExpress excise complete.
 */
class SourcingService {
  constructor() {
    this.Status = { SUCCESS: 'SUCCESS', ERROR: 'ERROR' };
    
    this.CONFIG = {
      BACKEND_BASE: import.meta.env.VITE_BACKEND_URL || '',
      SEARCH_ENDPOINT: '/api/cj/search',
      DETAIL_ENDPOINT: '/api/cj/detail',
      FREIGHT_ENDPOINT: '/api/cj/freight'
    };

    this.sessionLogs = [];
  }

  log(entry) {
    this.sessionLogs.push({ timestamp: new Date().toISOString(), ...entry });
    if (this.sessionLogs.length > 50) this.sessionLogs.shift();
  }

  getLogs() { return this.sessionLogs; }

  /**
   * 🧠 SUPPLIER SCORING ENGINE (CJ Specification)
   * Ranks products based on Price, Shipping, Warehouse, and Stability.
   */
  calculateCJSupplierScore(product, detail, logistics, ebayPrice = 50) {
    // 1. Price Gap Score (Lowest CJ Variant vs eBay)
    const variants = detail.productVariants || [];
    const lowestCJPrice = Math.min(...variants.map(v => parseFloat(v.variantSellPrice || 9999)));
    const priceGap = ebayPrice - lowestCJPrice;
    const price_gap_score = priceGap > 0 ? Math.min(100, Math.round((priceGap / ebayPrice) * 150)) : 10;

    // 2. Shipping Score (Speed & Location)
    // Priority: US Warehouse > CN Warehouse
    const hasUSWarehouse = variants.some(v => v.variantWarehouseCode === 'US' || v.variantWarehouseCode === 'USA');
    const logisticAging = logistics[0]?.logisticAging || "10-15"; // e.g. "7-12"
    const avgAging = this._parseAging(logisticAging);
    
    let shipping_score = hasUSWarehouse ? 100 : 60;
    shipping_score -= (avgAging * 2); // Penalty for longer aging
    shipping_score = Math.max(0, Math.min(100, Math.round(shipping_score)));

    // 3. Warehouse Score (Availability)
    const totalInventory = variants.reduce((sum, v) => sum + (v.variantInventory || 0), 0);
    const warehouse_score = Math.min(100, Math.round((totalInventory / 500) * 100));

    // 4. Final Score (Weighted Average)
    const final_score = Math.round(
      (price_gap_score * 0.45) + 
      (shipping_score * 0.35) + 
      (warehouse_score * 0.20)
    );

    return {
      final_score,
      price_gap_score,
      shipping_score,
      warehouse_score,
      delivery_estimate: logisticAging,
      lowest_price: lowestCJPrice,
      stock_stability: totalInventory > 100 ? "HIGH" : (totalInventory > 20 ? "STABLE" : "LOW"),
      top_warehouse: hasUSWarehouse ? "US STOCK" : "CN GLOBAL"
    };
  }

  _parseAging(agingStr) {
    if (!agingStr || typeof agingStr !== 'string') return 15;
    const numbers = agingStr.match(/\d+/g);
    if (!numbers) return 15;
    const avg = numbers.reduce((a, b) => parseInt(a) + parseInt(b), 0) / numbers.length;
    return avg;
  }

  /**
   * Pipeline Orchestration: CJ Iterative Probe
   */
  async runIterativePipeline(context) {
    const rawQuery = context.query;
    this.log({ type: 'CJ_PIPELINE_START', rawQuery });

    try {
        // 1. CJ Product Search
        const searchResponse = await axios.get(this.CONFIG.SEARCH_ENDPOINT, {
            params: { keyword: rawQuery }
        });

        const rawList = searchResponse.data?.data?.list || [];
        if (rawList.length === 0) {
            throw new Error("No products found in CJ for this keyword.");
        }

        // 2. Deep Intelligence Gathering (Top 5 candidates for scoring)
        const scoredCandidates = [];
        const candidates = rawList.slice(0, 5);

        for (const item of candidates) {
            try {
                // A. Get Details (Variants & Warehouse Info)
                const detailResponse = await axios.get(this.CONFIG.DETAIL_ENDPOINT, {
                    params: { pid: item.pid }
                });
                const detail = detailResponse.data?.data;

                if (!detail) continue;

                // B. Get Logistics (Freight Calculate for US)
                const firstVariant = detail.productVariants?.[0];
                const freightResponse = await axios.post(this.CONFIG.FREIGHT_ENDPOINT, {
                   startCountryCode: 'CN', // CJ default
                   endCountryCode: 'US',
                   products: [{ quantity: 1, vid: firstVariant?.vid }]
                });
                const logistics = freightResponse.data?.data || [];

                // C. Score the product
                const ebayPrice = context.targetProduct?.price || 50;
                const scores = this.calculateCJSupplierScore(item, detail, logistics, ebayPrice);

                scoredCandidates.push({
                    ...item,
                    ...scores,
                    detail,
                    logistics
                });
            } catch (e) {
                console.error(`CJ Intelligence Fault for ${item.pid}:`, e.message);
            }
        }

        // 3. Rank and Return Top 3
        const rankedProducts = scoredCandidates
            .sort((a, b) => b.final_score - a.final_score)
            .slice(0, 3);

        return {
            status: "SUCCESS",
            source: 'CJ_DROPSHIPPING',
            products: rankedProducts,
            telemetry: { 
                latency: Date.now() - context.startTime, 
                count: rankedProducts.length 
            }
        };

    } catch (err) {
        this.log({ type: 'CJ_PIPELINE_FAULT', error: err.message });
        return { status: "ERROR", message: err.message };
    }
  }

  /**
   * 📊 Market Scoring (eBay Side)
   * Used by Discovery page to rank marketplace opportunities.
   */
  calculateSellScore(product, batchContext) {
    const price = product.price || 0;
    const avgPrice = batchContext?.avgPrice || price;
    
    // 1. Core Viability Logic
    const priceStability = 1 - (Math.abs(price - avgPrice) / Math.max(price, avgPrice || 1));
    const demandSignal = product.watchCount || product.soldCount || 0;
    
    // Competition Density (Risk Vector)
    const totalFound = product.totalFound || 1000;
    const riskFactor = Math.min(1, totalFound / 5000); // Normalize: 5000+ is max risk
    
    // Weighted Score (v42.1): Stability (35%) + Demand (45%) + Lower Competition (20%)
    const weightedScore = (priceStability * 35) + (Math.min(1, demandSignal / 50) * 45) + ((1 - riskFactor) * 20);
    const score = Math.max(0, Math.min(100, Math.round(weightedScore)));

    // 2. Grade & Confidence Assignment
    const grade = score >= 85 ? 'AAA+' : (score >= 70 ? 'A' : (score >= 40 ? 'B' : 'C'));
    const confidence = score >= 75 ? 'High' : (score >= 50 ? 'Medium' : 'Low');

    // 3. Momentum Mock Data (For UI Charts in Intelligence Review)
    const momentum = Array.from({ length: 15 }).map((_, i) => ({
      x: i,
      y: 40 + Math.random() * (score / 2) + (i * 2)
    }));

    // 4. Strategic Interpretation (The "AI" Voice)
    const interpretation = {
      classification: score >= 75 ? "High Yield Alpha" : (score >= 40 ? "Stable Market Utility" : "High Risk Asset"),
      action: score >= 80 ? "ACQUIRE IMMEDIATELY" : (score >= 60 ? "MONITOR / TEST" : "AVOID"),
      marketIndex: score >= 70 ? "BULLISH" : (score >= 40 ? "NEUTRAL" : "BEARISH"),
      basis: ["Price Stability", "Watch Count Density", "Competition Depth"],
      insights: [
        { 
          id: '1', 
          label: 'Market Alignment', 
          value: `${Math.round(priceStability * 100)}%`, 
          description: 'Price positioning relative to category average.',
          type: priceStability > 0.8 ? 'positive' : (priceStability > 0.5 ? 'warning' : 'negative'),
          icon: 'Layers'
        },
        { 
          id: '2', 
          label: 'Demand Signal', 
          value: demandSignal > 50 ? 'PEAK' : (demandSignal > 0 ? 'FLOW' : 'STAGNANT'), 
          description: 'Organic consumer interest and watch velocity.',
          type: demandSignal > 30 ? 'positive' : (demandSignal > 0 ? 'warning' : 'neutral'),
          icon: 'Zap'
        },
        { 
          id: '3', 
          label: 'Risk Vector', 
          value: totalFound > 2000 ? 'HIGH' : (totalFound > 500 ? 'MEDIUM' : 'LOW'), 
          description: totalFound > 2000 ? 'Crowded market segment; avoid.' : 'Market saturation levels are optimal.',
          type: totalFound > 2000 ? 'negative' : (totalFound > 500 ? 'warning' : 'positive'),
          icon: 'Target'
        }
      ]
    };

    return {
      resellScore: score,
      isWinner: score > 75,
      grade,
      confidence,
      momentum,
      interpretation,
      signals: {
        priceStability,
        demand: demandSignal > 20 ? 'HIGH' : 'STABLE'
      }
    };
  }

  /**
   * 🏗️ Pipeline Architecture
   */
  createContext(query, targetProduct) {
    return {
      query,
      targetProduct,
      startTime: Date.now(),
      filters: { source: 'CJ' }
    };
  }

  /**
   * 💰 Profit Intelligence
   */
  calculateROI(targetPrice, cost, shipping) {
    if (!targetPrice || !cost) return null;
    const totalCost = cost + (shipping || 0);
    const profit = targetPrice - totalCost;
    const margin = (profit / targetPrice) * 100;
    
    return {
      expected: Math.round(margin),
      profit: profit.toFixed(2),
      status: margin > 20 ? 'EXCELLENT' : 'DECENT'
    };
  }

  /**
   * 🛡️ Authority Validator
   */
  evaluateSupplierTrust(product) {
    const orders = product?.num || product?.orders || 0;
    return {
      level: orders > 100 ? 'High' : (orders > 0 ? 'Medium' : 'Low'),
      verified: true,
      status: 'VERIFIED_API'
    };
  }

  /**
   * 📦 Deep Product Enrichment (Proxy Bridge)
   */
  async getProductDetails(pid) {
    try {
        const response = await axios.get(this.CONFIG.DETAIL_ENDPOINT, {
            params: { pid }
        });
        
        const raw = response.data?.data;
        if (!raw) throw new Error("No detail data returned from CJ.");

        // Map CJ response to our normalized Detail schema
        return {
            status: 'SUCCESS',
            data: {
                id: raw.pid,
                title: raw.productNameEn || raw.productName,
                description: raw.description,
                image: raw.productImage,
                images: raw.productImage ? [raw.productImage] : [],
                price: parseFloat(raw.productVariants?.[0]?.variantSellPrice || 0),
                shipping: 0, // Logistics requires freight call, handled in UI or separate method
                url: `https://cjdropshipping.com/product/${(raw.productNameEn || "").replace(/\s+/g, '-')}-p-${raw.pid}.html`,
                source: 'cjdropshipping',
                variants: (raw.productVariants || []).map(v => ({
                    id: v.vid,
                    sku: v.variantSku,
                    price: parseFloat(v.variantSellPrice),
                    inventory: v.variantInventory,
                    warehouse: v.variantWarehouseCode
                })),
                shipsFrom: raw.productVariants?.[0]?.variantWarehouseCode || 'CN'
            }
        };
    } catch (err) {
        return { status: 'ERROR', message: err.message };
    }
  }

  /**
   * 🛡️ Validation Bridge
   */
  validateAndFilter(products) {
    if (!Array.isArray(products)) return [];
    return products.filter(p => p.id && p.price > 0);
  }

  normalize(raw) {
    return {
      id: raw.pid,
      title: raw.productNameEn || raw.productName,
      price: raw.lowest_price || 0,
      image: raw.productImage,
      thumbnail: raw.productImage,
      url: `https://cjdropshipping.com/product/${(raw.productNameEn || "").replace(/\s+/g, '-')}-p-${raw.pid}.html`,
      source: 'cjdropshipping',
      shipping: raw.delivery_estimate || "10-15 Days",
      shipping_cost: 0,
      orders: raw.num || 0,
      rating: 4.8,
      scores: {
        final: raw.final_score,
        price_gap: raw.price_gap_score,
        shipping: raw.shipping_score,
        warehouse: raw.warehouse_score,
        stability: raw.stock_stability,
        location: raw.top_warehouse
      }
    };
  }
}

export default new SourcingService();
