import axios from 'axios';

class eBayService {
  constructor() {
    this.userToken = import.meta.env.VITE_EBAY_USER_TOKEN;
    this.appToken = null;
    this.baseUrl = 'https://api.ebay.com/buy/browse/v1';
    
    // Multi-Layer API Bridge (Fail-Safe Architecture)
    const rawProxy = import.meta.env.VITE_PROXY_URL || "";
    this.proxyUrl = rawProxy.endsWith("/") ? rawProxy.slice(0, -1) : rawProxy;
    this.marketplaceId = 'EBAY_US'; // Default for production

    this.route = (targetUrl) => {
      // Primary: Private Google Bridge
      const primary = this.proxyUrl ? `${this.proxyUrl}?url=${encodeURIComponent(targetUrl)}` : null;
      // Secondary: AllOrigins (Permissive)
      const secondary = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      // Tertiary: CORSProxy (Fallback)
      const tertiary = `https://cors.bridge.org/?${encodeURIComponent(targetUrl)}`;

      // In a real browser, we'd use a race or a serial retry, 
      // but for simple URL generation, we prioritize the Private Bridge.
      return primary || secondary;
    };
  }

  async fetchWithRetry(method, url, config = {}) {
    // 1. Deep-Encode Target URL (Merge Params into URL for Proxy Transparency)
    let targetUri = new URL(url);
    if (config.params) {
        Object.keys(config.params).forEach(key => 
            targetUri.searchParams.append(key, config.params[key])
        );
    }
    const finalTargetUrl = targetUri.toString();

    // 2. Case-Agnostic Header Extraction
    const h = config.headers || {};
    let auth = h['Authorization'] || h['authorization'] || "";
    const marketplaceid = h['X-EBAY-C-MARKETPLACE-ID'] || h['x-ebay-c-marketplace-id'] || this.marketplaceId || 'EBAY_US';

    const proxies = [
        this.proxyUrl ? `${this.proxyUrl}/?url=${encodeURIComponent(finalTargetUrl)}&auth=${encodeURIComponent(auth)}&marketplaceid=${marketplaceid}` : null,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(finalTargetUrl)}`,
        `https://cors-proxy.org/?url=${encodeURIComponent(finalTargetUrl)}`
    ].filter(Boolean);

    let lastError = null;
    console.info(`[Market Sync] Routing request: ${finalTargetUrl.slice(0, 80)}...`);
    
    for (const proxy of proxies) {
        try {
            const response = await axios({
                ...config,
                params: {}, 
                method,
                url: proxy,
                timeout: 10000 
            });

            // Bridge Check: Detect bridge-level failures masked as 200 OK
            if (typeof response.data === 'string' && 
               (response.data.includes("Bridge Fault") || response.data.includes("Handshake Failed"))) {
                throw new Error("Market Connectivity Failure Detected");
            }

            return response;
        } catch (e) {
            const status = e.response?.status || 'Network Fault';
            console.warn(`[Market Sync] Node ${proxies.indexOf(proxy)} bypassed [Status: ${status}]`);
            lastError = e;
        }
    }
    throw lastError;
  }

  async getAppToken() {
    if (this.appToken) return this.appToken;
    try {
        const platformBase64 = btoa(`${import.meta.env.VITE_EBAY_APP_ID}:${import.meta.env.VITE_EBAY_CERT_ID}`);
        const response = await this.fetchWithRetry('post', 'https://api.ebay.com/identity/v1/oauth2/token', {
            data: new URLSearchParams({ grant_type: 'client_credentials', scope: 'https://api.ebay.com/oauth/api_scope' }), 
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${platformBase64}`
            }
        });
        if (!response.data || !response.data.access_token) {
            throw new Error("Empty token response from eBay");
        }
        this.appToken = response.data.access_token;
        console.info("[eBay Auth] App Token successfully synchronized.");
        return this.appToken;
    } catch (e) {
        console.error("eBay App Token Retrieval Failed:", e.response?.data || e.message);
        return null;
    }
  }

  async fetchTrendingProducts(categoryId = null) {
    // Intelligence-based trending: Pick high-velocity keywords + categories
    const trendingKeywords = ['new arrival', 'best seller', 'trending', 'hot item'];
    const randomKeyword = trendingKeywords[Math.floor(Math.random() * trendingKeywords.length)];
    
    return this.searchProducts(randomKeyword, {
        categoryId,
        limit: 12,
        sort: 'newlyListed'
    });
  }

  getCategoryFee(categoryId) {
    // Category-aware eBay fee logic
    const feeMap = {
        // Electronics (Computers, Tablets, etc.)
        '58058': 0.15,
        '171485': 0.15,
        // Fashion (Clothing, Shoes, etc.)
        '11450': 0.12,
        '15724': 0.12,
        // Home & Garden
        '11700': 0.12,
        // Collectibles
        '1': 0.13
    };

    const fee = feeMap[categoryId] || 0.1435; // Fallback to 14.35%
    return {
        percentage: fee,
        fixed: 0.30
    };
  }

  async searchProducts(query, options = {}) {
    let token = await this.getAppToken();
    if (!token) {
        console.error("[eBay Search] Cannot execute search: Auth Token Missing.");
        return [];
    }
    
    const { 
        categoryId = null, 
        limit = 12, 
        offset = 0, 
        minPrice = null, 
        maxPrice = null,
        condition = 'NEW',
        sort = null
    } = options;

    const searchTerm = query || ''; 
    
    const executeSearch = async (authToken) => {
        try {
            const params = { 
                q: searchTerm, 
                limit, 
                offset,
                filter: `buyingOptions:{FIXED_PRICE},itemCondition:{${condition}}` 
            };

            if (minPrice !== null || maxPrice !== null) {
                const min = minPrice || 0;
                const max = maxPrice || 999999;
                params.filter += `,price:[${min}..${max}]`;
                params.filter += `,priceCurrency:USD`;
            }
            
            if (categoryId) {
                params.category_ids = categoryId.toString();
            }

            if (sort) {
                params.sort = sort;
            }

            const response = await this.fetchWithRetry('get', `${this.baseUrl}/item_summary/search`, {
                params,
                headers: { 
                    'Authorization': `Bearer ${authToken}`,
                    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.itemSummaries) {
                return response.data.itemSummaries.map(item => {
                    // High-Integrity Image Mapping
                    const image = item.image?.imageUrl || 
                                  item.galleryURL || 
                                  (item.thumbnailImages && item.thumbnailImages[0]?.imageUrl) ||
                                  'https://via.placeholder.com/400';

                    return {
                        id: item.itemId,
                        title: item.title,
                        price: parseFloat(item.price.value),
                        thumbnail: image,
                        image_url: image, // Legacy
                        itemWebUrl: item.itemWebUrl, // Production-grade redirect URL
                        condition: item.condition,
                        categoryPath: item.categories?.map(c => c.categoryName).join(' > '),
                        categoryId: item.categories?.[0]?.categoryId,
                        seller: item.seller,
                        totalFound: response.data.total // Used for 'competition density' signal
                    };
                });
            }
            return [];
        } catch (e) {
            console.error("[eBay Search] API Vector Failure:", e.message);
            throw e; // Bubble up for error handling in UI
        }
    };

    // Strategy 1: Browse API
    let results = await executeSearch(token);
    
    // Strategy 2: User-Triggered Browse (if permitted)
    if ((!results || results.length === 0) && this.userToken) {
        try {
            results = await executeSearch(this.userToken);
        } catch (e) {
            // Ignore for secondary strategy
        }
    }

    return results || [];
  }

  sanitizeSearchKeyword(text) {
    if (!text) return "";
    // Remove symbols and common eBay 'noise' words
    let clean = text.replace(/[^a-zA-Z0-9\s]/g, ' ')
                    .replace(/\b(new|sealed|box|ship|fast|best|official|certified|genuine)\b/gi, '')
                    .trim();
    // Use first 5-6 meaningful words for the search (high precision)
    return clean.split(/\s+/).slice(0, 6).join(' ');
  }

  async getCompetitorInsights(keyword) {
    const token = await this.getAppToken();
    if (!token) return [];
    
    const optimizedQuery = this.sanitizeSearchKeyword(keyword);
    console.info(`[Market Pulse] Optimized Query: "${optimizedQuery}"`);

    try {
        const response = await this.fetchWithRetry('get', `${this.baseUrl}/item_summary/search`, {
            params: { 
                q: optimizedQuery, 
                limit: 10, 
                sort: 'price',
                filter: 'buyingOptions:{FIXED_PRICE},itemCondition:{NEW}'
            },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const results = (response.data?.itemSummaries || []).map(item => ({
            title: item.title,
            price: parseFloat(item.price.value),
            shipping: item.shippingOptions?.[0]?.shippingCost?.value === '0.00' ? "Free" : "Calculated",
            seller: item.seller?.username || "eBay Competitor"
        }));

            // Calculate Stats for AI Pricing Strat
            if (results.length > 0) {
                const prices = results.map(r => r.price);
                const avgPrice = prices.length > 0 ? prices.reduce((a,b) => a+b, 0) / prices.length : 0;
                results.stats = {
                    min: prices.length > 0 ? Math.min(...prices).toFixed(2) : '0.00',
                    max: prices.length > 0 ? Math.max(...prices).toFixed(2) : '0.00',
                    avg: avgPrice.toFixed(2)
                };
            }

        return results;
    } catch (e) {
        return [];
    }
  }

  async getCategorySuggestions(keyword) {
    if (!keyword || keyword === 'top') return this.getTopCategories();
    
    const token = await this.getAppToken();
    if (!token) return this.getCachedCategories();
    
    try {
        const response = await this.fetchWithRetry('get', `https://api.ebay.com/commerce/taxonomy/v1/category_tree/0/get_category_suggestions`, {
            params: { q: keyword },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        return (response.data?.categorySuggestions || []).map(s => ({
            id: s.category?.categoryId,
            name: s.category?.categoryName,
            ancestors: (s.categoryAncsentorPath || []).map(a => a.categoryName).join(' > '),
            fullPath: [...(s.categoryAncsentorPath || []).map(a => a.categoryName), s.category?.categoryName].join(' > ')
        }));
    } catch (e) {
        console.error("[eBay Taxonomy] Search Failed:", e);
        return this.getCachedCategories();
    }
  }

  async getTopCategories() {
    const token = await this.getAppToken();
    if (!token) return this.getCachedCategories();

    try {
        // Fetching root-level nodes for the EBAY_US tree (ID: 0)
        const response = await this.fetchWithRetry('get', `https://api.ebay.com/commerce/taxonomy/v1/category_tree/0`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        return (response.data?.rootCategoryNode?.childCategoryTreeNodes || []).map(node => ({
            id: node.category.categoryId,
            name: node.category.categoryName,
            isLeaf: node.leafCategoryTreeNodes?.length === 0
        }));
    } catch (e) {
        return this.getCachedCategories();
    }
  }

  getCachedCategories() {
    // High-integrity fallback for API degradation
    return [
        { id: '1', name: 'Collectibles' },
        { id: '267', name: 'Books' },
        { id: '58058', name: 'Computers & Tablets' },
        { id: '11450', name: 'Clothing, Shoes & Accs' },
        { id: '15032', name: 'Cell Phones & Accessories' },
        { id: '11700', name: 'Home & Garden' },
        { id: '1249', name: 'Video Games & Consoles' },
        { id: '2984', name: 'Baby' }
    ];
  }

  async getSubCategories(parentId) {
    const token = await this.getAppToken();
    if (!token) return [];

    try {
        const response = await this.fetchWithRetry('get', `https://api.ebay.com/commerce/taxonomy/v1/category_tree/0/get_category_subtree`, {
            params: { category_id: parentId },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        return (response.data?.categoryTreeNode?.childCategoryTreeNodes || []).map(node => ({
            id: node.category.categoryId,
            name: node.category.categoryName,
            isLeaf: node.leafCategoryTreeNodes?.length === 0 && (!node.childCategoryTreeNodes || node.childCategoryTreeNodes.length === 0)
        }));
    } catch (e) {
        console.error("[Taxonomy Drill-Down] Node Retrieval Failed:", e.message);
        return [];
    }
  }

  async getCategoryInfo(categoryId) {
    const token = await this.getAppToken();
    if (!token) return null;

    try {
        const response = await this.fetchWithRetry('get', `https://api.ebay.com/commerce/taxonomy/v1/category_tree/0/get_category_subtree`, {
            params: { category_id: categoryId },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data?.categoryTreeNode?.childCategoryTreeNodes || [];
    } catch (e) {
        console.error("[eBay Taxonomy] Subtree Fetch Failed:", e);
        return [];
    }
  }

  async getProductById(id) {
    const token = await this.getAppToken();
    if (!token) return null;
    
    // Identity Transformation: Qualify legacy IDs for Browse API Vector
    let finalId = id;
    if (id && !id.startsWith('v1|')) {
        finalId = `v1|${id}|0`;
    }

    try {
        console.log(`[eBay Handshake] Fetching PRODUCTION Specs: ${finalId}`);
        const response = await this.fetchWithRetry('get', `${this.baseUrl}/item/${finalId}`, {
            params: { fieldgroups: 'FULL' },
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const item = response.data;
        if (!item) return null;

        // "Deep-Seek" Image Extraction (Multi-Layer fallback for different eBay item types)
        const findImages = (obj) => {
            const urls = new Set();
            // Primary Browse API fields
            if (obj.image?.imageUrl) urls.add(obj.image.imageUrl);
            if (Array.isArray(obj.additionalImages)) {
                obj.additionalImages.forEach(img => img.imageUrl && urls.add(img.imageUrl));
            }
            // Fallback: Check common legacy/nested fields
            if (Array.isArray(obj.pictureUrls)) obj.pictureUrls.forEach(url => urls.add(url));
            if (obj.pictureDetails?.pictureUrls) obj.pictureDetails.pictureUrls.forEach(url => urls.add(url));
            
            return Array.from(urls);
        };

        const images = findImages(item);
        const rawDescription = item.description || item.shortDescription || "";
        const rawPrice = item.price?.value || item.currentPrice?.value || "0";

        console.info(`[Production Restoration] Payload Synced: ${images.length} images recovered.`);

        return {
            id: item.itemId,
            legacyId: item.legacyItemId || id.replace('v1|', '').split('|')[0],
            title: item.title,
            price: parseFloat(rawPrice),
            description: rawDescription,
            images: images,
            rawItem: item
        };
    } catch (e) {
        console.error("[eBay Sync] Critical Production Fetch Failed:", e);
        return null;
    }
  }
}

export default new eBayService();
