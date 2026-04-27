
const express = require('express');
const router = express.Router();
const ebayTrading = require('../services/ebayTrading');

/**
 * 📦 LIST PRODUCT
 * POST /api/ebay/list
 */
router.post('/list', async (req, res) => {
    try {
        const itemData = req.body;
        console.log(`[eBay Route] Listing attempt for: ${itemData.title}`);
        
        const responseXml = await ebayTrading.addItem(itemData);
        
        // Parse basic status from XML response
        const ack = responseXml.match(/<Ack>(.*?)<\/Ack>/)?.[1];
        
        if (ack === 'Success' || ack === 'Warning') {
            const itemId = responseXml.match(/<ItemID>(.*?)<\/ItemID>/)?.[1];
            res.json({
                success: true,
                itemId: itemId,
                ack: ack,
                raw: responseXml
            });
        } else {
            const errors = [...responseXml.matchAll(/<LongMessage>(.*?)<\/LongMessage>/g)].map(m => m[1]);
            res.status(400).json({
                success: false,
                errors: errors,
                raw: responseXml
            });
        }
    } catch (err) {
        console.error("[eBay Route] List Failed:", err.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error during listing',
            error: err.message
        });
    }
});

/**
 * 📊 GET ACCOUNT SUMMARY
 * GET /api/ebay/account
 */
router.get('/account', async (req, res) => {
    try {
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
    } catch (err) {
        console.error("[eBay Route] Account Fetch Failed:", err.message);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * 👤 GET USER PROFILE
 * GET /api/ebay/user
 */
router.get('/user', async (req, res) => {
    try {
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
    } catch (err) {
        console.error("[eBay Route] User Fetch Failed:", err.message);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/**
 * 🛡️ GET BUSINESS POLICIES
 * GET /api/ebay/policies
 */
router.get('/policies', async (req, res) => {
    try {
        const responseXml = await ebayTrading.getBusinessPolicies();
        const ack = responseXml.match(/<Ack>(.*?)<\/Ack>/)?.[1];

        if (ack === 'Success' || ack === 'Warning') {
            const profiles = [];
            const profileRegex = /<SellerProfile>(.*?)<\/SellerProfile>/gs;
            let match;

            while ((match = profileRegex.exec(responseXml)) !== null) {
                const profileXml = match[1];
                const id = profileXml.match(/<ProfileID>(.*?)<\/ProfileID>/)?.[1];
                const name = profileXml.match(/<ProfileName>(.*?)<\/ProfileName>/)?.[1];
                const type = profileXml.match(/<ProfileType>(.*?)<\/ProfileType>/)?.[1];
                
                profiles.push({ id, name, type });
            }

            res.json({
                success: true,
                fulfillment: profiles.filter(p => p.type === 'SHIPPING').map(p => ({ fulfillmentPolicyId: p.id, name: p.name })),
                payment: profiles.filter(p => p.type === 'PAYMENT').map(p => ({ paymentPolicyId: p.id, name: p.name })),
                return: profiles.filter(p => p.type === 'RETURN_POLICY').map(p => ({ returnPolicyId: p.id, name: p.name }))
            });
        } else {
            const isNotOptedIn = responseXml.includes("21919456"); 
            res.json({
                success: false,
                isNotOptedIn: isNotOptedIn,
                error: "Business Policies not found or account not opted in.",
                fulfillment: [],
                payment: [],
                return: []
            });
        }
    } catch (err) {
        console.error("[eBay Route] Policy Fetch Failed:", err.message);
        res.status(500).json({
            success: false,
            error: err.message,
            fulfillment: [],
            payment: [],
            return: []
        });
    }
});

/**
 * 📋 GET ACTIVE LISTINGS
 * GET /api/ebay/listings
 */
router.get('/listings', async (req, res) => {
    try {
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
        const data = await ebayTrading.refreshAccessToken(req.body.refresh_token);
        res.json(data);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
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
 * 🏷️ CATEGORY SUGGESTIONS
 * GET /api/ebay/categories
 */
router.get('/categories', async (req, res) => {
    try {
        const results = await ebayTrading.getCategorySuggestions(req.query.q);
        res.json(results);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// REMOVED: /policies (Account not opted in, legacy AddItem used instead)

module.exports = router;
