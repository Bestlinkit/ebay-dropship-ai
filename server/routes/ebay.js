
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
            const totalActive = responseXml.match(/<TotalActiveListings>(.*?)<\/TotalActiveListings>/)?.[1] || "0";
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

// REMOVED: /policies (Account not opted in, legacy AddItem used instead)

module.exports = router;
