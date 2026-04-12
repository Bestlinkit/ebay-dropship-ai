import axios from 'axios';

class EbayTradingService {
  constructor() {
    this.useMock = true;
  }

  // XML template for AddItem call (Trading API)
  generateAddItemLegacyXML(itemData) {
    return `<?xml version="1.0" encoding="utf-8"?>
    <AddItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials>
        <eBayAuthToken>${localStorage.getItem('ebay_auth_token')}</eBayAuthToken>
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
        <PaymentMethods>PayPal</PaymentMethods>
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

  async publishItem(itemData) {
    if (this.useMock) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { 
        success: true, 
        listingId: 'EBAY-' + Math.random().toString(36).substring(7).toUpperCase(),
        url: 'https://www.ebay.com/itm/example'
      };
    }

    const xml = this.generateAddItemLegacyXML(itemData);
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
