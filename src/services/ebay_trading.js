import axios from 'axios';

class EbayTradingService {
  constructor() {
    this.useMock = false; // Forced live for production transition
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

        const response = await axios.post('https://api.ebay.com/ws/api.dll', xml, {
            headers: {
              'X-EBAY-API-SITEID': '0',
              'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
              'X-EBAY-API-CALL-NAME': 'GetMyeBaySelling',
              'Content-Type': 'text/xml'
            }
        });

        // Simple regex parsing for light footprint (or use a parser if needed)
        const activeCountMatch = response.data.match(/<TotalNumberOfEntries>(\d+)<\/TotalNumberOfEntries>/);
        const activeListings = activeCountMatch ? parseInt(activeCountMatch[1]) : 0;

        return {
            activeListings,
            soldCount: 0, // Would require GetSellerTransactions for full accuracy
            revenue: 0,
            status: 'CONNECTED'
        };
    } catch (error) {
        console.error("eBay Account Summary Fetch Failed:", error);
        return { activeListings: 0, soldCount: 0, revenue: 0, status: 'ERROR' };
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

        const response = await axios.post('https://api.ebay.com/ws/api.dll', xml, {
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
        console.error("eBay User Profile Fetch Failed:", error);
        return null;
    }
  }

  async publishItem(itemData, token) {
    if (!token) throw new Error("eBay Token Missing");

    const xml = this.generateAddItemLegacyXML(itemData, token);
    const response = await axios.post('https://api.ebay.com/ws/api.dll', xml, {
      headers: {
        'X-EBAY-API-SITEID': '0',
        'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
        'X-EBAY-API-CALL-NAME': 'AddItem',
        'Content-Type': 'text/xml'
      }
    });

    return response.data;
  }
}

export default new EbayTradingService();
