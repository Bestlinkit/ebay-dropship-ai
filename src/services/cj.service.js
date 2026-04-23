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
   * 🏗️ API INTEGRITY VERIFICATION (Step 1-4)
   */
  async runIterativePipeline(context) {
    const { product, manualQuery, pageNum = 1 } = context;
    const ebayIntel = deconstructTitle(product.title);
    const query = manualQuery || ebayIntel.queries.fallback || product.title;

    try {
        const response = await axios.get(`${BRIDGE_BASE}${this.CONFIG.SEARCH_ENDPOINT}`, { 
            params: { keyword: query, pageNum, pageSize: 20 } 
        });

        // STEP 1: LOG RAW CJ RESPONSE
        console.log("CJ API RESPONSE:", response);

        // STEP 2: VALIDATE RESPONSE STRUCTURE
        if (!response || !response.data || response.data.code !== 200) {
            console.error("CJ API FAILED:", response?.data);
            throw new Error("CJ DATA INVALID - STOP PIPELINE");
        }

        const rawContent = response.data?.data?.content;
        let productList = [];
        
        if (Array.isArray(rawContent)) {
            productList = rawContent.flatMap(block => block.productList || []);
        } else {
            productList = response.data?.data?.productList || [];
        }

        if (!productList || productList.length === 0) {
             console.error("CJ EMPTY RESULT");
             throw new Error("CJ DATA INVALID - STOP PIPELINE");
        }

        // STEP 3: ASSERT REQUIRED FIELDS
        productList.forEach(p => {
            const hasId = p.id || p.productId || p.pid;
            const hasName = p.productName || p.productNameEn || p.name;
            const hasImage = p.productImage || p.image;
            const hasVariants = p.skuList || p.variantList || p.variants || p.productVariants;

            if (!hasId || !hasName || !hasImage || !hasVariants) {
                console.error("CJ INVALID PRODUCT STRUCTURE:", p);
                // STEP 4: HARD FAIL
                throw new Error("CJ DATA INVALID - STOP PIPELINE");
            }

            console.log("CJ VALID PRODUCT:", p);
        });

        // If integrity check passes, proceed with namespaced normalization
        const products = productList.map(item => normalizeProduct(item, {}));
        
        return { 
            status: "SUCCESS", 
            products,
            telemetry: { merged_count: products.length }
        };
    } catch (err) {
        console.error("Integrity Fault:", err.message);
        return { status: "ERROR", products: [], error: err.message };
    }
  }

  /**
   * 🧩 DETAIL INTEGRITY (Scoped)
   */
  async enrichSingleProduct(product) {
    try {
        const pid = product.cj?.id || product.id || product.product_id;
        
        const response = await axios.get(`${BRIDGE_BASE}${this.CONFIG.DETAIL_ENDPOINT}`, { 
            params: { pid } 
        });

        console.log("CJ DETAIL RESPONSE:", response);

        if (!response.data || response.data.code !== 200 || !response.data.data) {
             throw new Error("CJ DETAIL INVALID");
        }

        const cjData = response.data.data;
        
        // Assert Detail Fields
        if (!cjData.productNameEn && !cjData.productName) {
             throw new Error("CJ DETAIL NAME MISSING");
        }

        return normalizeProduct(product, cjData);
    } catch (e) {
        console.error("Detail Integrity Failure:", e.message);
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
                onEnriched(product.id || enriched.cj?.id, enriched);
            }
        }
    };

    const workers = Array(Math.min(5, queue.length)).fill(null).map(worker);
    await Promise.all(workers);
  }
}

export default new CJService();
