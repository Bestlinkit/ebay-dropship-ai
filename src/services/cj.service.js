import axios from 'axios';
import { normalizeProduct } from './cj.schema';
import { deconstructTitle } from '../utils/productQueryEngine';

const BRIDGE_BASE = 'http://localhost:3001';

class CJService {
  constructor() {
    this.CONFIG = {
      SEARCH_ENDPOINT: '/api/cj/search',
      DETAIL_ENDPOINT: '/api/cj/detail',
      FREIGHT_ENDPOINT: '/api/cj/freight'
    };
    this.cache = new Map();
  }

  /**
   * 🏗️ FLEXIBLE SEARCH PIPELINE
   */
  async runIterativePipeline(context) {
    const { product, manualQuery, pageNum = 1 } = context;
    const ebayIntel = deconstructTitle(product?.title);
    
    // Determine search chain
    let searchChain = [];
    if (manualQuery) {
        searchChain = [manualQuery];
    } else {
        searchChain = ebayIntel.queries.steps || [product?.title];
    }

    try {
        const url = `${BRIDGE_BASE}${this.CONFIG.SEARCH_ENDPOINT}`;
        console.log("CJ ITERATIVE FETCH INITIATED", { chain_length: searchChain.length });

        for (let i = 0; i < searchChain.length; i++) {
            const currentQuery = searchChain[i];
            console.log(`[CJ Discovery] Attempt ${i+1}: "${currentQuery}"`);

            const response = await axios.get(url, { 
                params: { 
                    keyword: currentQuery, 
                    page: pageNum, 
                    size: 20 
                } 
            });

            if (!response || !response.data || (response.data.code !== 200 && response.data.code !== 0)) {
                continue; // Try next step if this one failed
            }

            const rawContent = response.data?.data?.content;
            let productList = [];
            
            if (Array.isArray(rawContent)) {
                if (rawContent.length > 0 && rawContent[0].productList) {
                    productList = rawContent.flatMap(block => block.productList || []);
                } else {
                    productList = rawContent;
                }
            } else {
                productList = response.data?.data?.productList || [];
            }

            const products = productList
                .filter(p => p && (p.id || p.productId || p.pid))
                .map(item => normalizeProduct(item, {}));

            if (products.length > 0) {
                console.log(`[CJ Discovery] SUCCESS on attempt ${i+1} with ${products.length} items`);
                return { 
                    status: "SUCCESS", 
                    products,
                    queryUsed: currentQuery,
                    telemetry: { attempt: i + 1, total_steps: searchChain.length }
                };
            }
            
            // If we are on a manual search, don't fallback automatically
            if (manualQuery) break;
        }

        return { status: "NO_MATCH_FOUND", products: [] };
    } catch (err) {
        console.error("CJ Pipeline Critical Failure:", err.message);
        return { status: "ERROR", products: [], error: err.message };
    }
  }

  /**
   * ✅ 2. ENRICH: FETCH DETAIL + FREIGHT
   */
  async enrichSingleProduct(product) {
    try {
        const pid = String(product.cj?.id || product.id || product.product_id);
        if (!pid || pid === "UNKNOWN") return product;

        // 1. Fetch Product Detail
        const detailUrl = `${BRIDGE_BASE}${this.CONFIG.DETAIL_ENDPOINT}`;
        const detailResponse = await axios.get(detailUrl, { params: { pid } });

        if (!detailResponse.data || detailResponse.data.code !== 200 || !detailResponse.data.data) {
             return product;
        }

        const cjData = detailResponse.data.data;
        const variants = cjData.skuList || cjData.variantList || [];
        
        // 2. Fetch Real Shipping Fee (Freight) for the first variant to fix "$0.00" issue
        let freightData = {};
        if (variants.length > 0) {
            try {
                const firstSku = variants[0].variantSku || variants[0].sku || variants[0].skuCode;
                const freightUrl = `${BRIDGE_BASE}${this.CONFIG.FREIGHT_ENDPOINT}`;
                const freightResponse = await axios.post(freightUrl, {
                    sku: firstSku,
                    countryCode: 'US',
                    warehouseId: cjData.warehouseName || 'CN'
                });
                
                if (freightResponse.data?.code === 200 && freightResponse.data.data?.[0]) {
                    const bestMethod = freightResponse.data.data[0];
                    freightData = {
                        shippingFee: bestMethod.price || bestMethod.amount || 0,
                        deliveryTime: bestMethod.logisticTime || "7-15 Days",
                        logisticName: bestMethod.logisticName || "Standard Shipping"
                    };
                }
            } catch (fe) {
                console.warn("Freight calculation failed - using detail defaults", fe.message);
            }
        }

        const rawBase = product.cj?.raw || product;
        // Merge detail data and freight data
        return normalizeProduct(rawBase, { ...cjData, ...freightData });
    } catch (e) {
        return product;
    }
  }

  async enrichProductList(products, onEnriched) {
    const queue = [...products];
    const worker = async () => {
        while (queue.length > 0) {
            const product = queue.shift();
            if (!product) continue;
            const enriched = await this.enrichSingleProduct(product);
            if (enriched) {
                onEnriched(product.cj?.id || enriched.cj?.id, enriched);
            }
        }
    };

    const workers = Array(Math.min(5, queue.length)).fill(null).map(worker);
    await Promise.all(workers);
  }
}

export default new CJService();
