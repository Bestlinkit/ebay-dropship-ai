
const express = require('express');
const router = express.Router();
const ebayTrading = require('../services/ebayTrading');
const fs = require('fs');
const path = require('path');

// 🔍 DEBUG LOGGER: Writes exact eBay errors to a file for investigation
const logToFile = (msg, data = null) => {
    const timestamp = new Date().toISOString();
    const logPath = path.join(__dirname, '../debug_listing.log');
    let entry = `[${timestamp}] ${msg}\n`;
    if (data) entry += `${JSON.stringify(data, null, 2)}\n`;
    entry += `------------------------------------------\n`;
    fs.appendFileSync(logPath, entry);
};

/**
 * 📦 LIST PRODUCT
 * POST /api/ebay/list
 */
router.post('/list', async (req, res) => {
    try {
        await ebayTrading.ensureToken();
        const itemData = req.body;
        console.log(`[eBay Route] HEARTBEAT - Starting listing flow for: ${itemData.title}`);
        console.log(`[eBay Route] Listing attempt for: ${itemData.title}`);
        
        // 🔥 Step 1 — FORCE policy fetch inside listing route
        const policies = await ebayTrading.getBusinessPolicies();
        
        // ✅ Step 2 — FORCE attach to payload
        itemData.marketplaceId = "EBAY_US";
        itemData.sellerProfiles = {
            sellerShippingProfile: {
                shippingProfileId: policies.fulfillmentPolicyId
            },
            sellerReturnProfile: {
                returnProfileId: policies.returnPolicyId
            },
            sellerPaymentProfile: {
                paymentProfileId: policies.paymentPolicyId
            }
        };

        // 🚨 Step 3 — HARD FAIL if missing
        if (!itemData.sellerProfiles.sellerShippingProfile.shippingProfileId) {
            throw new Error("sellerProfiles NOT attached — blocking request");
        }

        // ✅ Step 4 — ENFORCE ASPECT CORRECTNESS & FAIL FAST
        const rawAspects = itemData.itemSpecifics?.nameValueList || [];
        console.log("RAW INPUT ASPECTS:", JSON.stringify(rawAspects, null, 2));

        const sanitizedAspects = rawAspects.filter(item => {
            const name = item?.Name || item?.name;
            const value = item?.Value || item?.value;
            
            return (
                item &&
                name &&
                Array.isArray(value) &&
                value.length > 0 &&
                value.every(v => v !== null && v !== undefined && v !== "")
            );
        });

        console.log("FINAL ASPECTS PAYLOAD:", JSON.stringify(sanitizedAspects, null, 2));

        // 🚨 FAIL FAST: If we lost any aspects during sanitization, it means input was broken
        if (sanitizedAspects.length !== rawAspects.length) {
            console.error(`[Validation] BLOCKING: Detected ${rawAspects.length - sanitizedAspects.length} invalid aspects.`);
            const invalidItems = rawAspects.filter(item => !sanitizedAspects.includes(item));
            
            return res.status(400).json({
                error: "INVALID_ASPECTS_DETECTED",
                message: "Invalid aspects detected before eBay submission. No nulls or empty values allowed.",
                invalidAspects: invalidItems,
                rawInput: rawAspects
            });
        }

        // Convert sanitized array to eBay Inventory Object Format: { "Color": ["Red"] }
        const aspectsObject = {};
        sanitizedAspects.forEach(item => {
            const name = item.Name || item.name;
            const value = item.Value || item.value;
            aspectsObject[name] = Array.isArray(value) ? value.map(v => v.toString()) : [value.toString()];
        });

        // 🎨 Step — INJECT MANDATORY ASPECTS (Color, etc.)
        if (!aspectsObject["Color"] && !aspectsObject["color"]) {
            console.log("[eBay Flow] Mandatory 'Color' missing. Attempting extraction...");
            const commonColors = ["Red", "Blue", "Black", "White", "Grey", "Green", "Yellow", "Brown", "Orange", "Pink", "Purple", "Multicolor", "Navy", "Beige", "Silver", "Gold"];
            const foundColor = commonColors.find(c => itemData.title.toLowerCase().includes(c.toLowerCase()));
            aspectsObject["Color"] = [foundColor || "Multicolor"];
            console.log(`[eBay Flow] Injected Color: ${aspectsObject["Color"]}`);
        }

        // ✅ Step 5 — RESOLVE MERCHANT LOCATION (Required for both single and group)
        console.log("[eBay Flow] Resolving merchant location...");
        const locationData = await ebayTrading.getLocations();
        let locationKey = "default";
        if (locationData.locations && locationData.locations.length > 0) {
            locationKey = locationData.locations[0].merchantLocationKey;
            console.log(`[eBay Flow] Using existing location: ${locationKey}`);
        } else {
            console.warn("[eBay Flow] No locations found. Attempting to create default...");
            try {
                await ebayTrading.createDefaultLocation();
                locationKey = "default";
            } catch (locErr) {
                console.error("[eBay Flow] Could not create default location.");
            }
        }

        // ✅ Step 6 — ORCHESTRATE INVENTORY API FLOW
        const isMultiVariation = itemData.variants && Array.isArray(itemData.variants) && itemData.variants.length > 0;
        
        if (isMultiVariation) {
            logToFile(`STARTING MULTI-VARIATION FLOW: ${itemData.title}`, { sku: itemData.sku, variants: itemData.variants.length });
            const groupKey = itemData.sku || `GRP-${Date.now()}`;
            
            // 0. Pre-prepare variants with unique SKUs to ensure consistency across steps
            const preparedVariants = itemData.variants.map((v, i) => ({
                ...v,
                preparedSku: `${v.sku || 'VAR'}-${i}-${Date.now()}`
            }));
            const variantSkus = preparedVariants.map(v => v.preparedSku);

            // 1. Create each variant as an individual inventory item
            logToFile(`1/4: Creating ${preparedVariants.length} variant items...`);
            for (const variant of preparedVariants) {
                const variantSku = variant.preparedSku;
                const variantAspects = { ...aspectsObject };
                if (variant.attributes) {
                    variant.attributes.forEach(attr => {
                        variantAspects[attr.name] = [attr.value];
                    });
                }

                try {
                    await ebayTrading.createOrReplaceInventoryItem(variantSku, {
                        title: `${itemData.title} - ${variant.name || variantSku}`,
                        description: itemData.description,
                        images: variant.images && variant.images.length > 0 ? variant.images : itemData.images,
                        quantity: variant.quantity || 1,
                        aspects: variantAspects
                    });
                } catch (err) {
                    logToFile(`FAILED: Item ${variantSku}`, err.response?.data || err.message);
                    throw err;
                }
            }

            // 2. Create Inventory Item Group
            logToFile(`2/4: Creating item group: ${groupKey}`);
            const groupVariantAspects = [
                { name: "Size", values: [...new Set(preparedVariants.flatMap(v => v.attributes?.filter(a => a.name.toLowerCase() === 'size').map(a => a.value).filter(v => !!v) || []))] },
                { name: "Color", values: [...new Set(preparedVariants.flatMap(v => v.attributes?.filter(a => a.name.toLowerCase() === 'color').map(a => a.value).filter(v => !!v) || []))] }
            ].filter(va => va.values.length > 0);

            const groupAspects = { ...aspectsObject };
            groupVariantAspects.forEach(va => {
                delete groupAspects[va.name];
                delete groupAspects[va.name.toLowerCase()];
            });

            try {
                const groupResponse = await ebayTrading.createOrReplaceInventoryItemGroup(groupKey, {
                    inventoryItemGroupKey: groupKey,
                    variantSKUs: variantSkus,
                    variesBy: {
                        specifications: groupVariantAspects,
                        aspectsImageVariesBy: groupVariantAspects.some(va => va.name === "Color") ? ["Color"] : []
                    },
                    title: itemData.title,
                    description: itemData.description,
                    imageUrls: itemData.images,
                    aspects: groupAspects
                });
                logToFile(`SUCCESS: Created Group ${groupKey}`, groupResponse.data);
            } catch (err) {
                logToFile(`FAILED: Group ${groupKey}`, err.response?.data || err.message);
                throw err;
            }

            // 3. Create Offers for EACH Variant
            logToFile(`3/4: Creating offers for ${variantSkus.length} variants...`);
            for (const variant of preparedVariants) {
                const variantSku = variant.preparedSku;
                try {
                    await ebayTrading.createOffer({
                        sku: variantSku,
                        marketplaceId: "EBAY_US",
                        format: "FIXED_PRICE",
                        availableQuantity: variant.quantity || 1,
                        categoryId: itemData.categoryId,
                        listingDescription: itemData.description,
                        price: variant.price || itemData.price,
                        fulfillmentPolicyId: policies.fulfillmentPolicyId,
                        paymentPolicyId: policies.paymentPolicyId,
                        returnPolicyId: policies.returnPolicyId,
                        merchantLocationKey: locationKey
                    });
                } catch (err) {
                    logToFile(`FAILED: Offer for ${variantSku}`, err.response?.data || err.message);
                    throw err;
                }
            }

            // 4. Publish the Group
            logToFile(`4/4: Publishing item group: ${groupKey}`);
            try {
                const publishResponse = await ebayTrading.publishInventoryItemGroup(groupKey);
                logToFile(`SUCCESS: Published Group ${groupKey}`, publishResponse.data);
                
                return res.json({
                    success: true,
                    message: "Multi-variation listing published successfully",
                    groupKey: groupKey,
                    details: publishResponse.data
                });
            } catch (err) {
                logToFile(`FAILED: Publishing Group ${groupKey}`, err.response?.data || err.message);
                throw err;
            }

        } else {
            // SINGLE ITEM FLOW (Existing)
            logToFile(`STARTING SINGLE ITEM FLOW: ${itemData.title}`, { sku: itemData.sku });
            const sku = itemData.sku || `SKU-${Date.now()}`;
            
            try {
                await ebayTrading.createOrReplaceInventoryItem(sku, {
                    title: itemData.title,
                    description: itemData.description,
                    images: itemData.images,
                    quantity: itemData.quantity,
                    aspects: aspectsObject
                });

                const offerResponse = await ebayTrading.createOffer({
                    sku: sku,
                    marketplaceId: "EBAY_US",
                    format: "FIXED_PRICE",
                    availableQuantity: itemData.quantity,
                    categoryId: itemData.categoryId,
                    listingDescription: itemData.description,
                    price: itemData.price,
                    merchantLocationKey: locationKey,
                    fulfillmentPolicyId: policies.fulfillmentPolicyId,
                    returnPolicyId: policies.returnPolicyId,
                    paymentPolicyId: policies.paymentPolicyId
                });

                const offerId = offerResponse.data.offerId;
                const publishResponse = await ebayTrading.publishOffer(offerId);
                logToFile(`SUCCESS: Published Single Item ${sku}`, publishResponse.data);

                return res.json({
                    success: true,
                    itemId: publishResponse.data.listingId,
                    offerId: offerId,
                    ack: 'Success'
                });
            } catch (err) {
                logToFile(`FAILED: Single Item Flow`, err.response?.data || err.message);
                throw err;
            }
        }

    } catch (error) {
        console.error("FULL EBAY ERROR:", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        return res.status(error.response?.status || 500).json({
            error: "EBAY_API_ERROR",
            details: error.response?.data || error.message,
            debugPayload: req.body // Return what we received
        });
    }
});

/**
 * 📊 GET ACCOUNT SUMMARY
 * GET /api/ebay/account
 */
router.get('/account', async (req, res) => {
    try {
        await ebayTrading.ensureToken();
        const responseXml = await ebayTrading.getMyeBaySelling();
        const ack = responseXml.match(/<Ack>(.*?)<\/Ack>/)?.[1];
        
        if (ack === 'Success' || ack === 'Warning') {
            const activeListMatch = responseXml.match(/<ActiveList>(.*?)<\/ActiveList>/s);
            const activeListXml = activeListMatch ? activeListMatch[1] : responseXml;
            const totalActive = activeListXml.match(/<TotalNumberOfEntries>(.*?)<\/TotalNumberOfEntries>/)?.[1] || "0";
            res.json({
                success: true,
                activeListings: parseInt(totalActive),
                raw: responseXml
            });
        } else {
            res.status(400).json({
                success: false,
                raw: responseXml
            });
        }
    } catch (error) {
        console.error("[eBay Route] Account Fetch Failed:", {
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers
        });
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

/**
 * 👤 GET USER PROFILE
 * GET /api/ebay/user
 */
router.get('/user', async (req, res) => {
    try {
        await ebayTrading.ensureToken();
        const responseXml = await ebayTrading.getUser();
        const ack = responseXml.match(/<Ack>(.*?)<\/Ack>/)?.[1];
        
        if (ack === 'Success' || ack === 'Warning') {
            const userId = responseXml.match(/<UserID>(.*?)<\/UserID>/)?.[1];
            const email = responseXml.match(/<Email>(.*?)<\/Email>/)?.[1];
            res.json({
                success: true,
                userId: userId,
                email: email,
                raw: responseXml
            });
        } else {
            res.status(400).json({
                success: false,
                raw: responseXml
            });
        }
    } catch (error) {
        console.error("[eBay Route] User Fetch Failed:", {
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers
        });
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

// REMOVED: /policies (Legacy Mode Only)

/**
 * 📋 GET ACTIVE LISTINGS
 * GET /api/ebay/listings
 */
router.get('/listings', async (req, res) => {
    try {
        await ebayTrading.ensureToken();
        const responseXml = await ebayTrading.getActiveListings();
        const ack = responseXml.match(/<Ack>(.*?)<\/Ack>/)?.[1];
        
        if (ack === 'Success' || ack === 'Warning') {
            const itemMatches = [...responseXml.matchAll(/<Item>(.*?)<\/Item>/gs)];
            const items = itemMatches.map(m => {
                const xml = m[1];
                return {
                    id: xml.match(/<ItemID>(.*?)<\/ItemID>/)?.[1],
                    title: xml.match(/<Title>(.*?)<\/Title>/)?.[1],
                    price: parseFloat(xml.match(/<StartPrice.*?>(.*?)<\/StartPrice>/)?.[1] || "0"),
                    status: 'Published'
                };
            });
            res.json(items);
        } else {
            res.status(400).json({ success: false, raw: responseXml });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 🛒 GET ORDERS
 * GET /api/ebay/orders
 */
router.get('/orders', async (req, res) => {
    try {
        await ebayTrading.ensureToken();
        const responseXml = await ebayTrading.getOrders();
        const ack = responseXml.match(/<Ack>(.*?)<\/Ack>/)?.[1];
        
        if (ack === 'Success' || ack === 'Warning') {
            const orderMatches = [...responseXml.matchAll(/<Order>(.*?)<\/Order>/gs)];
            const orders = orderMatches.map(m => {
                const xml = m[1];
                return {
                    id: xml.match(/<OrderID>(.*?)<\/OrderID>/)?.[1],
                    amount: xml.match(/<Total.*?>(.*?)<\/Total>/)?.[1],
                    status: xml.match(/<OrderStatus>(.*?)<\/OrderStatus>/)?.[1]
                };
            });
            res.json(orders);
        } else {
            res.status(400).json({ success: false, raw: responseXml });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 🛠️ REVISE ITEM
 * POST /api/ebay/revise/:id
 */
router.post('/revise/:id', async (req, res) => {
    try {
        await ebayTrading.ensureToken();
        const responseXml = await ebayTrading.reviseItem(req.params.id, req.body);
        const ack = responseXml.match(/<Ack>(.*?)<\/Ack>/)?.[1];
        if (ack === 'Success' || ack === 'Warning') {
            res.json({ success: true, raw: responseXml });
        } else {
            res.status(400).json({ success: false, raw: responseXml });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 🔄 REFRESH TOKEN
 * POST /api/ebay/refresh
 */
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.body.refresh_token || ebayTrading.tokenManager.getRefreshToken();
        console.log(`[eBay Refresh] Attempting refresh with token: ${refreshToken ? refreshToken.substring(0, 10) + '...' : 'MISSING'}`);
        
        if (!refreshToken) {
            return res.status(400).json({ success: false, error: "No refresh token available. Re-authorization required." });
        }

        const data = await ebayTrading.refreshAccessToken(refreshToken);
        res.json(data);
    } catch (err) {
        const errorDetails = err.response?.data || err.message;
        console.error("[eBay Refresh] Failed:", errorDetails);
        res.status(500).json({ 
            success: false, 
            error: "Token refresh failed",
            details: errorDetails
        });
    }
});

/**
 * 🔍 SEARCH PRODUCTS (Browse API)
 * GET /api/ebay/search
 */
router.get('/search', async (req, res) => {
    try {
        const results = await ebayTrading.searchProducts(req.query.q, {
            categoryId: req.query.categoryId,
            minPrice: req.query.minPrice,
            maxPrice: req.query.maxPrice,
            limit: req.query.limit,
            offset: req.query.offset
        });
        res.json(results);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * 🏷️ CATEGORY SUGGESTIONS & ROOT (UNIFIED)
 * GET /api/ebay/categories
 */
router.get('/categories', async (req, res) => {
    try {
        await ebayTrading.ensureToken();
        const { q, treeId } = req.query;
        
        // If query 'q' exists, it's a search
        if (q) {
            console.log(`[Route] Category Suggestions for: ${q}`);
            const results = await ebayTrading.getCategorySuggestions(q);
            return res.json(results);
        }

        // Otherwise, it's a root load
        console.log("[Route] Loading Root Categories...");
        const rootData = await ebayTrading.getTopCategories(treeId);
        res.json(rootData);
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.errors?.[0]?.message || err.message;
        console.error(`[Route] Root Category API Fault (${status}):`, message);
        res.status(status).json({ success: false, error: message });
    }
});

/**
 * 📂 GET CATEGORY DETAILS (ONE-WAY FLOW)
 */
router.get('/categories/:id', async (req, res) => {
    try {
        await ebayTrading.ensureToken();
        const categoryId = req.params.id;
        const { treeId } = req.query;
        
        if (!treeId) {
            console.error("[Route] Missing treeId for category detail lookup.");
            return res.status(400).json({ success: false, error: "Missing treeId" });
        }

        const cat = await ebayTrading.getCategory(categoryId, treeId);
        
        if (!cat) {
            console.warn(`[Route] Category ${categoryId} not found or empty response.`);
            return res.status(404).json({ success: false, error: "Category not found" });
        }

        res.json(cat);
    } catch (err) {
        const status = err.response?.status || 500;
        const message = err.response?.data?.errors?.[0]?.message || err.message;
        
        if (status === 401) {
            console.error("[Route] EBAY TOKEN EXPIRED OR INVALID (401)");
            return res.status(401).json({ success: false, error: "Invalid or expired token" });
        }

        console.error(`[Route] Category API Fault (${status}):`, message);
        res.status(status).json({ success: false, error: message });
    }
});

// REMOVED: /policies (Account not opted in, legacy AddItem used instead)





/**
 * 📂 GET SUB-CATEGORIES
 */
router.get('/categories-sub/:id', async (req, res) => {
    try {
        await ebayTrading.ensureToken();
        const parentId = req.params.id;
        const treeId = req.query.treeId || "0";
        const cats = await ebayTrading.getSubCategories(parentId, treeId);
        res.json(cats);
    } catch (err) {
        res.json([]);
    }
});

/**
 * 🏷️ GET ITEM ASPECTS
 */
router.get('/aspects/:id', async (req, res) => {
    try {
        await ebayTrading.ensureToken();
        const categoryId = req.params.id;
        const treeId = req.query.treeId || "0";
        const aspects = await ebayTrading.getItemAspectsForCategory(categoryId, treeId);
        res.json(aspects);
    } catch (err) {
        res.json([]);
    }
});

/**
 * 🔐 OAUTH AUTHENTICATION
 */
router.get('/auth', (req, res) => {
    console.log("[OAuth Route] Received request for Authorization URL");
    try {
        const url = ebayTrading.getAuthorizationUrl();
        console.log("[OAuth Route] Generated URL successfully");
        res.json({ oauthUrl: url });
    } catch (err) {
        console.error("[OAuth Route] Generation Error:", err.message);
        res.status(500).json({ error: "Failed to generate auth URL" });
    }
});

const usedCodes = new Set();

router.post('/exchange-code', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: "Authorization code missing" });
        
        if (usedCodes.has(code)) {
            console.warn(`[OAuth Route] BLOCKING REUSE: Code ${code.substring(0, 8)}... already processed.`);
            return res.status(400).json({ error: "Authorization code already used." });
        }

        console.log(`[OAuth Route] New exchange request received for code: ${code.substring(0, 8)}...`);
        usedCodes.add(code);
        
        const tokenData = await ebayTrading.exchangeCodeForToken(code);
        res.json(tokenData);
    } catch (err) {
        const errorDetails = err.response?.data || err.message;
        console.error("[OAuth Exchange] Error:", errorDetails);
        res.status(500).json({
            error: "Token exchange failed",
            details: errorDetails
        });
    }
});

router.get('/callback', async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) return res.status(400).send("Authorization code missing");
        
        if (usedCodes.has(code)) {
            console.warn(`[OAuth Callback] Code ${code.substring(0, 8)}... already used. Skipping exchange.`);
            return res.send("Authorization already processed.");
        }
        
        usedCodes.add(code);
        await ebayTrading.exchangeCodeForToken(code);
        res.send(`
            <html>
                <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
                    <div style="background: #1e293b; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center;">
                        <h1 style="color: #26abe3;">Connection Successful!</h1>
                        <p>Your eBay account is now linked with Geonoyc AI.</p>
                        <p style="color: #94a3b8; font-size: 0.9rem;">You can close this window and return to the app.</p>
                        <button onclick="window.close()" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: #26abe3; border: none; border-radius: 0.5rem; color: white; cursor: pointer; font-weight: bold;">Close Window</button>
                    </div>
                </body>
            </html>
        `);
    } catch (err) {
        const errorDetails = err.response?.data || err.message;
        console.error("[OAuth Callback] Error:", errorDetails);
        res.status(500).json({
            error: "Authentication failed",
            details: errorDetails
        });
    }
});

module.exports = router;
