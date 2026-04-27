
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

// REMOVED: /policies (Account not opted in, legacy AddItem used instead)

module.exports = router;
