import axios from 'axios';

class AliExpressService {
  constructor() {
    this.useMock = true; // Set to true for initial testing, false when backend is ready
  }

  /**
   * Searches AliExpress for matching products.
   * In a production environment, this would call a Cloud Function
   * that uses a headless browser (Puppeteer) to scrape the live data.
   */
  async searchProducts(keyword) {
    if (this.useMock) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return [
        {
          id: 'AE_1005001',
          title: `Premium ${keyword} - Direct from Factory`,
          price: 12.45,
          shipping: 0.00,
          deliveryTime: '12-15 Days',
          rating: 4.8,
          orders: 1250,
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400',
          source: 'AliExpress',
          url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(keyword)}`
        },
        {
          id: 'AE_1005002',
          title: `Budget ${keyword} with High Quality Materials`,
          price: 8.99,
          shipping: 2.50,
          deliveryTime: '15-20 Days',
          rating: 4.6,
          orders: 3400,
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
          source: 'AliExpress',
          url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(keyword)}`
        }
      ];
    }

    try {
      // Future integration: Call our Firebase Cloud Function Scraper
      const response = await axios.get('/api/scrape-aliexpress', {
        params: { q: keyword }
      });
      return response.data;
    } catch (e) {
      console.error("AliExpress Scraping failed", e);
      return [];
    }
  }

  calculateProfit(ebayPrice, sourcePrice, shipping) {
    const totalCost = sourcePrice + shipping;
    const ebayFee = ebayPrice * 0.12; // 12% avg fee
    const profit = ebayPrice - totalCost - ebayFee;
    const margin = (profit / ebayPrice) * 100;
    
    return {
      profit: profit.toFixed(2),
      margin: margin.toFixed(1),
      isViable: margin > 20 && profit > 5
    };
  }
}

export default new AliExpressService();
