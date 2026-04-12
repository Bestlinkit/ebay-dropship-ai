import axios from 'axios';

class EbayTradingService {
  constructor() {
    this.useMock = false; // Forced live for production transition
    
    // Private Bridge Configuration (Production-Grade Free Proxy)
    this.proxyUrl = import.meta.env.VITE_PROXY_URL;
    
    this.route = (targetUrl) => {
      if (!this.proxyUrl) {
          return `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      }
      return `${this.proxyUrl}?url=${encodeURIComponent(targetUrl)}`;
    };
  }

  // XML template for AddItem call (Trading API)
  generateAddItemLegacyXML(itemData, token) {
    return `<?xml version="1.0" encoding="utf-8"?>
    <AddItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials>
        <eBayAuthToken>${token}</eBayAuthToken>
      </RequesterCredentials>
      <ErrorLanguage>en_US</ErrorLanguage>
      <WarningLevel>High</WarningLevel>
      <Item>
        <Title>${itemData.title}</Title>
        <Description><![CDATA[${itemData.description}]]></Description>
        <PrimaryCategory>
          <CategoryID>${itemData.categoryId}</CategoryID>
        </PrimaryCategory>
        <StartPrice>${itemData.price}</StartPrice>
        <ConditionID>1000</ConditionID>
        <Country>US</Country>
        <Currency>USD</Currency>
        <DispatchTimeMax>3</DispatchTimeMax>
        <ListingDuration>GTC</ListingDuration>
        <ListingType>FixedPriceItem</ListingType>
        <PictureDetails>
          ${itemData.images.map(url => `<PictureURL>${url}</PictureURL>`).join('\n')}
        </PictureDetails>
        <PostalCode>95125</PostalCode>
        <Quantity>10</Quantity>
        <ReturnPolicy>
          <ReturnsAcceptedOption>ReturnsAccepted</ReturnsAcceptedOption>
          <RefundOption>MoneyBack</RefundOption>
          <ReturnsWithinOption>Days_30</ReturnsWithinOption>
        </ReturnPolicy>
        <ShippingDetails>
          <ShippingType>Flat</ShippingType>
          <ShippingServiceOptions>
            <ShippingService>USPSPriority</ShippingService>
            <ShippingServiceCost>0.00</ShippingServiceCost>
          </ShippingServiceOptions>
        </ShippingDetails>
      </Item>
    </AddItemRequest>`;
  }

  /**
   * Fetches real account summary for the dashboard
   */
  async fetchWithRetry(method, url, config = {}) {
    const proxies = [
        this.proxyUrl ? `${this.proxyUrl}?url=${encodeURIComponent(url)}` : null,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://cors-proxy.org/?url=${encodeURIComponent(url)}`
    ].filter(Boolean);

    let lastError = null;
    for (const proxy of proxies) {
        try {
            const response = await axios({
                ...config,
                method,
                url: proxy
            });
            return response;
        } catch (e) {
            console.warn(`[eBay Trading Proxy] Failed with ${proxy}. Retrying...`);
            lastError = e;
        }
    }
    throw lastError;
  }

  async getAccountSummary(token) {
    if (!token) return { activeListings: 0, soldCount: 0, revenue: 0, status: 'DISCONNECTED' };

    try {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
        <GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          <RequesterCredentials><eBayAuthToken>${token}</eBayAuthToken></RequesterCredentials>
          <ActiveList><Include>true</Include><Pagination><EntriesPerPage>1</EntriesPerPage></Pagination></ActiveList>
        </GetMyeBaySellingRequest>`;

        const response = await this.fetchWithRetry('post', 'https://api.ebay.com/ws/api.dll', {
            data: xml,
            headers: {
              'X-EBAY-API-SITEID': '0',
              'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
              'X-EBAY-API-CALL-NAME': 'GetMyeBaySelling',
              'Content-Type': 'text/xml'
            }
        });

        const activeMatch = response.data.match(/<TotalActiveListings>(.*?)<\/TotalActiveListings>/);
        return {
            activeListings: activeMatch ? parseInt(activeMatch[1]) : 0,
            soldCount: 0,
            revenue: 0,
            status: 'CONNECTED'
        };
    } catch (error) {
        console.error("eBay Account Summary Sync Failure:", error);
        return { activeListings: 0, soldCount: 0, revenue: 0, status: 'ERROR' };
    }
  }

  async getActiveListings(token) {
    if (!token) return [];
    try {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
        <GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          <RequesterCredentials><eBayAuthToken>${token}</eBayAuthToken></RequesterCredentials>
          <ActiveList><Include>true</Include><Pagination><EntriesPerPage>50</EntriesPerPage></Pagination></ActiveList>
        </GetMyeBaySellingRequest>`;

        const response = await this.fetchWithRetry('post', 'https://api.ebay.com/ws/api.dll', {
            data: xml,
            headers: {
              'X-EBAY-API-SITEID': '0',
              'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
              'X-EBAY-API-CALL-NAME': 'GetMyeBaySelling',
              'Content-Type': 'text/xml'
            }
        });

        const itemRegex = /<Item>(.*?)<\/Item>/gs;
        const items = [];
        let match;
        while ((match = itemRegex.exec(response.data)) !== null) {
            const itemXml = match[1];
            const titleMatch = itemXml.match(/<Title>(.*?)<\/Title>/);
            const itemIdMatch = itemXml.match(/<ItemID>(.*?)<\/ItemID>/);
            const priceMatch = itemXml.match(/<CurrentPrice.*?>(.*?)<\/CurrentPrice>/);
            items.push({
                id: itemIdMatch ? itemIdMatch[1] : Math.random().toString(),
                title: titleMatch ? titleMatch[1] : 'Unknown Listing',
                status: 'Published',
                price: priceMatch ? parseFloat(priceMatch[1]) : 0
            });
        }
        return items;
    } catch (error) {
        return [];
    }
  }

  async getUserProfile(token) {
    if (!token) return null;
    try {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
        <GetUserRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          <RequesterCredentials><eBayAuthToken>${token}</eBayAuthToken></RequesterCredentials>
          <DetailLevel>ReturnAll</DetailLevel>
        </GetUserRequest>`;

        const response = await this.fetchWithRetry('post', 'https://api.ebay.com/ws/api.dll', {
            data: xml,
            headers: {
              'X-EBAY-API-SITEID': '0',
              'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
              'X-EBAY-API-CALL-NAME': 'GetUser',
              'Content-Type': 'text/xml'
            }
        });

        const userIdMatch = response.data.match(/<UserID>(.*?)<\/UserID>/);
        return userIdMatch ? userIdMatch[1] : null;
    } catch (error) {
        return null;
    }
  }

  async publishItem(itemData, token) {
    if (!token) throw new Error("eBay Token Missing");
    const xml = this.generateAddItemLegacyXML(itemData, token);
    const response = await this.fetchWithRetry('post', 'https://api.ebay.com/ws/api.dll', {
      data: xml,
      headers: {
        'X-EBAY-API-SITEID': '0',
        'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
        'X-EBAY-API-CALL-NAME': 'AddItem',
        'Content-Type': 'text/xml'
      }
    });
    return response.data;
  }

  async refreshEbayToken(refreshToken) {
    if (!refreshToken) return null;
    try {
        const platformBase64 = btoa(`${import.meta.env.VITE_EBAY_APP_ID}:${import.meta.env.VITE_EBAY_CERT_ID}`);
        const response = await this.fetchWithRetry('post', 'https://api.ebay.com/identity/v1/oauth2/token', {
            data: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                scope: 'https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.marketing https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.fulfillment'
            }), 
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${platformBase64}`
            }
        });
        return response.data;
    } catch (e) {
        return null;
    }
  }
}

export default new EbayTradingService();
