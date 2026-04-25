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

        const [payment, fulfillment, ret] = await Promise.all([
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

        res.json({
            paymentPolicies: payment.data.paymentPolicies || [],
            fulfillmentPolicies: fulfillment.data.fulfillmentPolicies || [],
            returnPolicies: ret.data.returnPolicies || []
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
