
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
      const errors = e.response?.data?.errors || [e.message];
      return { success: false, error: errors[0], errors };
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

  // --- TAXONOMY & SEARCH (Direct REST for non-sensitive data if needed, or bridged) ---

  async getSubCategories(parentId) {
    // For now, we'll return a basic set or bridge it if critical.
    // In a full implementation, this would also be a backend route to avoid exposing App Token.
    return [
        { id: '1', name: 'General', isLeaf: true }
    ];
  }

  async getCompetitorInsights(keyword) {
    return { stats: { avg: 25, min: 15, max: 45 } };
  }
}

export default new eBayService();
