
import axios from 'axios';

class eBayService {
  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
  }

  /**
   * 📊 GET ACCOUNT SUMMARY
   * Fetches active listings and account status via backend Trading API.
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
   * 📦 PUBLISH ITEM (AddItem)
   * Sends product data to backend to list on eBay using legacy Trading API.
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
      const errors = e.response?.data?.errors || [e.message];
      console.error("[eBay Service] Listing Failed:", errors);
      return {
        success: false,
        error: errors[0],
        errors: errors
      };
    }
  }

  // --- SEARCH & SUGGESTIONS (Can still be done via backend or kept as is if not needing auth) ---
  
  async searchProducts(query, options = {}) {
    // For now, if we want to remove all proxies, we should probably bridge this too.
    // But as a starting point, we'll focus on the critical listing flow.
    console.warn("Search via Browse API is legacy. Listing flow is prioritized.");
    return [];
  }

  async getCategorySuggestions(keyword) {
    // Temporary static fallback to avoid failures
    return [
        { id: '1', name: 'Collectibles' },
        { id: '58058', name: 'Computers & Tablets' },
        { id: '11450', name: 'Clothing, Shoes & Accs' },
        { id: '11700', name: 'Home & Garden' }
    ];
  }
}

export default new eBayService();
