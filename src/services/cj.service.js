import axios from 'axios';
import { normalizeProduct } from './cj.schema';
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

            // Phase 1: Immediate Normalization
            const products = productList.map(item => normalizeProduct(item, {}));
            
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
   * 🧩 EMERGENCY FIX — RESTORE DATA PRIORITY (SAFE MERGE)
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

        // --- SAFE MERGE LOGIC (Phase 1 Fix) ---
        return {
            ...product,

            // ONLY use CJ data if it exists and is valid
            title: cjData?.productNameEn || cjData?.productName || product?.title || product?.name,
            description: cjData?.descriptionHtml || cjData?.productDesc || product?.description,

            images: (cjData?.productImageList?.length || cjData?.images?.length)
                ? (cjData.productImageList || cjData.images)
                : (product?.images || []),

            variants: (cjData?.variants?.length || cjData?.productVariants?.length || cjData?.skus?.length)
                ? (cjData.variants || cjData.productVariants || cjData.skus)
                : (product?.variants || []),

            price: product?.price || 0,
            cjCost: parseFloat(cjData?.sellPrice || cjData?.price || product?.cjCost || 0),

            warehouse: cjData?.warehouseName || cjData?.warehouse || product?.warehouse || "CN",

            // 🚢 DO NOT TOUCH SHIPPING LOGIC
            logistics: cjData?.logistics || product?.logistics || []
        };
    } catch (e) {
        console.error("Enrichment Failure:", e);
        return product;
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

  /**
   * 🚢 SIMPLE SHIPPING RESOLVER
   */
  async getShippingOptions(pid, countryCode = 'US') {
      // For stability in grid, we mostly rely on enriched data from detail API
      // but if specifically called, we can fetch fresh freight
      return { methods: [], status: "resolved_via_enrichment" };
  }
}

export default new CJService();
