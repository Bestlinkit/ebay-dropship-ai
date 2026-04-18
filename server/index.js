const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper: MD5 Signing
const generateMD5 = (data) => {
    return crypto.createHash('md5').update(data).digest('hex');
};

// --- EPROLO ENDPOINTS ---

// Resilient Config Loading (v15.0)
const EPROLO_APP_KEY = process.env.EPROLO_APP_KEY || process.env.VITE_EPROLO_API_KEY;
const EPROLO_SECRET = process.env.EPROLO_SECRET || process.env.VITE_EPROLO_API_SECRET;

// Startup Integrity Log with Masking
console.log("EPROLO_APP_KEY:", EPROLO_APP_KEY ? `LOADED (****${EPROLO_APP_KEY.slice(-4)}) ✅` : "MISSING ❌");
console.log("EPROLO_SECRET:", EPROLO_SECRET ? `LOADED (****${EPROLO_SECRET.slice(-4)}) ✅` : "MISSING ❌");

app.post('/api/eprolo/search', async (req, res) => {
    try {
        const { keyword, page_index = 0, page_size = 20 } = req.body;
        
        if (!EPROLO_APP_KEY || !EPROLO_SECRET) {
            console.error("[Eprolo] CRITICAL: Missing keys in .env (Checked ROOT and SERVER paths)");
            return res.status(500).json({ status: "CONFIG_ERROR", message: "Eprolo not configured" });
        }

        // 🚀 V18.0 PROTOCOL: Dual-Auth Split Transmission (Verified via verify_eprolo.js)
        const timestamp = Date.now(); // Milliseconds as per legacy check
        const sign = generateMD5(`${EPROLO_APP_KEY}${timestamp}${EPROLO_SECRET}`);
        
        let baseUrl = 'https://openapi.eprolo.com/eprolo_product_list.html';
        const queryParams = `?apiKey=${EPROLO_APP_KEY}&sign=${sign}&timestamp=${timestamp}`;
        let finalUrl = `${baseUrl}${queryParams}`;

        const proxyUrl = process.env.VITE_PROXY_URL;
        if (proxyUrl) {
            console.log(`[Eprolo] Routing via Bridge: ${proxyUrl}`);
            finalUrl = `${proxyUrl}?url=${encodeURIComponent(finalUrl)}`;
        }

        const body = { 
            keyword, 
            page_index, 
            page_size 
        };

        console.log(`[Eprolo] v18 Auth Transmitted via URL Query String.`);

        const response = await axios.post(finalUrl, body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });

        console.log(`[Eprolo] v18 Result: Code ${response.data.code}, Items: ${response.data.data?.length || 0}`);
        res.json(response.data);
    } catch (error) {
        console.error("Eprolo Search Error:", error.message);
        res.status(500).json({ status: "API_ERROR", message: error.message });
    }
});

app.post('/api/eprolo/detail', async (req, res) => {
    try {
        const { product_id } = req.body;
        
        if (!EPROLO_APP_KEY || !EPROLO_SECRET) {
            return res.status(500).json({ status: "CONFIG_ERROR", message: "Eprolo not configured" });
        }

        // 🚀 V18.0 PROTOCOL: Dual-Auth Split Transmission
        const timestamp = Date.now();
        const sign = generateMD5(`${EPROLO_APP_KEY}${timestamp}${EPROLO_SECRET}`);
        
        let baseUrl = 'https://openapi.eprolo.com/eprolo_product_detail.html';
        const queryParams = `?apiKey=${EPROLO_APP_KEY}&sign=${sign}&timestamp=${timestamp}`;
        let finalUrl = `${baseUrl}${queryParams}`;

        const proxyUrl = process.env.VITE_PROXY_URL;
        if (proxyUrl) {
            console.log(`[Eprolo-Detail] Routing via Bridge: ${proxyUrl}`);
            finalUrl = `${proxyUrl}?url=${encodeURIComponent(finalUrl)}`;
        }

        const body = { product_id };

        console.log(`[Eprolo-Detail] Fetching metadata for ID: ${product_id}`);

        const response = await axios.post(finalUrl, body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });

        res.json(response.data);
    } catch (error) {
        console.error("Eprolo Detail Error:", error.message);
        res.status(500).json({ status: "API_ERROR", message: error.message });
    }
});

// --- CJ DROPSHIPPING API (v2.0 - Unified Sourcing) ---

const CJ_API_KEY = process.env.CJ_API_KEY || 'CJ5340052@api@ca55825f11224430a4b5fb00a4ecba7b';
const CJ_GATEWAY = process.env.CJ_API_GATEWAY || 'https://developers.cjdropshipping.com/api2.0/v1';

/**
 * 🎯 CJ AUTHENTICATION (CORS PROXY)
 * POST /api/cj/auth
 */
app.post('/api/cj/auth', async (req, res) => {
    try {
        const { apiKey } = req.body;
        const targetApiKey = apiKey || CJ_API_KEY;
        const authUrl = 'https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken';

        console.log(`[CJ-AUTH-PROXY] Handshake requested for API Key ending in: ...${targetApiKey.slice(-5)}`);
        
        const response = await axios.post(authUrl, { apiKey: targetApiKey }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });

        console.log(`[CJ-AUTH-PROXY] Result: ${response.data.code === '200' ? "SUCCESS ✅" : "FAILED ❌"}`);
        res.json(response.data);
    } catch (error) {
        console.error("[CJ Auth Proxy] Error:", error.message);
        res.status(500).json({ 
            status: "API_ERROR", 
            message: error.message,
            code: error.response?.status || 500,
            data: error.response?.data || {} 
        });
    }
});

/**
 * 🎯 CJ SEARCH
 * GET /api/cj/search?keyword=...
 */
app.get('/api/cj/search', async (req, res) => {
    try {
        const { keyword, page = 1, size = 20 } = req.query;
        if (!keyword) return res.status(400).json({ error: "Missing keyword" });

        console.log(`[CJ-API] Searching: "${keyword}"`);
        const response = await axios.get(`${CJ_GATEWAY}/product/listV2`, {
            params: { keyWord: keyword, page, size },
            headers: { 'CJ-Access-Token': CJ_API_KEY },
            timeout: 10000
        });

        res.json(response.data);
    } catch (error) {
        console.error("[CJ Search] Error:", error.message);
        res.status(500).json({ status: "API_ERROR", message: error.message });
    }
});

/**
 * 🎯 CJ PRODUCT DETAIL
 * GET /api/cj/detail?pid=...
 */
app.get('/api/cj/detail', async (req, res) => {
    try {
        const { pid } = req.query;
        if (!pid) return res.status(400).json({ error: "Missing product id (pid)" });

        console.log(`[CJ-API] Fetching Detail for: ${pid}`);
        const response = await axios.get(`${CJ_GATEWAY}/product/detail`, {
            params: { pid },
            headers: { 'CJ-Access-Token': CJ_API_KEY },
            timeout: 10000
        });

        res.json(response.data);
    } catch (error) {
        console.error("[CJ Detail] Error:", error.message);
        res.status(500).json({ status: "API_ERROR", message: error.message });
    }
});

/**
 * 🎯 CJ FREIGHT CALCULATION
 * POST /api/cj/freight
 */
app.post('/api/cj/freight', async (req, res) => {
    try {
        const { startCountryCode = 'CN', endCountryCode = 'US', products } = req.body;
        
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ error: "Missing products array" });
        }

        console.log(`[CJ-API] Calculating Freight: ${startCountryCode} -> ${endCountryCode}`);
        const response = await axios.post(`${CJ_GATEWAY}/logistic/freightCalculate`, {
            startCountryCode,
            endCountryCode,
            products
        }, {
            headers: { 'CJ-Access-Token': CJ_API_KEY, 'Content-Type': 'application/json' },
            timeout: 10000
        });

        res.json(response.data);
    } catch (error) {
        console.error("[CJ Freight] Error:", error.message);
        res.status(500).json({ status: "API_ERROR", message: error.message });
    }
});

// Legacy Sourcing Logic Purged

app.listen(PORT, () => {
    console.log(`Stable Sourcing Backend running on port ${PORT}`);
});
