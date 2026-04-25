const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * 📋 EBAY BUSINESS POLICIES BRIDGE
 * Proxies requests to eBay Sell Account API to avoid browser-side CORS/Auth issues.
 * GET /api/ebay/policies
 */
router.get('/policies', async (req, res) => {
    console.log("[eBay Bridge] Incoming policy request...");
    const token = req.headers.authorization;

    if (!token) {
        console.error("[eBay Bridge] Missing Authorization header");
        return res.status(401).json({ error: 'Missing Authorization header' });
    }

    try {
        // Parallel fetch for all three mandatory policy types
        const [paymentRes, fulfillmentRes, returnRes] = await Promise.all([
            axios.get('https://api.ebay.com/sell/account/v1/payment_policy', {
                params: { marketplace_id: 'EBAY_US' },
                headers: { Authorization: token }
            }),
            axios.get('https://api.ebay.com/sell/account/v1/fulfillment_policy', {
                params: { marketplace_id: 'EBAY_US' },
                headers: { Authorization: token }
            }),
            axios.get('https://api.ebay.com/sell/account/v1/return_policy', {
                params: { marketplace_id: 'EBAY_US' },
                headers: { Authorization: token }
            })
        ]);

        // Map responses to requested flat structure
        const data = {
            payment: paymentRes.data.paymentPolicies || [],
            fulfillment: fulfillmentRes.data.fulfillmentPolicies || [],
            return: returnRes.data.returnPolicies || []
        };

        console.log(`[eBay Bridge] Success. Payment: ${data.payment.length}, Fulfillment: ${data.fulfillment.length}, Return: ${data.return.length}`);
        res.json(data);
    } catch (err) {
        console.error("[eBay Bridge] Policy Fetch Failed:", err.response?.data || err.message);
        res.status(err.response?.status || 500).json({ 
            error: 'Policy fetch failed', 
            details: err.response?.data || err.message 
        });
    }
});

module.exports = router;
