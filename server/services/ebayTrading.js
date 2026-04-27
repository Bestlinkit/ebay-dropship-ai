
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
     * AddItem using LEGACY structure (Direct inline details)
     */
    async addItem(itemData) {
        const xmlBody = `
  <Item>
    <Title>${this.escapeXml(itemData.title)}</Title>
    <Description><![CDATA[${itemData.description}]]></Description>
    <PrimaryCategory>
      <CategoryID>${itemData.categoryId}</CategoryID>
    </PrimaryCategory>
    ${itemData.variants && itemData.variants.length > 0 ? `
    <Variations>
      <VariationSpecificsSet>
        ${(itemData.variationSpecificsSet || []).map(set => `
          <NameValueList>
            <Name>${this.escapeXml(set.name)}</Name>
            ${set.value.map(val => `<Value>${this.escapeXml(val)}</Value>`).join('')}
          </NameValueList>
        `).join('')}
      </VariationSpecificsSet>
      ${itemData.variants.map(v => `
        <Variation>
          <SKU>${this.escapeXml(v.sku)}</SKU>
          <StartPrice currency="USD">${v.price}</StartPrice>
          <Quantity>${v.inventory}</Quantity>
          <VariationSpecifics>
            ${(v.specifics || []).map(s => `
              <NameValueList>
                <Name>${this.escapeXml(s.name)}</Name>
                <Value>${this.escapeXml(s.value)}</Value>
              </NameValueList>
            `).join('')}
          </VariationSpecifics>
        </Variation>
      `).join('')}
    </Variations>
    ` : `
    <StartPrice currency="USD">${itemData.price}</StartPrice>
    <Quantity>${itemData.quantity || '1'}</Quantity>
    `}

    <ConditionID>${itemData.conditionId || '1000'}</ConditionID>
    <Country>${itemData.country || 'US'}</Country>
    <Currency>${itemData.currency || 'USD'}</Currency>
    <DispatchTimeMax>3</DispatchTimeMax>
    <ListingDuration>${itemData.duration || 'GTC'}</ListingDuration>
    <ListingType>FixedPriceItem</ListingType>
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

    ${itemData.itemSpecifics?.nameValueList ? `
    <ItemSpecifics>
      ${itemData.itemSpecifics.nameValueList.map(spec => `
        <NameValueList>
          <Name>${this.escapeXml(spec.name)}</Name>
          ${spec.value.map(val => `<Value>${this.escapeXml(val)}</Value>`).join('')}
        </NameValueList>
      `).join('')}
    </ItemSpecifics>
    ` : ''}
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

    async getUser() {
        return this.callTradingAPI('GetUser', '<DetailLevel>ReturnAll</DetailLevel>');
    }

    async getActiveListings() {
        const xmlBody = `
  <ActiveList>
    <Include>true</Include>
    <Pagination>
      <EntriesPerPage>100</EntriesPerPage>
      <PageNumber>1</PageNumber>
    </Pagination>
  </ActiveList>`;
        return this.callTradingAPI('GetMyeBaySelling', xmlBody);
    }

    async getOrders() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const xmlBody = `
  <NumberOfDays>30</NumberOfDays>
  <OrderRole>Seller</OrderRole>
  <OrderStatus>Completed</OrderStatus>`;
        return this.callTradingAPI('GetOrders', xmlBody);
    }

    async getItem(itemId) {
        const xmlBody = `<ItemID>${itemId}</ItemID><DetailLevel>ReturnAll</DetailLevel>`;
        return this.callTradingAPI('GetItem', xmlBody);
    }

    async reviseItem(itemId, itemData) {
        let itemXml = `<ItemID>${itemId}</ItemID>`;
        if (itemData.title) itemXml += `<Title>${this.escapeXml(itemData.title)}</Title>`;
        if (itemData.price) itemXml += `<StartPrice currency="USD">${itemData.price}</StartPrice>`;
        if (itemData.description) itemXml += `<Description><![CDATA[${itemData.description}]]></Description>`;
        if (itemData.quantity) itemXml += `<Quantity>${itemData.quantity}</Quantity>`;
        
        const xmlBody = `<Item>${itemXml}</Item>`;
        return this.callTradingAPI('ReviseItem', xmlBody);
    }

    async refreshAccessToken(refreshToken) {
        const auth = Buffer.from(`${this.appName}:${this.certName}`).toString('base64');
        const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', 
            `grant_type=refresh_token&refresh_token=${refreshToken}&scope=https://api.ebay.com/oauth/api_scope/sell.account.readonly https://api.ebay.com/oauth/api_scope/sell.account https://api.ebay.com/oauth/api_scope/sell.inventory https://api.ebay.com/oauth/api_scope/sell.inventory.readonly`, 
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`
                }
            }
        );
        return response.data;
    }

    async getAppToken() {
        if (this.appToken && this.appTokenExpiry > Date.now()) {
            return this.appToken;
        }

        const auth = Buffer.from(`${this.appName}:${this.certName}`).toString('base64');
        try {
            const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token',
                'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${auth}`
                    }
                }
            );
            this.appToken = response.data.access_token;
            this.appTokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
            return this.appToken;
        } catch (e) {
            console.error("[eBay Auth] App Token Failure:", e.message);
            return null;
        }
    }

    async searchProducts(query, options = {}) {
        const token = await this.getAppToken();
        if (!token) return [];

        const params = {
            q: query,
            limit: options.limit || 12,
            offset: options.offset || 0,
            filter: []
        };

        if (options.categoryId) {
            params.category_ids = options.categoryId;
        }

        if (options.minPrice || options.maxPrice) {
            let priceFilter = 'price:[';
            priceFilter += options.minPrice || '0';
            priceFilter += '..';
            priceFilter += options.maxPrice || '*';
            priceFilter += ']';
            params.filter.push(priceFilter);
        }

        if (options.condition) {
            params.filter.push(`conditions:{${options.condition}}`);
        }

        if (params.filter.length > 0) {
            params.filter = params.filter.join(',');
        } else {
            delete params.filter;
        }

        try {
            const response = await axios.get('https://api.ebay.com/buy/browse/v1/item_summary/search', {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
                }
            });
            return (response.data?.itemSummaries || []).map(item => ({
                id: item.itemId,
                title: item.title,
                price: parseFloat(item.price?.value || "0"),
                image_url: item.image?.imageUrl,
                thumbnail: item.image?.imageUrl,
                url: item.itemWebUrl,
                condition: item.condition,
                categoryId: item.categories?.[0]?.categoryId || "0",
                categoryName: item.categories?.[0]?.categoryName,
                totalFound: response.data.total
            }));
        } catch (e) {
            console.error("[eBay Search] API Error Details:", e.response?.data || e.message);
            return [];
        }
    }

    async getCategoryTreeId() {
        const token = await this.getAppToken();
        if (!token) return "0";
        try {
            const response = await axios.get('https://api.ebay.com/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_US', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data.categoryTreeId || "0";
        } catch (e) {
            return "0";
        }
    }

    async getTopCategories(treeId) {
        const token = await this.getAppToken();
        if (!token) return [];
        try {
            const response = await axios.get(`https://api.ebay.com/commerce/taxonomy/v1/category_tree/${treeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return (response.data.rootCategoryNode?.childCategoryTreeNodes || []).map(n => ({
                id: n.category.categoryId,
                name: n.category.categoryName,
                isLeaf: n.leafCategoryTreeNode
            }));
        } catch (e) {
            return [];
        }
    }

    async getSubCategories(categoryId, treeId) {
        const token = await this.getAppToken();
        if (!token) return [];
        try {
            const response = await axios.get(`https://api.ebay.com/commerce/taxonomy/v1/category_tree/${treeId}/get_category_subtree?category_id=${categoryId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return (response.data.categorySubtreeNode?.childCategoryTreeNodes || []).map(n => ({
                id: n.category.categoryId,
                name: n.category.categoryName,
                isLeaf: n.leafCategoryTreeNode
            }));
        } catch (e) {
            return [];
        }
    }

    async getItemAspects(categoryId, treeId = "0") {
        const token = await this.getAppToken();
        if (!token) return [];
        try {
            const response = await axios.get(`https://api.ebay.com/commerce/taxonomy/v1/category_tree/${treeId}/get_item_aspects_for_category?category_id=${categoryId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return (response.data.aspects || []).map(a => ({
                name: a.localizedAspectName,
                required: a.aspectConstraint?.aspectRequired || false,
                values: (a.aspectValues || []).map(v => v.localizedValue)
            }));
        } catch (e) {
            return [];
        }
    }

    async getCategorySuggestions(q) {
        const token = await this.getAppToken();
        if (!token) return [];
        try {
            const response = await axios.get('https://api.ebay.com/commerce/taxonomy/v1/category_tree/0/get_category_suggestions', {
                params: { q },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return (response.data?.categorySuggestions || []).map(s => ({
                id: s.category?.categoryId,
                name: s.category?.categoryName
            }));
        } catch (e) {
            return [];
        }
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
