import axios from 'axios';
import { normalizeProduct, sanitizeProduct } from './cj.schema';
import { deconstructTitle } from '../utils/productQueryEngine';

const BRIDGE_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

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
   * 🏗️ STABLE SEARCH PIPELINE
   */
  async runIterativePipeline(context) {
    const { product, manualQuery, pageNum = 1 } = context;
    const ebayIntel = deconstructTitle(product.title);
    const query = manualQuery || ebayIntel.queries.fallback || product.title;

    try {
        const response = await axios.get(`${BRIDGE_BASE}${this.CONFIG.SEARCH_ENDPOINT}`, { 
            params: { keyword: query, pageNum, pageSize: 20 } 
        });

        if (response.data?.code === 200) {
            const rawContent = response.data?.data?.content;
            let productList = [];
            
            if (Array.isArray(rawContent)) {
                productList = rawContent.flatMap(block => block.productList || []);
            } else {
                productList = response.data?.data?.productList || [];
            }

            const products = productList
                .map(item => {
                    try {
                        return normalizeProduct(item, {});
                    } catch (e) {
                        return null;
                    }
                })
                .filter(p => p !== null);
            
            return { 
                status: products.length > 0 ? "SUCCESS" : "NO_MATCH_FOUND", 
                products,
                telemetry: { merged_count: products.length }
            };
        }
    } catch (err) {
        console.error("Search Pipeline Fault:", err);
    }
    return { status: "ERROR", products: [] };
  }

  /**
   * 🔥 ISSUE 2: HYDRATION PROTECTION (SAFE MERGE)
   */
  async enrichSingleProduct(product) {
    try {
        const pid = product.id || product.product_id;
        let cjData = this.cache.get(pid);

        if (!cjData) {
            const response = await axios.get(`${BRIDGE_BASE}${this.CONFIG.DETAIL_ENDPOINT}`, { 
                params: { pid } 
            });
            if (response.data?.code === 200) {
                cjData = response.data.data;
                this.cache.set(pid, cjData);
            }
        }

        const enriched = normalizeProduct(product, cjData || {});
        
        // RULE: NEVER overwrite existing data with null, undefined, or empty array
        return sanitizeProduct({
            ...product,
            name: product.name || enriched.name,
            images: (product.images && product.images.length > 0) ? product.images : (enriched.images || []),
            variants: (product.variants && product.variants.length > 0) ? product.variants : (enriched.variants || []),
            price: product.price ?? enriched.price,
            shipping: product.shipping ?? enriched.shipping,
            
            // Fill missing gaps only
            description: product.description || enriched.description,
            shippingCost: product.shippingCost || enriched.shippingCost,
            deliveryTime: product.deliveryTime || enriched.deliveryTime,
            rawDetail: cjData || product.rawDetail
        });
    } catch (e) {
        console.error("Enrichment Failure:", e);
        return sanitizeProduct(product);
    }
  }

  /**
   * 🚀 BATCH ENRICHMENT WORKER
   */
  async enrichProductList(products, onEnriched) {
    const queue = [...products];
    const worker = async () => {
        while (queue.length > 0) {
            const product = queue.shift();
            if (!product) continue;
            const enriched = await this.enrichSingleProduct(product);
            if (enriched) {
                onEnriched(product.id, enriched);
            }
        }
    };

    const workers = Array(Math.min(5, queue.length)).fill(null).map(worker);
    await Promise.all(workers);
  }
}

export default new CJService();
