
const axios = require('axios');
const tokenManager = require('./tokenManager');

class EbayTradingService {
    async callWithRetry(fn, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (err) {
                const isRetryable = err.response?.status >= 500 || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
                if (isRetryable && i < retries - 1) {
                    console.warn(`[eBay Retry] Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2; // Exponential backoff
                    continue;
                }
                throw err;
            }
        }
    }

    constructor() {
        const appID = process.env.EBAY_APP_ID || process.env.VITE_EBAY_APP_ID || '';
        this.isSandbox = appID.includes('-SBX-');
        
        // Environment Base URLs
        const domain = this.isSandbox ? 'sandbox.ebay.com' : 'ebay.com';
        this.authBaseUrl = `https://auth.${domain}`;
        this.apiBaseUrl = `https://api.${domain}`;
        
        this.endpoint = `${this.apiBaseUrl}/ws/api.dll`;
        this.restBaseUrl = this.apiBaseUrl;
        this.tokenUrl = `${this.apiBaseUrl}/identity/v1/oauth2/token`;
        
        this.siteId = process.env.EBAY_SITE_ID || '0';
        this.compatibilityLevel = '1355';
        this.token = tokenManager.getAccessToken();
        this.devName = process.env.EBAY_DEV_ID || process.env.VITE_EBAY_DEV_ID;
        this.appName = appID;
        this.certName = process.env.EBAY_CERT_ID || process.env.VITE_EBAY_CERT_ID;
        this.ruName = process.env.EBAY_RUNAME || process.env.VITE_EBAY_RUNAME;
        this.tokenManager = tokenManager;

        console.log(`[eBay Service] Initialized for ${this.isSandbox ? 'SANDBOX' : 'PRODUCTION'}`);
        console.log(`[eBay Service] Base URL: ${this.apiBaseUrl}`);
    }

    async ensureToken() {
        this.token = tokenManager.getAccessToken();
        const refreshToken = tokenManager.getRefreshToken();
        
        console.log(`[eBay Auth] Token Status - Access: ${this.token ? 'YES' : 'NO'}, Refresh: ${refreshToken ? 'YES' : 'NO'}`);

        if (tokenManager.isExpired()) {
            if (!refreshToken) {
                console.log("[eBay Auth] Token expired but NO refresh token found. Skipping auto-refresh.");
                return;
            }

            console.log("[eBay Auth] Token expired. Initiating Auto-Refresh...");
            console.log("REFRESH TOKEN:", refreshToken.substring(0, 10) + "...");

            try {
                const data = await this.refreshAccessToken(refreshToken);
                tokenManager.saveTokens(data);
                this.token = data.access_token;
                console.log("[eBay Auth] Token auto-refreshed successfully.");
            } catch (error) {
                console.error("[eBay Auth] Auto-refresh failed:", error.response?.data || error.message);
            }
        }
    }

    getAuthorizationUrl() {
        const EBAY_CLIENT_ID = (process.env.EBAY_APP_ID || process.env.VITE_EBAY_APP_ID || '').trim();
        const EBAY_RUNAME = (process.env.EBAY_RUNAME || process.env.VITE_EBAY_RUNAME || '').trim();
        
        console.log("--- DEBUG OAUTH CONFIG ---");
        console.log("CLIENT_ID:", EBAY_CLIENT_ID);
        console.log("RUNAME:", EBAY_RUNAME);

        const scopes = [
            "https://api.ebay.com/oauth/api_scope/sell.account",
            "https://api.ebay.com/oauth/api_scope/sell.inventory",
            "https://api.ebay.com/oauth/api_scope/sell.fulfillment"
        ];
        
        const scopeString = scopes.join(" ");
        const encodedScope = encodeURIComponent(scopeString);
        const encodedRuName = encodeURIComponent(EBAY_RUNAME);
        const encodedClientId = encodeURIComponent(EBAY_CLIENT_ID);

        const oauthUrl = `${this.authBaseUrl}/oauth2/authorize?client_id=${encodedClientId}&response_type=code&redirect_uri=${encodedRuName}&scope=${encodedScope}&prompt=login%20consent`;

        console.log("--- GENERATED OAUTH URL (V3) ---");
        console.log(oauthUrl);
        console.log("---------------------------------");

        return oauthUrl;
    }

    async exchangeCodeForToken(code) {
        const auth = Buffer.from(`${this.appName}:${this.certName}`).toString('base64');
        
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', this.ruName);

        console.log(`\n[OAuth Exchange] --- STARTING EXCHANGE ---`);
        console.log(`[OAuth Exchange] Code: ${code.substring(0, 10)}...`);
        console.log(`[OAuth Exchange] Using RUName: ${this.ruName}`);
        
        const response = await axios.post(this.tokenUrl,
            params.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`
                }
            }
        );
        
        console.log(`[OAuth Exchange] --- SUCCESS: Token Obtained ---`);
        tokenManager.saveTokens(response.data);
        this.token = response.data.access_token;
        return response.data;
    }

    async callTradingAPI(callName, xmlBody, siteId = null) {
        await this.ensureToken();
        const isOAuth = this.token && this.token.startsWith('v^1.1');
        
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

        const executeCall = async () => {
            return await this.callWithRetry(async () => {
                const response = await axios.post(this.endpoint, fullXml, { 
                    headers,
                    timeout: 45000 
                });
                
                console.log(`\n--- EBAY TRADING RESPONSE [${callName}] ---`);
                console.log(response.data.substring(0, 3000) + '...');
                console.log('--- END RESPONSE ---\n');

                return response.data;
            });
        };

        try {
            let responseData = await executeCall();
            
            // Check for IAF token expiration in the XML response
            if (responseData.includes('Expired IAF token') || responseData.includes('21917053')) {
                console.warn(`[eBay Trading] IAF Token expired detected in XML for ${callName}. Attempting recovery...`);
                const refreshToken = tokenManager.getRefreshToken();
                if (refreshToken) {
                    const data = await this.refreshAccessToken(refreshToken);
                    tokenManager.saveTokens(data);
                    this.token = data.access_token;
                    
                    // Update headers and rebuild XML if necessary (though headers are usually enough)
                    headers['X-EBAY-API-IAF-TOKEN'] = this.token;
                    console.log("[eBay Trading] Retrying call with fresh token...");
                    responseData = await executeCall();
                }
            }
            
            return responseData;
        } catch (error) {
            console.error(`\n--- EBAY TRADING ERROR [${callName}] ---`);
            // ... (rest of error logging)
            throw error;
        }
    }

    /**
     * 🛡️ BUSINESS POLICIES (REST API)
     */
    async getBusinessPolicies() {
        await this.ensureToken();
        console.log("[eBay Policies] Starting policy resolution...");
        
        // 🔍 Log token diagnostic (Requirement: TOKEN BEING USED)
        const tokenPrefix = this.token ? this.token.substring(0, 20) : "MISSING";
        console.log("TOKEN BEING USED (Prefix):", tokenPrefix);

        const isOAuth = this.token && this.token.startsWith('v^1.1');
        if (!isOAuth) {
            throw new Error("Business Policies require a valid OAuth User Token (v^1.1). Current token is invalid or legacy.");
        }

        const token = this.token;

        try {
            console.log("[eBay Policies] Requesting Fulfillment, Return, and Payment policies...");
            const [fulfillRes, returnRes, paymentRes] = await Promise.all([
                axios.get(`${this.restBaseUrl}/sell/account/v1/fulfillment_policy`, { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get(`${this.restBaseUrl}/sell/account/v1/return_policy`, { headers: { 'Authorization': `Bearer ${token}` } }),
                axios.get(`${this.restBaseUrl}/sell/account/v1/payment_policy`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            // 🔍 Log raw response (Requirement: Log raw response)
            console.log("RAW FULFILLMENT RESPONSE:", JSON.stringify(fulfillRes.data).substring(0, 500) + "...");

            const shipData = fulfillRes.data;
            const returnData = returnRes.data;
            const payData = paymentRes.data;

            console.log("POLICIES SUMMARY:", { 
                shipCount: shipData.fulfillmentPolicies?.length || 0, 
                returnCount: returnData.returnPolicies?.length || 0, 
                payCount: payData.paymentPolicies?.length || 0 
            });

            const fulfillmentPolicies = shipData.fulfillmentPolicies || [];
            const returnPolicies = returnData.returnPolicies || [];
            const paymentPolicies = payData.paymentPolicies || [];

            // ✅ Handle gracefully (Requirement: Handle gracefully instead of throwing 500)
            if (fulfillmentPolicies.length === 0 || returnPolicies.length === 0 || paymentPolicies.length === 0) {
                const missing = [];
                if (fulfillmentPolicies.length === 0) missing.push("Shipping");
                if (returnPolicies.length === 0) missing.push("Return");
                if (paymentPolicies.length === 0) missing.push("Payment");
                
                const msg = `No business policies found on seller account for: ${missing.join(', ')}. Please create them in eBay Seller Hub.`;
                console.warn(`[eBay Policies] ${msg}`);
                throw new Error(msg);
            }

            return {
                fulfillmentPolicyId: fulfillmentPolicies[0].fulfillmentPolicyId,
                returnPolicyId: returnPolicies[0].returnPolicyId,
                paymentPolicyId: paymentPolicies[0].paymentPolicyId
            };
        } catch (e) {
            // Enhanced logging for 403 Forbidden (Scope issues)
            if (e.response?.status === 403) {
                console.error("403 FORBIDDEN: Token likely lacks 'sell.account' or 'sell.fulfillment' scopes.");
            }
            console.error("POLICY FETCH ERROR:", e.response?.data || e.message);
            throw e;
        }
    }

    async addItem(itemData) {
        // Use profiles from payload (attached in route) or fetch if missing
        const policies = itemData.sellerProfiles ? {
            fulfillmentPolicyId: itemData.sellerProfiles.sellerShippingProfile.shippingProfileId,
            returnPolicyId: itemData.sellerProfiles.sellerReturnProfile.returnProfileId,
            paymentPolicyId: itemData.sellerProfiles.sellerPaymentProfile.paymentProfileId
        } : await this.getBusinessPolicies();

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
            ${(set.values || []).map(val => `<Value>${this.escapeXml(val)}</Value>`).join('')}
          </NameValueList>
        `).join('')}
      </VariationSpecificsSet>
      ${itemData.variants.map(v => `
        <Variation>
          <SKU>${this.escapeXml(v.sku)}</SKU>
          <StartPrice currency="USD">${v.price}</StartPrice>
          <Quantity>${v.inventory}</Quantity>
          <VariationSpecifics>
            ${Object.entries(v.specifics || {}).map(([name, value]) => `
              <NameValueList>
                <Name>${this.escapeXml(name)}</Name>
                <Value>${this.escapeXml(value)}</Value>
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
    
    <SellerProfiles>
      <SellerShippingProfile>
        <ShippingProfileID>${policies.fulfillmentPolicyId}</ShippingProfileID>
      </SellerShippingProfile>
      <SellerReturnProfile>
        <ReturnProfileID>${policies.returnPolicyId}</ReturnProfileID>
      </SellerReturnProfile>
      <SellerPaymentProfile>
        <PaymentProfileID>${policies.paymentPolicyId}</PaymentProfileID>
      </SellerPaymentProfile>
    </SellerProfiles>

    <PictureDetails>
      ${(itemData.images || []).map(url => `<PictureURL>${this.escapeXml(url)}</PictureURL>`).join('')}
    </PictureDetails>
    <PostalCode>${itemData.postalCode || '95125'}</PostalCode>
    
    <ItemSpecifics>
      ${(itemData.itemSpecifics?.nameValueList || []).map(is => `
        <NameValueList>
          <Name>${this.escapeXml(is.name)}</Name>
          ${is.value.map(val => `<Value>${this.escapeXml(val)}</Value>`).join('')}
        </NameValueList>
      `).join('')}
    </ItemSpecifics>
  </Item>`;

        console.log("FINAL XML PAYLOAD (TRUNCATED):", xmlBody.substring(0, 1000) + "...");
        return await this.callTradingAPI('AddFixedPriceItem', xmlBody);
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
        if (!refreshToken) {
            console.error("[eBay Auth] refreshAccessToken called with MISSING token");
            throw new Error("No refresh token provided");
        }
        
        const auth = Buffer.from(`${this.appName}:${this.certName}`).toString('base64');
        
        const performRefresh = async (includeScopes = true) => {
            const params = new URLSearchParams();
            params.append('grant_type', 'refresh_token');
            params.append('refresh_token', refreshToken);
            
            if (includeScopes) {
                const scopes = [
                    "https://api.ebay.com/oauth/api_scope/sell.account",
                    "https://api.ebay.com/oauth/api_scope/sell.inventory",
                    "https://api.ebay.com/oauth/api_scope/sell.fulfillment"
                ];
                params.append('scope', scopes.join(" "));
            }

            return await axios.post(this.tokenUrl, 
                params.toString(), 
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${auth}`
                    }
                }
            );
        };

        try {
            console.log("[eBay Auth] Attempting refresh with full scopes...");
            const response = await performRefresh(true);
            return response.data;
        } catch (err) {
            if (err.response?.data?.error === 'invalid_scope') {
                console.warn("[eBay Auth] Refresh with scopes failed (invalid_scope). Retrying WITHOUT scope parameter (Legacy Mode)...");
                try {
                    const response = await performRefresh(false);
                    console.log("[eBay Auth] Legacy Refresh SUCCESS ✅");
                    return response.data;
                } catch (retryErr) {
                    console.error("[eBay Auth] Legacy Refresh also failed:", retryErr.response?.data || retryErr.message);
                    throw retryErr;
                }
            }
            throw err;
        }
    }

    async getAppToken() {
        if (this.appToken && this.appTokenExpiry > Date.now()) {
            return this.appToken;
        }

        const auth = Buffer.from(`${this.appName}:${this.certName}`).toString('base64');
        try {
            return await this.callWithRetry(async () => {
                const response = await axios.post(this.tokenUrl,
                    `grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope`,
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Authorization': `Basic ${auth}`
                        },
                        timeout: 15000 // Increased timeout
                    }
                );
                this.appToken = response.data.access_token;
                this.appTokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000;
                console.log("[eBay Auth] App Token success. Expiry:", new Date(this.appTokenExpiry).toISOString());
                return this.appToken;
            });
        } catch (e) {
            console.error("[eBay Auth] App Token Failure (Client Credentials):", e.response?.data || e.message);
            
            // FALLBACK: Try using the User Token if it's an OAuth token
            const tokenType = this.token ? (this.token.startsWith('v^1.1') ? 'OAuth' : 'Auth\'n\'Auth') : 'NONE';
            console.log(`[eBay Auth] Current User Token Type: ${tokenType}`);

            if (tokenType === 'OAuth') {
                console.log("[eBay Auth] Falling back to OAuth User Token for application-level call...");
                return this.token;
            }
            
            return null;
        }
    }

    async searchProducts(query, options = {}) {
        await this.ensureToken();
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
            const response = await this.callWithRetry(async () => {
                return await axios.get('https://api.ebay.com/buy/browse/v1/item_summary/search', {
                    params,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
                    },
                    timeout: 15000 // Increased timeout
                });
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
        console.log("[eBay Taxonomy] Resolving Real Default Tree ID...");
        const token = await this.getAppToken();
        if (!token) return "0";
        try {
            // Marketplace ID is often required, defaulting to EBAY_US but can be dynamic
            const response = await axios.get('https://api.ebay.com/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_US', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const treeId = response.data.categoryTreeId;
            console.log("REAL TREE ID:", treeId);
            return treeId;
        } catch (e) {
            console.error("[eBay Taxonomy] Tree ID Resolution Failed:", e.response?.data || e.message);
            return "0";
        }
    }

    async getTopCategories(providedTreeId = null) {
        let treeId = providedTreeId;
        if (!treeId || treeId === "0") {
            treeId = await this.getCategoryTreeId();
        }

        console.log(`[eBay Taxonomy] Fetching FULL Tree for ${treeId} to get Root Nodes...`);
        const token = await this.getAppToken();
        if (!token) return { treeId, children: [] };

        const executeTaxonomyCall = async () => {
            return await this.callWithRetry(async () => {
                return await axios.get(`https://api.ebay.com/commerce/taxonomy/v1/category_tree/${treeId}`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
                        'Content-Type': 'application/json'
                    },
                    timeout: 25000 
                });
            });
        };

        try {
            let response = await executeTaxonomyCall();
            
            if (!response.data || !response.data.rootCategoryNode) {
                console.error("[eBay Taxonomy] Full Tree Response missing rootCategoryNode");
                return { treeId, children: [] };
            }

            const rootChildren = response.data.rootCategoryNode.childCategoryTreeNodes || [];
            console.log("ROOT COUNT:", rootChildren.length);

            const mappedChildren = rootChildren.map(c => ({
                id: c.category?.categoryId || c.categoryId,
                categoryId: c.category?.categoryId || c.categoryId,
                name: c.category?.categoryName || c.categoryName || "Unknown",
                leafCategoryTreeNode: c.leafCategory || c.leafCategoryTreeNode || false,
                children: c.children || c.childCategoryTreeNodes || []
            }));

            return {
                treeId: treeId,
                children: mappedChildren
            };
        } catch (err) {
            if (err.response?.status === 401) {
                console.warn("[eBay Taxonomy] 401 Unauthorized detected. Refreshing token...");
                const refreshToken = tokenManager.getRefreshToken();
                if (refreshToken) {
                    try {
                        const data = await this.refreshAccessToken(refreshToken);
                        tokenManager.saveTokens(data);
                        this.token = data.access_token;
                        console.log("[eBay Taxonomy] Retrying with fresh token...");
                        const retryResponse = await executeTaxonomyCall();
                        
                        const rootChildren = retryResponse.data.rootCategoryNode.childCategoryTreeNodes || [];
                        return {
                            treeId: treeId,
                            children: rootChildren.map(c => ({
                                id: c.category?.categoryId || c.categoryId,
                                categoryId: c.category?.categoryId || c.categoryId,
                                name: c.category?.categoryName || c.categoryName || "Unknown",
                                leafCategoryTreeNode: c.leafCategory || c.leafCategoryTreeNode || false,
                                children: c.children || c.childCategoryTreeNodes || []
                            }))
                        };
                    } catch (refreshErr) {
                        console.error("[eBay Taxonomy] Recovery failed:", refreshErr.message);
                    }
                }
            }
            console.error("[eBay Taxonomy] Full Tree Root Load Failure:", err.response?.data || err.message);
            return { treeId, children: [] };
        }
    }

    async getTopCategoriesTradingFallback() {
        const xmlBody = `
            <CategorySiteID>0</CategorySiteID>
            <DetailLevel>ReturnAll</LevelLimit>
            <LevelLimit>1</LevelLimit>
        `;
        try {
            const response = await this.callTradingAPI('GetCategories', xmlBody);
            const categories = [];
            const regex = /<Category>[\s\S]*?<CategoryID>(\d+)<\/CategoryID>[\s\S]*?<CategoryName>(.*?)<\/CategoryName>([\s\S]*?<LeafCategory>(true|false)<\/LeafCategory>)?/g;
            let match;
            while ((match = regex.exec(response)) !== null) {
                const id = match[1];
                const name = match[2].replace(/&amp;/g, '&');
                const isLeaf = match[4] === "true";
                if (id === "0") continue;
                categories.push({ id, name, isLeaf });
            }
            return categories;
        } catch (e) {
            return [];
        }
    }

    async getCategory(categoryId, treeId = "0") {
        console.log(`[eBay Taxonomy] Fetching Category Info for: ${categoryId}...`);
        const token = await this.getAppToken();
        if (!token) {
            console.error("[eBay Taxonomy] Failed to obtain App Token.");
            return null;
        }

        try {
            const response = await this.callWithRetry(async () => {
                return await axios.get(`https://api.ebay.com/commerce/taxonomy/v1/category_tree/${treeId}/get_category_subtree?category_id=${categoryId}`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                });
            });

            // 🛡️ Log Raw Response for Debugging (Requirement 2)
            console.log(`[eBay Taxonomy] Raw Response for ${categoryId}:`, JSON.stringify(response.data).substring(0, 500) + "...");

            // eBay can return the node directly or wrapped in categorySubtreeNode/categoryTreeNode
            const node = response.data?.categorySubtreeNode || response.data?.categoryTreeNode || response.data;
            
            if (!node || (!node.category && !node.categoryId)) {
                console.warn(`[eBay Taxonomy] No node found in response for Category ${categoryId}`);
                return null;
            }

            return {
                id: node.category?.categoryId || node.categoryId || categoryId,
                categoryId: node.category?.categoryId || node.categoryId || categoryId,
                name: node.category?.categoryName || node.categoryName || "Unknown",
                leafCategoryTreeNode: node.leafCategory || node.leafCategoryTreeNode || false,
                children: (node.children || node.childCategoryTreeNodes || []).map(c => ({
                    id: c.category?.categoryId || c.categoryId,
                    categoryId: c.category?.categoryId || c.categoryId,
                    name: c.category?.categoryName || c.categoryName,
                    leafCategoryTreeNode: c.leafCategory || c.leafCategoryTreeNode || false
                }))
            };
        } catch (err) {
            if (err.response) {
                console.error("[eBay Taxonomy] API Error:", err.response.status, err.response.data);
            } else {
                console.error("[eBay Taxonomy] GetCategory Failed:", err.message);
            }
            throw err; // Re-throw to let route handler decide status
        }
    }

    async getCategorySuggestions(q) {
        const token = await this.getAppToken();
        if (!token) return [];
        try {
            const response = await this.callWithRetry(async () => {
                return await axios.get(`https://api.ebay.com/commerce/taxonomy/v1/category_tree/0/get_category_suggestions?q=${encodeURIComponent(q)}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 10000
                });
            });
            return (response.data.categorySuggestions || []).map(s => ({
                id: s.category.categoryId,
                name: s.category.categoryName
            }));
        } catch (e) {
            console.error("[eBay Taxonomy] Category Suggestions Failure:", e.response?.data || e.message);
            return [];
        }
    }

    async getSubCategories(parentId, treeId = "0") {
        console.log(`[eBay Taxonomy] Fetching Sub-Categories for Parent ${parentId}...`);
        const token = await this.getAppToken();
        if (!token) return [];

        try {
            const response = await this.callWithRetry(async () => {
                return await axios.get(`https://api.ebay.com/commerce/taxonomy/v1/category_tree/${treeId}/get_category_subtree?category_id=${parentId}`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
                    },
                    timeout: 15000
                });
            });

            // Log raw response for debugging (Requirement 1)
            console.log("[eBay Taxonomy] Raw Response for Parent", parentId, ":", JSON.stringify(response.data).substring(0, 500) + "...");

            const node = response.data?.categorySubtreeNode || response.data;
            const children = node?.children || node?.childCategoryTreeNodes || [];
            
            if (children.length === 0) {
                console.warn(`[eBay Taxonomy] Node ${parentId} returned 0 children.`);
            }

            return children.map(c => ({
                id: c.category?.categoryId || c.categoryId,
                name: c.category?.categoryName || c.categoryName,
                leafCategoryTreeNode: c.leafCategory || c.leafCategoryTreeNode || false
            }));
        } catch (err) {
            console.warn("[eBay Taxonomy] REST Sub-Categories Failed. Falling back to Trading API...");
            return this.getSubCategoriesTradingFallback(parentId);
        }
    }

    async getSubCategoriesTradingFallback(parentId) {
        const xmlBody = `
            <CategoryParent>${parentId}</CategoryParent>
            <DetailLevel>ReturnAll</DetailLevel>
            <LevelLimit>2</LevelLimit>
        `;
        try {
            const response = await this.callTradingAPI('GetCategories', xmlBody);
            const categories = [];
            const regex = /<Category>[\s\S]*?<CategoryID>(\d+)<\/CategoryID>[\s\S]*?<CategoryName>(.*?)<\/CategoryName>([\s\S]*?<LeafCategory>(true|false)<\/LeafCategory>)?/g;
            let match;
            while ((match = regex.exec(response)) !== null) {
                const id = match[1];
                const name = match[2].replace(/&amp;/g, '&');
                const isLeaf = match[4] === "true";
                if (id === parentId) continue;
                categories.push({ id, name, isLeaf });
            }
            return categories;
        } catch (e) {
            return [];
        }
    }

    async getItemAspectsForCategory(categoryId, treeId = "0") {
        const token = await this.getAppToken();
        if (!token) return [];
        try {
            console.log(`[eBay Taxonomy] Fetching Aspects for Category: ${categoryId}`);
            const response = await axios.get(`https://api.ebay.com/commerce/taxonomy/v1/category_tree/${treeId}/get_item_aspects_for_category?category_id=${categoryId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
                }
            });
            
            // Map to a cleaner structure for the frontend
            return (response.data.aspects || []).map(a => ({
                name: a.localizedAspectName,
                required: a.aspectConstraint?.aspectRequired || false,
                usage: a.aspectConstraint?.aspectUsage || 'OPTIONAL',
                dataType: a.aspectConstraint?.itemToAspectCardinality === 'MULTI' ? 'MULTIVALUE' : 'STRING',
                values: (a.aspectValues || []).map(v => v.localizedValue)
            }));
        } catch (e) {
            console.error("[eBay Taxonomy] Aspects Fetch Failure:", e.response?.data || e.message);
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
