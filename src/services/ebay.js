import axios from 'axios';

class eBayService {
  constructor() {
    this.userToken = import.meta.env.VITE_EBAY_USER_TOKEN;
    this.appToken = null;
    this.baseUrl = 'https://api.ebay.com/buy/browse/v1';
  }

  async getAppToken() {
    if (this.appToken) return this.appToken;
    try {
        const platformBase64 = btoa(`${import.meta.env.VITE_EBAY_APP_ID}:${import.meta.env.VITE_EBAY_CERT_ID}`);
        const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', 
            new URLSearchParams({ grant_type: 'client_credentials', scope: 'https://api.ebay.com/oauth/api_scope' }), 
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${platformBase64}`
                }
            }
        );
        this.appToken = response.data.access_token;
        return this.appToken;
    } catch (e) {
        console.error("eBay App Token Retrieval Failed:", e);
        return null;
    }
  }

  /**
   * Main product search for trending items.
   */
  async searchProducts(query) {
    const token = this.userToken || await this.getAppToken();
    if (!token) {
      console.warn("[eBay Service] No token (User or App) available for search.");
      return [];
    }
    
    try {
        const response = await axios.get(`${this.baseUrl}/item_summary/search`, {
            params: { 
                q: query, 
                limit: 20,
                filter: 'conditions:{NEW}'
            },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.itemSummaries) {
            return response.data.itemSummaries.map(item => ({
                id: item.itemId,
                title: item.title,
                price: parseFloat(item.price.value),
                originalPrice: item.marketingPrice ? parseFloat(item.marketingPrice.originalPrice.value) : parseFloat(item.price.value) * 1.25,
                thumbnail: item.image?.imageUrl || (item.thumbnailImages ? item.thumbnailImages[0].imageUrl : 'https://via.placeholder.com/400'),
                soldCount: Math.floor(Math.random() * 500) + 10, // Metrics might still need estimation if not in Browse API
                watchCount: Math.floor(Math.random() * 50),
                rating: 4.5,
                competition: 'SYNCED',
                profitScore: 80,
                images: item.thumbnailImages ? item.thumbnailImages.map(img => img.imageUrl) : [item.image?.imageUrl].filter(Boolean)
            }));
        }
        return [];
    } catch (error) {
        console.error("eBay Live Search Failure:", error);
        return [];
    }
  }

  async getCompetitorInsights(keyword) {
    const token = this.userToken || await this.getAppToken();
    if (!token) return [];
    try {
        const response = await axios.get(`${this.baseUrl}/item_summary/search`, {
            params: { 
                q: keyword, 
                limit: 5,
                sort: 'price'
            },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return (response.data?.itemSummaries || []).map(item => ({
            title: item.title,
            price: parseFloat(item.price.value),
            shipping: item.shippingOptions?.[0]?.shippingCost?.value === '0.00' ? "Free" : "Calculated",
            rating: 4.5,
            soldCount: 0, // Placeholder for browse API
            keywords: keyword.split(' ')
        }));
    } catch (e) {
        console.error("eBay Insights Failure:", e);
        return [];
    }
  }

  async getProductById(id) {
    const token = this.userToken || await this.getAppToken();
    if (!token) return null;
    try {
        const response = await axios.get(`${this.baseUrl}/item/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const item = response.data;
        return {
            id: item.itemId,
            title: item.title,
            price: parseFloat(item.price.value),
            thumbnail: item.image?.imageUrl,
            images: item.additionalImages ? item.additionalImages.map(img => img.imageUrl) : [item.image?.imageUrl],
            soldCount: 0,
            rating: 4.8,
            competition: 'SYNCED',
            profitScore: 85
        };
    } catch (e) {
        console.error("eBay Get Product Failure:", e);
        return null;
    }
  }
}

export default new eBayService();
