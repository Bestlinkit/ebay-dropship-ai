
const axios = require('axios');

class EbayTradingService {
    constructor() {
        this.endpoint = 'https://api.ebay.com/ws/api.dll';
        this.siteId = process.env.EBAY_SITE_ID || '0';
        this.compatibilityLevel = '1355';
        this.token = process.env.EBAY_USER_TOKEN || process.env.VITE_EBAY_USER_TOKEN;
        this.devName = process.env.EBAY_DEV_ID || process.env.VITE_EBAY_DEV_ID;
        this.appName = process.env.EBAY_APP_ID || process.env.VITE_EBAY_APP_ID;
        this.certName = process.env.EBAY_CERT_ID || process.env.VITE_EBAY_CERT_ID;
    }

    async callTradingAPI(callName, xmlBody, siteId = null) {
        const isOAuth = this.token.startsWith('v^1.1');
        
        const headers = {
            'X-EBAY-API-CALL-NAME': callName,
            'X-EBAY-API-SITEID': siteId || this.siteId,
            'X-EBAY-API-COMPATIBILITY-LEVEL': this.compatibilityLevel,
            'X-EBAY-API-DEV-NAME': this.devName,
            'X-EBAY-API-APP-NAME': this.appName,
            'X-EBAY-API-CERT-NAME': this.certName,
            'Content-Type': 'text/xml',
        };

        if (isOAuth) {
            headers['X-EBAY-API-IAF-TOKEN'] = this.token;
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const requesterCredentials = isOAuth ? '' : `
  <RequesterCredentials>
    <eBayAuthToken>${this.token}</eBayAuthToken>
  </RequesterCredentials>`;

        const fullXml = `<?xml version="1.0" encoding="utf-8"?>
<${callName}Request xmlns="urn:ebay:apis:eBLBaseComponents">
  ${requesterCredentials}
  ${xmlBody}
</${callName}Request>`;

        console.log(`\n--- EBAY TRADING REQUEST [${callName}] ---`);
        console.log('Headers:', JSON.stringify(headers, null, 2));
        console.log(fullXml);
        console.log('--- END REQUEST ---\n');

        try {
            const response = await axios.post(this.endpoint, fullXml, { headers });
            
            console.log(`\n--- EBAY TRADING RESPONSE [${callName}] ---`);
            console.log(response.data);
            console.log('--- END RESPONSE ---\n');

            return response.data;
        } catch (error) {
            console.error(`\n--- EBAY TRADING ERROR [${callName}] ---`);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            } else {
                console.error('Message:', error.message);
            }
            throw error;
        }
    }

    /**
     * AddItem using LEGACY structure (No Business Policies)
     */
    async addItem(itemData) {
        const xmlBody = `
  <Item>
    <Title>${this.escapeXml(itemData.title)}</Title>
    <Description><![CDATA[${itemData.description}]]></Description>
    <PrimaryCategory>
      <CategoryID>${itemData.categoryId}</CategoryID>
    </PrimaryCategory>
    <StartPrice currency="USD">${itemData.price}</StartPrice>
    <ConditionID>${itemData.conditionId || '1000'}</ConditionID>
    <Country>${itemData.country || 'US'}</Country>
    <Currency>${itemData.currency || 'USD'}</Currency>
    <DispatchTimeMax>3</DispatchTimeMax>
    <ListingDuration>${itemData.duration || 'GTC'}</ListingDuration>
    <ListingType>FixedPriceItem</ListingType>
    <Quantity>${itemData.quantity || '1'}</Quantity>
    <PictureDetails>
      ${(itemData.images || []).map(url => `<PictureURL>${this.escapeXml(url)}</PictureURL>`).join('')}
    </PictureDetails>
    <PostalCode>${itemData.postalCode || '95125'}</PostalCode>
    
    <PaymentMethods>PayPal</PaymentMethods>
    <PayPalEmailAddress>${itemData.paypalEmail || 'support@geonoyc.com'}</PayPalEmailAddress>
    
    <ReturnPolicy>
      <ReturnsAcceptedOption>ReturnsAccepted</ReturnsAcceptedOption>
      <RefundOption>MoneyBack</RefundOption>
      <ReturnsWithinOption>Days_30</ReturnsWithinOption>
      <Description>30 day money back returns.</Description>
      <ShippingCostPaidByOption>Buyer</ShippingCostPaidByOption>
    </ReturnPolicy>
    
    <ShippingDetails>
      <ShippingType>Flat</ShippingType>
      <ShippingServiceOptions>
        <ShippingServicePriority>1</ShippingServicePriority>
        <ShippingService>USPSPriority</ShippingService>
        <ShippingServiceCost>0.00</ShippingServiceCost>
      </ShippingServiceOptions>
    </ShippingDetails>
  </Item>`;

        return this.callTradingAPI('AddItem', xmlBody);
    }

    async getMyeBaySelling() {
        const xmlBody = `
  <ActiveList>
    <Include>true</Include>
    <Pagination>
      <EntriesPerPage>50</EntriesPerPage>
      <PageNumber>1</PageNumber>
    </Pagination>
  </ActiveList>`;
        return this.callTradingAPI('GetMyeBaySelling', xmlBody);
    }

    escapeXml(unsafe) {
        return unsafe.replace(/[<>&"']/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '"': return '&quot;';
                case "'": return '&apos;';
            }
        });
    }
}

module.exports = new EbayTradingService();
