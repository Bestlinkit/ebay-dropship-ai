import axios from 'axios';

class EbayTradingService {
  constructor() {
    this.useMock = false; // Forced live for production transition
    // Deep Bridge: Bypasses browser CORS restrictions for Free Tier
    this.corsRelay = (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`;
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
  async getAccountSummary(token) {
    if (!token) {
        return {
            activeListings: 0,
            soldCount: 0,
            revenue: 0,
            status: 'DISCONNECTED'
        };
    }

    try {
        // XML for GetMyeBaySelling (ActiveList only)
        const xml = `<?xml version="1.0" encoding="utf-8"?>
        <GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          <RequesterCredentials>
            <eBayAuthToken>${token}</eBayAuthToken>
          </RequesterCredentials>
          <ActiveList>
            <Include>true</Include>
            <Pagination>
              <EntriesPerPage>1</EntriesPerPage>
            </Pagination>
          </ActiveList>
        </GetMyeBaySellingRequest>`;

        const response = await axios.post(this.corsRelay('https://api.ebay.com/ws/api.dll'), xml, {
            headers: {
              'X-EBAY-API-SITEID': '0',
              'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
              'X-EBAY-API-CALL-NAME': 'GetMyeBaySelling',
              'Content-Type': 'text/xml'
            }
        });

        // Simple regex parsing for light footprint (or use a parser if needed)
        const activeCountMatch = response.data.match(/<TotalNumberOfEntries>(\d+)<\/TotalNumberOfEntries>/);
        // Handle XML Errors
        const errorMatch = response.data.match(/<ShortMessage>(.*?)<\/ShortMessage>/);
        const errorCodeMatch = response.data.match(/<ErrorCode>(.*?)<\/ErrorCode>/);
        
        if (errorMatch && !response.data.includes('<Ack>Success</Ack>') && !response.data.includes('<Ack>Warning</Ack>')) {
            throw new Error(`${errorMatch[1]} (Code ${errorCodeMatch[1]})`);
        }

        const activeMatch = response.data.match(/<TotalActiveListings>(.*?)<\/TotalActiveListings>/);
        return {
            activeListings: activeMatch ? parseInt(activeMatch[1]) : 0,
            soldCount: 0, // Would require GetSellerTransactions for full accuracy
            revenue: 0, // Financial data often requires a different call or specific scope
            status: 'CONNECTED'
        };
    } catch (error) {
        console.error("eBay Account Summary Sync Failure:", error);
        return { activeListings: 0, soldCount: 0, revenue: 0, status: 'ERROR' };
    }
  }

  /**
   * Fetches the actual list of active listings for the My Products page.
   */
  async getActiveListings(token) {
    if (!token) return [];
    try {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
        <GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          <RequesterCredentials>
            <eBayAuthToken>${token}</eBayAuthToken>
          </RequesterCredentials>
          <ActiveList>
            <Include>true</Include>
            <Pagination>
              <EntriesPerPage>50</EntriesPerPage>
            </Pagination>
          </ActiveList>
        </GetMyeBaySellingRequest>`;

        const response = await axios.post(this.corsRelay('https://api.ebay.com/ws/api.dll'), xml, {
            headers: {
              'X-EBAY-API-SITEID': '0',
              'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
              'X-EBAY-API-CALL-NAME': 'GetMyeBaySelling',
              'Content-Type': 'text/xml'
            }
        });

        // Parse individual items. This is a quick regex approach for performance.
        const itemRegex = /<Item>(.*?)<\/Item>/gs;
        const items = [];
        let match;

        while ((match = itemRegex.exec(response.data)) !== null) {
            const itemXml = match[1];
            const titleMatch = itemXml.match(/<Title>(.*?)<\/Title>/);
            const itemIdMatch = itemXml.match(/<ItemID>(.*?)<\/ItemID>/);
            const priceMatch = itemXml.match(/<BuyItNowPrice.*?>(.*?)<\/BuyItNowPrice>/) || itemXml.match(/<CurrentPrice.*?>(.*?)<\/CurrentPrice>/);
            const quantityMatch = itemXml.match(/<Quantity>(.*?)<\/Quantity>/);
            const viewsMatch = itemXml.match(/<WatchCount>(.*?)<\/WatchCount>/);

            items.push({
                id: itemIdMatch ? itemIdMatch[1] : Math.random().toString(),
                title: titleMatch ? titleMatch[1] : 'Unknown Listing',
                status: 'Published',
                date: new Date().toISOString().split('T')[0],
                price: priceMatch ? parseFloat(priceMatch[1]) : 0,
                profit: 0, 
                views: viewsMatch ? parseInt(viewsMatch[1]) : 0,
                quantity: quantityMatch ? parseInt(quantityMatch[1]) : 0
            });
        }

        return items;
    } catch (error) {
        console.error("eBay Active Listings Fetch Failed:", error);
        return [];
    }
  }

  /**
   * Fetches the user profile (UserID) to verify connection identity.
   */
  async getUserProfile(token) {
    if (!token) return null;

    try {
        const xml = `<?xml version="1.0" encoding="utf-8"?>
        <GetUserRequest xmlns="urn:ebay:apis:eBLBaseComponents">
          <RequesterCredentials>
            <eBayAuthToken>${token}</eBayAuthToken>
          </RequesterCredentials>
          <DetailLevel>ReturnAll</DetailLevel>
        </GetUserRequest>`;

        const response = await axios.post(this.corsRelay('https://api.ebay.com/ws/api.dll'), xml, {
            headers: {
              'X-EBAY-API-SITEID': '0',
              'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
              'X-EBAY-API-CALL-NAME': 'GetUser',
              'Content-Type': 'text/xml'
            }
        });

        const userIdMatch = response.data.match(/<UserID>(.*?)<\/UserID>/);
        if (userIdMatch) return userIdMatch[1];

        // If no UserID, try to find Error message
        const errorMatch = response.data.match(/<ShortMessage>(.*?)<\/ShortMessage>/);
        const errorCodeMatch = response.data.match(/<ErrorCode>(.*?)<\/ErrorCode>/);
        
        if (errorMatch) {
            throw new Error(`${errorMatch[1]} (Code ${errorCodeMatch ? errorCodeMatch[1] : '?'})`);
        }
        
        return null;
    } catch (error) {
        console.error("eBay User Profile Fetch Failed:", error);
        throw error; // Let the caller decide how to handle
    }
}

  async publishItem(itemData, token) {
    if (!token) throw new Error("eBay Token Missing");

    const xml = this.generateAddItemLegacyXML(itemData, token);
    const response = await axios.post(this.corsRelay('https://api.ebay.com/ws/api.dll'), xml, {
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
        const response = await axios.post(this.corsRelay('https://api.ebay.com/identity/v1/oauth2/token'), 
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                scope: 'https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.marketing https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.fulfillment'
            }), 
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${platformBase64}`
                }
            }
        );

        return response.data;
    } catch (e) {
        console.error("eBay Token Refresh Failed:", e);
        return null;
    }
  }
}

export default new EbayTradingService();
