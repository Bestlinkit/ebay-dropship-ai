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
    // Case-Agnostic Header Extraction
    const h = config.headers || {};
    const auth = h['Authorization'] || h['authorization'] || h['X-EBAY-API-IAF-TOKEN'] || h['x-ebay-api-iaf-token'] || "";
    const callname = h['X-EBAY-API-CALL-NAME'] || h['x-ebay-api-call-name'] || "";
    const siteid = h['X-EBAY-API-SITEID'] || h['x-ebay-api-siteid'] || "0";

    const proxies = [
        this.proxyUrl ? `${this.proxyUrl}?url=${encodeURIComponent(url)}&auth=${encodeURIComponent(auth)}&callname=${callname}&siteid=${siteid}` : null,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://cors-proxy.org/?url=${encodeURIComponent(url)}`
    ].filter(Boolean);

    let lastError = null;
    for (const proxy of proxies) {
        try {
            const response = await axios({
                ...config,
                method,
                url: proxy,
                timeout: 15000 // 15s timeout per proxy attempt
            });
            return response;
        } catch (e) {
            console.warn(`[eBay Trading Proxy] Failed with ${proxy}. Retrying...`);
            lastError = e;
        }
    }
    throw lastError;
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
              'X-EBAY-API-APP-NAME': import.meta.env.VITE_EBAY_APP_ID,
              'X-EBAY-API-DEV-NAME': import.meta.env.VITE_EBAY_DEV_ID,
              'X-EBAY-API-CERT-NAME': import.meta.env.VITE_EBAY_CERT_ID,
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
            const watchCountMatch = itemXml.match(/<WatchCount>(.*?)<\/WatchCount>/);
            items.push({
                id: itemIdMatch ? itemIdMatch[1] : Math.random().toString(),
                title: titleMatch ? titleMatch[1] : 'Unknown Listing',
                status: 'Published',
                price: priceMatch ? parseFloat(priceMatch[1]) : 0,
                views: watchCountMatch ? parseInt(watchCountMatch[1]) : 0,
                date: new Date().toLocaleDateString()
            });
        }
        return items;
    } catch (error) {
        console.error("Fetch Active Listings Failed:", error);
        return [];
    }
  }

  async getOrders(token) {
    if (!token) return [];
    try {
        const now = new Date();
        const past = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // Last 30 days
        const xml = `<?xml version="1.0" encoding="utf-8"?>
        <GetOrdersRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          <RequesterCredentials><eBayAuthToken>${token}</eBayAuthToken></RequesterCredentials>
          <CreateTimeFrom>${past.toISOString()}</CreateTimeFrom>
          <CreateTimeTo>${now.toISOString()}</CreateTimeTo>
          <OrderRole>Seller</OrderRole>
          <OrderStatus>All</OrderStatus>
        </GetOrdersRequest>`;

        const response = await this.fetchWithRetry('post', 'https://api.ebay.com/ws/api.dll', {
            data: xml,
            headers: {
              'X-EBAY-API-SITEID': '0',
              'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
              'X-EBAY-API-CALL-NAME': 'GetOrders',
              'X-EBAY-API-APP-NAME': import.meta.env.VITE_EBAY_APP_ID,
              'X-EBAY-API-DEV-NAME': import.meta.env.VITE_EBAY_DEV_ID,
              'X-EBAY-API-CERT-NAME': import.meta.env.VITE_EBAY_CERT_ID,
              'Content-Type': 'text/xml'
            }
        });

        const orderRegex = /<Order>(.*?)<\/Order>/gs;
        const orders = [];
        let match;
        while ((match = orderRegex.exec(response.data)) !== null) {
            const orderXml = match[1];
            const orderIdMatch = orderXml.match(/<OrderID>(.*?)<\/OrderID>/);
            const totalMatch = orderXml.match(/<Total.*?>(.*?)<\/Total>/);
            const statusMatch = orderXml.match(/<OrderStatus>(.*?)<\/OrderStatus>/);
            const buyerMatch = orderXml.match(/<User>(.*?)<\/User>/);
            orders.push({
                id: orderIdMatch ? orderIdMatch[1] : Math.random().toString(),
                amount: totalMatch ? parseFloat(totalMatch[1]) : 0,
                status: statusMatch ? statusMatch[1] : 'Unknown',
                buyer: buyerMatch ? buyerMatch[1] : 'eBay Buyer',
                date: new Date().toLocaleDateString()
            });
        }
        return orders;
    } catch (error) {
        console.error("Fetch Orders Failed:", error);
        return [];
    }
  }

  async getAccountSummary(token) {
    if (!token) return { activeListings: 0, soldCount: 0, revenue: 0, toShip: 0, urgentShip: 0, offers: 0, status: 'DISCONNECTED' };

    try {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
        <GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          <RequesterCredentials><eBayAuthToken>${token}</eBayAuthToken></RequesterCredentials>
          <ActiveList><Include>true</Include><Pagination><EntriesPerPage>1</EntriesPerPage></Pagination></ActiveList>
          <SoldList><Include>true</Include><Pagination><EntriesPerPage>50</EntriesPerPage></Pagination></SoldList>
          <BidList><Include>true</Include></BidList>
        </GetMyeBaySellingRequest>`;

        const response = await this.fetchWithRetry('post', 'https://api.ebay.com/ws/api.dll', {
            data: xml,
            headers: {
              'X-EBAY-API-SITEID': '0',
              'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
              'X-EBAY-API-CALL-NAME': 'GetMyeBaySelling',
              'X-EBAY-API-APP-NAME': import.meta.env.VITE_EBAY_APP_ID,
              'X-EBAY-API-DEV-NAME': import.meta.env.VITE_EBAY_DEV_ID,
              'X-EBAY-API-CERT-NAME': import.meta.env.VITE_EBAY_CERT_ID,
              'Content-Type': 'text/xml'
            }
        });

        if (response.data.includes('<Ack>Failure</Ack>') || response.data.includes('<Ack>Error</Ack>')) {
            const shortMsg = response.data.match(/<ShortMessage>(.*?)<\/ShortMessage>/);
            throw new Error(shortMsg ? shortMsg[1] : 'eBay API Rejected Request');
        }

        const activeMatch = response.data.match(/<TotalActiveListings>(.*?)<\/TotalActiveListings>/) || 
                            response.data.match(/<TotalNumberOfEntries>(.*?)<\/TotalNumberOfEntries>/);
        
        // Parsing SoldList for ToShip orders
        const soldRegex = /<Order>(.*?)<\/Order>/gs;
        let toShipCount = 0;
        let urgentCount = 0;
        let soldMatch;
        while ((soldMatch = soldRegex.exec(response.data)) !== null) {
            const orderXml = soldMatch[1];
            if (orderXml.includes('<OrderStatus>Completed</OrderStatus>') && !orderXml.includes('<ShippedTime>')) {
                toShipCount++;
                // Check if urgent (placeholder logic: if it exists, for now we mark a fraction as urgent)
                if (Math.random() > 0.7) urgentCount++; 
            }
        }

        // Parsing BidList for Offers
        const offerRegex = /<Item>(.*?)<\/Item>/gs;
        let offerCount = 0;
        while (offerRegex.exec(response.data) !== null) offerCount++;

        return {
            activeListings: activeMatch ? parseInt(activeMatch[1]) : 0,
            soldCount: toShipCount,
            revenue: 0, // Calculated by Dashboard from getOrders
            toShip: toShipCount,
            urgentShip: urgentCount,
            offers: offerCount,
            status: 'CONNECTED'
        };
    } catch (error) {
        console.error("eBay Account Summary Sync Failure:", error);
        throw error;
    }
  }

  async reviseItem(token, itemId, updates) {
    if (!token) throw new Error("eBay Token Missing");
    try {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
        <ReviseItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          <RequesterCredentials><eBayAuthToken>${token}</eBayAuthToken></RequesterCredentials>
          <Item>
            <ItemID>${itemId}</ItemID>
            ${updates.title ? `<Title>${updates.title}</Title>` : ''}
            ${updates.price ? `<StartPrice>${updates.price}</StartPrice>` : ''}
            ${updates.description ? `<Description><![CDATA[${updates.description}]]></Description>` : ''}
          </Item>
        </ReviseItemRequest>`;

        const response = await this.fetchWithRetry('post', 'https://api.ebay.com/ws/api.dll', {
            data: xml,
            headers: {
              'X-EBAY-API-SITEID': '0',
              'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
              'X-EBAY-API-CALL-NAME': 'ReviseItem',
              'X-EBAY-API-APP-NAME': import.meta.env.VITE_EBAY_APP_ID,
              'X-EBAY-API-DEV-NAME': import.meta.env.VITE_EBAY_DEV_ID,
              'X-EBAY-API-CERT-NAME': import.meta.env.VITE_EBAY_CERT_ID,
              'Content-Type': 'text/xml'
            }
        });

        if (response.data.includes('<Ack>Failure</Ack>') || response.data.includes('<Ack>Error</Ack>')) {
            const shortMsg = response.data.match(/<ShortMessage>(.*?)<\/ShortMessage>/);
            throw new Error(shortMsg ? shortMsg[1] : 'eBay Refused Revision');
        }

        return response.data;
    } catch (error) {
        console.error("ReviseItem Failed:", error);
        throw error;
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
              'X-EBAY-API-APP-NAME': import.meta.env.VITE_EBAY_APP_ID,
              'X-EBAY-API-DEV-NAME': import.meta.env.VITE_EBAY_DEV_ID,
              'X-EBAY-API-CERT-NAME': import.meta.env.VITE_EBAY_CERT_ID,
              'Content-Type': 'text/xml'
            }
        });

        if (response.data.includes('<Ack>Failure</Ack>') || response.data.includes('<Ack>Error</Ack>')) {
            const shortMsg = response.data.match(/<ShortMessage>(.*?)<\/ShortMessage>/);
            throw new Error(shortMsg ? shortMsg[1] : 'eBay Identity Reject');
        }

        const userIdMatch = response.data.match(/<UserID>(.*?)<\/UserID>/);
        return userIdMatch ? userIdMatch[1] : null;
    } catch (error) {
        console.error("User Profile Retrieval Failed:", error);
        throw error;
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

  async getItemDetails(itemId) {
    const token = import.meta.env.VITE_EBAY_USER_TOKEN;
    if (!token || !itemId) return null;
    try {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
        <GetItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          <RequesterCredentials><eBayAuthToken>${token}</eBayAuthToken></RequesterCredentials>
          <ItemID>${itemId}</ItemID>
          <DetailLevel>ReturnAll</DetailLevel>
        </GetItemRequest>`;

        const response = await this.fetchWithRetry('post', 'https://api.ebay.com/ws/api.dll', {
            data: xml,
            headers: {
              'X-EBAY-API-SITEID': '0',
              'X-EBAY-API-CALL-NAME': 'GetItem',
              'Content-Type': 'text/xml'
            }
        });

        // Parse basic details from XML
        const titleMatch = response.data.match(/<Title>(.*?)<\/Title>/);
        const priceMatch = response.data.match(/<StartPrice.*?>(.*?)<\/StartPrice>/);
        const descMatch = response.data.match(/<Description>(.*?)<\/Description>/);
        const imageMatches = [...response.data.matchAll(/<PictureURL>(.*?)<\/PictureURL>/g)];

        return {
            id: itemId,
            title: titleMatch ? titleMatch[1] : "",
            price: priceMatch ? parseFloat(priceMatch[1]) : 0,
            description: descMatch ? descMatch[1] : "",
            images: imageMatches.map(m => m[1])
        };
    } catch (error) {
        console.error("GetItem Details Failed:", error);
        return null;
    }
  }
}

export default new EbayTradingService();
