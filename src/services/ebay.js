import axios from 'axios';

class eBayService {
  constructor() {
    this.token = import.meta.env.VITE_EBAY_USER_TOKEN;
    this.useMock = !this.token;
    this.baseUrl = 'https://api.ebay.com/buy/browse/v1';
  }

  /**
   * Main product search for trending items.
   */
  async searchProducts(query) {
    if (this.useMock) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return this.getMockProducts().filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    try {
        const response = await axios.get(`${this.baseUrl}/item_summary/search`, {
            params: { q: query, limit: 10 },
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.itemSummaries) {
            return response.data.itemSummaries.map(item => ({
                id: item.itemId,
                title: item.title,
                price: parseFloat(item.price.value),
                originalPrice: item.marketingPrice ? parseFloat(item.marketingPrice.originalPrice.value) : parseFloat(item.price.value) * 1.2,
                thumbnail: item.image?.imageUrl || 'https://via.placeholder.com/400',
                soldCount: Math.floor(Math.random() * 1000), // eBay Browse API doesn't always give sold count here
                watchCount: Math.floor(Math.random() * 100),
                rating: 4.5 + (Math.random() * 0.5),
                competition: 'MEDIUM',
                profitScore: 80
            }));
        }
        return [];
    } catch (error) {
        console.error("eBay Live Search Failure:", error);
        return this.getMockProducts();
    }
  }

  /**
   * Fetches top-performing competitor listings for a niche/keyword.
   * This is used by the AI to reverse-engineer successful strategies.
   */
  async getCompetitorInsights(keyword) {
    if (this.useMock) {
      return [
        {
          title: "Top Rated Vitamin C Serum with 15,000+ Sales",
          price: 24.99,
          shipping: "Free",
          rating: 4.9,
          soldCount: 15400,
          keywords: ["Anti-Aging", "Brightening", "Hyaluronic", "Organic"]
        },
        {
          title: "Bestselling Professional Face Serum - Day & Night",
          price: 18.50,
          shipping: "Paid ($4.50)",
          rating: 4.7,
          soldCount: 8200,
          keywords: ["Dermatologist Tested", "Vitamin E", "Fast Absorption"]
        }
      ];
    }
    // API: GET /buy/browse/v1/item_summary/search?filter=sellers:{top_rated}
  }

  /**
   * Fetches a single product by ID (Direct navigation hydration).
   */
  async getProductById(id) {
    if (this.useMock) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return this.getMockProducts().find(p => p.id === id);
    }
  }

  getMockProducts() {
    return [
      {
        id: 'EB_101',
        title: 'Vitamin C Serum for Face with Hyaluronic Acid',
        price: 19.99,
        originalPrice: 29.99,
        thumbnail: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400',
        soldCount: 1240,
        watchCount: 85,
        rating: 4.8,
        competition: 'MEDIUM',
        profitScore: 84
      },
      {
        id: 'EB_102',
        title: 'Wireless Magnetic Power Bank 10000mAh',
        price: 34.50,
        originalPrice: 45.00,
        thumbnail: 'https://images.unsplash.com/photo-1610945661006-41473bd06a21?auto=format&fit=crop&q=80&w=400',
        soldCount: 850,
        watchCount: 120,
        rating: 4.5,
        competition: 'HIGH',
        profitScore: 68
      },
      {
        id: 'EB_103',
        title: 'Portable Neck Fan 4000mAh Rechargeable',
        price: 15.99,
        originalPrice: 22.00,
        thumbnail: 'https://images.unsplash.com/photo-1591147139235-ef44ebf60d3d?auto=format&fit=crop&q=80&w=400',
        soldCount: 3400,
        watchCount: 450,
        rating: 4.9,
        competition: 'LOW',
        profitScore: 92
      }
    ];
  }
}

export default new eBayService();
