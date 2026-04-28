
import axios from 'axios';

class eBayService {
  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  }

  /**
   * 👤 GET USER PROFILE
   */
  async getUserProfile() {
    try {
      const response = await axios.get(`${this.backendUrl}/api/ebay/user`);
      return response.data.userId || null;
    } catch (e) {
      console.error("[eBay Service] User Profile Fetch Failed:", e.message);
      return null;
    }
  }

  /**
   * 📊 GET ACCOUNT SUMMARY
   */
  async getAccountSummary() {
    try {
      const response = await axios.get(`${this.backendUrl}/api/ebay/account`);
      return {
        activeListings: response.data.activeListings || 0,
        status: response.data.success ? 'CONNECTED' : 'ERROR'
      };
    } catch (e) {
      console.error("[eBay Service] Account Fetch Failed:", e.message);
      return { activeListings: 0, status: 'DISCONNECTED' };
    }
  }

  /**
   * 📋 GET ACTIVE LISTINGS
   */
  async getActiveListings() {
    try {
      const response = await axios.get(`${this.backendUrl}/api/ebay/listings`);
      return response.data;
    } catch (e) {
      console.error("[eBay Service] Listings Fetch Failed:", e.message);
      return [];
    }
  }

  /**
   * 🛒 GET ORDERS
   */
  async getOrders() {
    try {
      const response = await axios.get(`${this.backendUrl}/api/ebay/orders`);
      return response.data;
    } catch (e) {
      console.error("[eBay Service] Orders Fetch Failed:", e.message);
      return [];
    }
  }

  /**
   * 📦 PUBLISH ITEM
   */
  async publishItem(itemData) {
    try {
      const response = await axios.post(`${this.backendUrl}/api/ebay/list`, itemData);
      return {
        success: true,
        itemId: response.data.itemId,
        raw: response.data.raw
      };
    } catch (e) {
      const errorDetail = e.response?.data?.details || e.response?.data?.error || e.message;
      return { 
        success: false, 
        error: typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail),
        details: errorDetail 
      };
    }
  }

  /**
   * 🛠️ REVISE ITEM
   */
  async reviseItem(token, itemId, itemData) {
    try {
      const response = await axios.post(`${this.backendUrl}/api/ebay/revise/${itemId}`, itemData);
      return response.data;
    } catch (e) {
      console.error("[eBay Service] Revision Failed:", e.message);
      throw e;
    }
  }

  /**
   * 🔄 REFRESH TOKEN
   */
  async refreshEbayToken(refreshToken) {
    try {
        const response = await axios.post(`${this.backendUrl}/api/ebay/refresh`, { refresh_token: refreshToken });
        return response.data;
    } catch (e) {
        console.error("[eBay Service] Refresh Failed:", e.message);
        throw e;
    }
  }

  // REMOVED: getBusinessPolicies (Legacy Mode Only)

  // --- MARKET DISCOVERY (Browse & Taxonomy APIs) ---

  async searchProducts(query, options = {}) {
    try {
      const response = await axios.get(`${this.backendUrl}/api/ebay/search`, {
        params: { q: query, ...options }
      });
      return response.data;
    } catch (e) {
      console.error("[eBay Discovery] Search Failed:", e.message);
      return [];
    }
  }

  async getCategorySuggestions(keyword) {
    try {
      const response = await axios.get(`${this.backendUrl}/api/ebay/categories`, {
        params: { q: keyword }
      });
      return response.data;
    } catch (e) {
      console.error("[eBay Discovery] Category Fetch Failed:", e.message);
      return [];
    }
  }

  async fetchTrendingProducts(categoryId = null) {
    // Trending is often just a search with no query or high-volume keywords
    return this.searchProducts('trending', { categoryId, limit: 10 });
  }

  async getAutocompleteSuggestions(q) {
    // Autocomplete can be bridged to categories or a dedicated endpoint
    return this.getCategorySuggestions(q).then(cats => cats.map(c => c.name));
  }

  async getTopCategories(treeId = null) {
    try {
      const response = await axios.get(`${this.backendUrl}/api/ebay/categories`, {
        params: { treeId }
      });
      // Response is { treeId, children }
      return response.data;
    } catch (e) {
      console.error("[Taxonomy] Root Categories Failed:", e.message);
      return { treeId: "0", children: [] };
    }
  }

  async getCategoryTreeId() {
    // Tree ID is now usually returned by getTopCategories, 
    // but keeping a fallback for standalone check
    try {
      const response = await axios.get(`${this.backendUrl}/api/ebay/categories`);
      return response.data.treeId || "0";
    } catch (e) {
      return "0";
    }
  }

  async getSubCategories(parentId, treeId = "0") {
    try {
      const response = await axios.get(`${this.backendUrl}/api/ebay/categories-sub/${parentId}`, {
        params: { treeId }
      });
      return response.data;
    } catch (e) {
      console.error("[Taxonomy] Sub-Categories Failed:", e.message);
      return [];
    }
  }

  async getItemAspects(categoryId, treeId = "0") {
    try {
      const response = await axios.get(`${this.backendUrl}/api/ebay/aspects/${categoryId}`, {
        params: { treeId }
      });
      return response.data;
    } catch (e) {
      console.error("[Taxonomy] Aspect Fetch Failed:", e.message);
      return [];
    }
  }

  async getCompetitorInsights(keyword) {
    return { stats: { avg: 25, min: 15, max: 45 } };
  }
}

export default new eBayService();
