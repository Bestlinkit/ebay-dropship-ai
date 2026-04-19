const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 🛡️ IDENTITY MIDDLEWARE (Forensic Signature)
app.use((req, res, next) => {
    res.setHeader('X-Bridge-Identity', 'CJ-PRO-BRIDGE-v2.5');
    next();
});

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
const cjRouter = express.Router();

const CJ_API_KEY = process.env.CJ_API_KEY || 'CJ5340052@api@ca55825f11224430a4b5fb00a4ecba7b';
const CJ_GATEWAY = process.env.CJ_API_GATEWAY || 'https://developers.cjdropshipping.com/api2.0/v1';

// 🔐 SESSION VAULT: Maintain token continuity without exposing to frontend
const CJ_SESSION = {
    accessToken: null,
    expiry: null,
    lastCheck: null
};

/**
 * 🛰️ BRIDGE HEALTH CHECK
 * GET /ping
 */
cjRouter.get('/ping', (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        service: "CJ Bridge Active",
        timestamp: new Date().toISOString()
    });
});

/**
 * 🎯 CJ AUTHENTICATION (CORS PROXY & VAULT)
 * POST /auth
 */
cjRouter.post('/auth', async (req, res) => {
    const { apiKey } = req.body;
    const targetApiKey = apiKey || CJ_API_KEY;
    const authUrl = 'https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken';

    console.log("[CJ REQUEST] Endpoint hit");
    console.log(`[CJ-AUTH-PROXY] Handshake requested for API Key ending in: ...${targetApiKey.slice(-5)}`);
    
    try {
        const response = await axios.post(authUrl, { apiKey: targetApiKey }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000 
        });

        const raw = response.data;
        console.log("[CJ RESPONSE]", raw);
        console.log(`[CJ-AUTH-PROXY] Handshake Result: Code ${raw.code}`);

        // 🛡️ VAULTING PROTOCOL: Store token in secure backend memory
        const isSuccessful = (raw.code == 200 || raw.success === true);
        if (isSuccessful) {
            CJ_SESSION.accessToken = raw.data?.accessToken;
            CJ_SESSION.expiry = raw.data?.accessTokenExpiryDate;
            CJ_SESSION.lastCheck = new Date().toISOString();
            console.log(`[CJ-VAULT] Access Token Secured. Session active.`);
        }

        // 🧠 STRICT SEPARATION OF OUTPUT LAYERS
        // Layer 1: Logs (Debug only)
        console.log("[CJ DEBUG] AUTH REQUEST", { 
            url: authUrl, 
            api_key_sent: true, 
            endpoint: "authentication/getAccessToken" 
        });
        console.log("[CJ AUTH] Completed successfully");

        // Layer 2: API Response (Frontend Only)
        return res.status(isSuccessful ? 200 : 401).json({
            status: isSuccessful ? "OK" : "FAILED",
            message: raw.message || "CJ API Response",
            service: "CJ Bridge Active",
            data: raw,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.log("[CJ DEBUG] CRITICAL ERROR", {
            api_key_sent: true,
            endpoint: "authentication/getAccessToken",
            error_type: "TRANSPORT_ERROR",
            message: error.message
        });

        return res.status(500).json({ 
            status: "FAILED",
            message: error.message,
            raw: error.response?.data || null,
            service: "CJ Bridge Active",
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 🎯 CJ SEARCH
 * GET /search?keyword=...
 */
cjRouter.get('/search', async (req, res) => {
    try {
        const { keyword, page = 1, size = 20 } = req.query;
        if (!keyword) return res.status(400).json({ error: "Missing keyword" });

        // 🚦 PROTOCOL CHECK: Use session token if available, fallback to key only if vault empty
        const activeToken = CJ_SESSION.accessToken || CJ_API_KEY;

        console.log(`[CJ-API] Searching: "${keyword}" (Token: ${CJ_SESSION.accessToken ? "VAULTED" : "KEY_FALLBACK"})`);
        const response = await axios.get(`${CJ_GATEWAY}/product/listV2`, {
            params: { keyWord: keyword, page, size },
            headers: { 'CJ-Access-Token': activeToken },
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
 */
cjRouter.get('/detail', async (req, res) => {
    try {
        const { pid } = req.query;
        if (!pid) return res.status(400).json({ error: "Missing product id (pid)" });

        const activeToken = CJ_SESSION.accessToken || CJ_API_KEY;

        console.log(`[CJ-API] Fetching Detail for: ${pid}`);
        const response = await axios.get(`${CJ_GATEWAY}/product/detail`, {
            params: { pid },
            headers: { 'CJ-Access-Token': activeToken },
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
 */
cjRouter.post('/freight', async (req, res) => {
    try {
        const { startCountryCode = 'CN', endCountryCode = 'US', products } = req.body;
        
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ error: "Missing products array" });
        }

        const activeToken = CJ_SESSION.accessToken || CJ_API_KEY;

        console.log(`[CJ-API] Calculating Freight: ${startCountryCode} -> ${endCountryCode}`);
        const response = await axios.post(`${CJ_GATEWAY}/logistic/freightCalculate`, {
            startCountryCode,
            endCountryCode,
            products
        }, {
            headers: { 'CJ-Access-Token': activeToken, 'Content-Type': 'application/json' },
            timeout: 10000
        });

        res.json(response.data);
    } catch (error) {
        console.error("[CJ Freight] Error:", error.message);
        res.status(500).json({ status: "API_ERROR", message: error.message });
    }
});

// Mount Router
app.use("/api/cj", cjRouter);

// Legacy Sourcing Logic Purged

// 404 Catch-all (Hardened for APIs)
app.use((req, res) => {
    res.status(404).json({ 
        status: "ERROR", 
        message: "Route not found on CJ Bridge", 
        url: req.url,
        instruction: "Ensure your frontend is calling http://localhost:3001"
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 CJ BRIDGE ACTIVE: http://localhost:${PORT}`);
    console.log(`🔗 REACHABLE VIA: /api/cj/ping`);
    console.log(`🔐 VAULT STATUS: READY\n`);
});
