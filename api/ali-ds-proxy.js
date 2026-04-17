const axios = require('axios');
const crypto = require('crypto');

/**
 * AliExpress DS API Proxy - LIVE SERVERLESS PROTOCOL (v1.0)
 * Designed for Vercel/Netlify Deployment.
 */
module.exports = async (req, res) => {
    // 1. CORS & METHOD VALIDATION
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
        const ALI_APP_KEY = process.env.ALI_APP_KEY || '532310';
        const ALI_APP_SECRET = process.env.ALI_APP_SECRET || 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3';
        const params = req.body;

        if (!params || Object.keys(params).length === 0) {
            return res.status(400).json({ message: "Missing request parameters" });
        }

        // 2. SIGNING PROTOCOL (v2.0 MD5)
        const sortedKeys = Object.keys(params).sort();
        let signStr = ALI_APP_SECRET;
        for (const key of sortedKeys) {
            signStr += key + params[key];
        }
        signStr += ALI_APP_SECRET;

        const sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();

        // 3. REQUEST EXECUTION
        const gateway = 'https://eco.taobao.com/router/rest';
        
        const response = await axios.post(gateway, new URLSearchParams({
            ...params,
            sign
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000
        });

        // 4. LOGGING & VALIDATION (Serverless Side)
        const first100 = typeof response.data === 'string' 
            ? response.data.substring(0, 100) 
            : JSON.stringify(response.data).substring(0, 100);

        if (typeof response.data === 'string' && response.data.trim().startsWith('<!doctype')) {
            return res.status(500).json({ 
                status: "INVALID_API_ROUTE", 
                message: "HTML returned instead of JSON",
                preview: first100
            });
        }

        res.status(200).json(response.data);
    } catch (error) {
        console.error("Live Proxy Error:", error.message);
        res.status(500).json({ 
            status: "API_ERROR", 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
