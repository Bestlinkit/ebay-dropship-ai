const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * 📋 EBAY BUSINESS POLICIES BRIDGE
 * Proxies requests to eBay Sell Account API to avoid browser-side CORS/Auth issues.
 * GET /api/ebay/policies
 */
router.get('/policies', async (req, res) => {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({ 
                status: 'ERROR', 
                message: 'Missing Authorization header' 
            });
        }

        const results = await Promise.allSettled([
            axios.get('https://api.ebay.com/sell/account/v1/payment_policy?marketplace_id=EBAY_US', {
                headers: { Authorization: token }
            }),
            axios.get('https://api.ebay.com/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_US', {
                headers: { Authorization: token }
            }),
            axios.get('https://api.ebay.com/sell/account/v1/return_policy?marketplace_id=EBAY_US', {
                headers: { Authorization: token }
            })
        ]);

        const payment = results[0].status === 'fulfilled' ? results[0].value.data.paymentPolicies : [];
        const fulfillment = results[1].status === 'fulfilled' ? results[1].value.data.fulfillmentPolicies : [];
        const ret = results[2].status === 'fulfilled' ? results[2].value.data.returnPolicies : [];

        // Log failures for debugging
        results.forEach((res, i) => {
            if (res.status === 'rejected') {
                const types = ['Payment', 'Fulfillment', 'Return'];
                console.warn(`[eBay Bridge] ${types[i]} Policy Fetch Failed:`, res.reason.message);
            }
        });

        res.json({
            paymentPolicies: payment || [],
            fulfillmentPolicies: fulfillment || [],
            returnPolicies: ret || []
        });

    } catch (err) {
        console.error("[eBay Bridge] Policy Fetch Failed:", err.message);
        res.status(500).json({
            status: 'ERROR',
            message: 'Failed to fetch eBay policies',
            error: err.message
        });
    }
});

module.exports = router;
