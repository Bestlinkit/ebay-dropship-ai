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
    const ebayIntel = deconstructTitle(product.title);
    const query = manualQuery || ebayIntel.queries.fallback || product.title;

    try {
        const url = `${BRIDGE_BASE}${this.CONFIG.SEARCH_ENDPOINT}`;
        console.log("CJ FETCH STARTED");
        console.log("CJ FETCH URL:", url);

        const response = await axios.get(url, { 
            params: { keyword: query, pageNum, pageSize: 20 } 
        });

        console.log("CJ FETCH RESPONSE:", response);

        if (!response || !response.data || response.data.code !== 200) {
            console.warn("CJ API RESPONSE PARTIAL - continuing");
            return { status: "NO_MATCH_FOUND", products: [] };
        }

        const rawContent = response.data?.data?.content;
        let productList = [];
        
        if (Array.isArray(rawContent)) {
            productList = rawContent.flatMap(block => block.productList || []);
        } else {
            productList = response.data?.data?.productList || [];
        }

        const products = productList
            .filter(p => p && (p.id || p.productId || p.pid))
            .map(item => normalizeProduct(item, {}));
        
        if (products.length === 0) {
             console.warn("CJ DATA PARTIAL - continuing");
        }
        
        return { 
            status: "SUCCESS", 
            products,
            telemetry: { merged_count: products.length }
        };
    } catch (err) {
        console.warn("CJ DATA PARTIAL - continuing", err.message);
        return { status: "ERROR", products: [], error: err.message };
    }
  }

  /**
   * ✅ 2. FALLBACK: FETCH DETAIL FOR SELECTED PRODUCT
   */
  async enrichSingleProduct(product) {
    try {
        const pid = product.cj?.id || product.id || product.product_id;
        if (!pid) return product;

        const url = `${BRIDGE_BASE}${this.CONFIG.DETAIL_ENDPOINT}`;
        console.log("CALLING CJ API...", url);

        const response = await axios.get(url, { 
            params: { pid } 
        });

        console.log("CJ RESPONSE RECEIVED", response.data);

        if (!response.data || response.data.code !== 200 || !response.data.data) {
             console.warn("CJ DETAIL PARTIAL - continuing");
             return product;
        }

        // ✅ Extract TRUE variant source (skuList) via normalizeProduct
        const cjData = response.data.data;
        return normalizeProduct(product, cjData);
    } catch (e) {
        console.warn("CJ DETAIL PARTIAL - continuing", e.message);
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
