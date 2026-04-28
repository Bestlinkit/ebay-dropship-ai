
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
        console.log("INCOMING PAYLOAD:", JSON.stringify(itemData, null, 2));
        
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
        console.error("[eBay Route] CRITICAL LISTING ERROR:", err);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error during listing',
            error: err.message,
            stack: err.stack
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

// REMOVED: /policies (Legacy Mode Only)

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
 * 🏷️ CATEGORY SUGGESTIONS & ROOT (UNIFIED)
 * GET /api/ebay/categories
 */
router.get('/categories', async (req, res) => {
    try {
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
        const categoryId = req.params.id;
        const treeId = req.query.treeId || "0";
        const aspects = await ebayTrading.getItemAspectsForCategory(categoryId, treeId);
        res.json(aspects);
    } catch (err) {
        res.json([]);
    }
});

module.exports = router;
