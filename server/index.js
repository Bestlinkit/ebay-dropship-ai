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

// 🔐 SESSION VAULT: Maintain token continuity across requests via global singleton
if (!global.CJ_SESSION) {
    global.CJ_SESSION = { accessToken: null, refreshToken: null, expiry: null };
}

/**
 * 🛰️ BRIDGE HEALTH CHECK (REAL UPSTREAM VERIFICATION)
 * GET /ping
 */
cjRouter.get('/ping', async (req, res) => {
    try {
        const activeToken = global.CJ_SESSION?.accessToken;
        
        if (!activeToken) {
             return res.json({
                 cjConnected: false,
                 tokenValid: false,
                 latency: 0,
                 error: "Missing or expired CJ accessToken",
                 realCJResponse: false
             });
        }

        const startTime = Date.now();
        // Request lightweight catalog to verify token validity
        const response = await axios.get(`${CJ_GATEWAY}/product/listV2`, {
            params: { page: 1, size: 1 },
            headers: { 'CJ-Access-Token': activeToken },
            timeout: 5000
        });
        const latency = Date.now() - startTime;
        
        const isListValid = response.data?.code == 200 || response.data?.result === true;
        
        console.log(`[CJ TRACE] PING`, {
            payload: { page: 1, size: 1 },
            httpStatus: response.status,
            rawResponse: response.data,
            tokenUsed: `...${activeToken.slice(-4)}`
        });

        return res.status(200).json({ 
            cjConnected: true,
            tokenValid: isListValid,
            latency: latency,
            realCJResponse: true
        });
    } catch (e) {
        return res.status(200).json({
            cjConnected: false,
            tokenValid: false,
            latency: 0,
            realCJResponse: !!e.response,
            error: e.response?.data || e.message
        });
    }
});

/**
 * 🎯 CJ AUTHENTICATION (CORS PROXY & VAULT)
 * POST /auth
 */
cjRouter.post('/auth', async (req, res) => {
    const { apiKey } = req.body;
    let targetApiKey = apiKey;
    
    // 🛡️ Filter out front-end Vite unparsed fallback artifacts
    if (!targetApiKey || targetApiKey === "CJ_API_KEY_FROM_ENV" || targetApiKey === "undefined") {
        targetApiKey = CJ_API_KEY;
    }

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
            global.CJ_SESSION = {
                accessToken: raw.data?.accessToken,
                refreshToken: raw.data?.refreshToken,
                expiry: raw.data?.accessTokenExpiryDate
            };
            console.log("CJ TOKEN SAVED:", !!global.CJ_SESSION.accessToken);
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
        if (isSuccessful) {
            return res.status(200).json({
                status: "AUTH_SUCCESS",
                cjLinked: true,
                accessTokenExists: true
            });
        } else {
            return res.status(401).json({
                status: "AUTH_FAILED",
                cjLinked: false,
                error: raw
            });
        }

    } catch (error) {
        console.log("[CJ DEBUG] CRITICAL ERROR", {
            api_key_sent: true,
            endpoint: "authentication/getAccessToken",
            error_type: "TRANSPORT_ERROR",
            message: error.message
        });

        return res.status(500).json({ 
            status: "AUTH_FAILED",
            cjLinked: false,
            error: error.response?.data || error.message
        });
    }
});

/**
 * 🛡️ SMART TOKEN VALIDATION & AUTO-RECOVERY
 * Automatically attempts to restore token if session is lost (e.g. server restart)
 */
cjRouter.use(async (req, res, next) => {
    if (req.path === '/auth' || req.path === '/ping') return next();

    // 🔄 AUTO-RECOVERY: If token is missing, attempt immediate handshake
    if (!global.CJ_SESSION?.accessToken) {
        console.log(`[CJ SECURITY] Session lost. Attempting auto-recovery for: ${req.path}`);
        
        try {
            const authUrl = 'https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken';
            const targetApiKey = CJ_API_KEY;

            const response = await axios.post(authUrl, { apiKey: targetApiKey }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000 
            });

            const raw = response.data;
            if (raw.code == 200 || raw.success === true) {
                global.CJ_SESSION = {
                    accessToken: raw.data?.accessToken,
                    refreshToken: raw.data?.refreshToken,
                    expiry: raw.data?.accessTokenExpiryDate
                };
                console.log("[CJ SECURITY] Auto-recovery successful. Token restored.");
            } else {
                console.error("[CJ SECURITY] Auto-recovery failed:", raw.message);
                return res.status(401).json({
                    cjConnected: false,
                    tokenValid: false,
                    error: "Auto-recovery failed. Manual auth required.",
                    raw: raw
                });
            }
        } catch (error) {
            console.error("[CJ SECURITY] Auto-recovery exception:", error.message);
            return res.status(401).json({
                cjConnected: false,
                tokenValid: false,
                error: "Session lost and auto-recovery exception occurred."
            });
        }
    }
    next();
});

/**
 * 🎯 CJ SEARCH
 * GET /search?keyword=...
 */
cjRouter.get('/search', async (req, res) => {
    console.log("CJ ROUTE HIT: /api/cj/search");
    const { keyword, page = 1, size = 20 } = req.query;
    const activeToken = global.CJ_SESSION?.accessToken;
    const payload = { keyWord: keyword, page, size };

    try {
        if (!keyword) return res.status(400).json({ error: "Missing keyword" });

        // STEP 1: ADD BACKEND LOGGING (MANDATORY)
        console.log("CJ REQUEST PAYLOAD:", payload);

        const response = await axios.get(`${CJ_GATEWAY}/product/listV2`, {
            params: payload,
            headers: { 'CJ-Access-Token': activeToken },
            timeout: 30000
        });

        // STEP 1: LOG RAW RESPONSE
        console.log("CJ RAW RESPONSE:", response.data);

        // STEP 4: HANDLE EMPTY RESPONSE
        const rawContent = response.data?.data?.content;
        let productList = [];
        if (Array.isArray(rawContent)) {
            if (rawContent.length > 0 && rawContent[0].productList) {
                productList = rawContent.flatMap(block => block.productList || []);
            } else {
                productList = rawContent;
            }
        } else {
            productList = response.data?.data?.productList || [];
        }

        if (productList.length === 0) {
            console.warn("CJ returned empty product list");
        }

        return res.json(response.data);
    } catch (error) {
        // STEP 1: LOG ERROR
        console.error("CJ ERROR:", error.message);

        // STEP 2: RETURN DEBUG TO FRONTEND
        return res.status(500).json({ 
            success: false,
            status: "API_ERROR", 
            message: error.message,
            debug: {
                payload,
                response: error.response?.data || null,
                error: error.message
            }
        });
    }
});
// Cleanup complete

/**
 * 🎯 CJ PRODUCT DETAIL
 */
cjRouter.get('/detail', async (req, res) => {
    console.log("CJ ROUTE HIT: /api/cj/detail");
    const { pid } = req.query;
    const activeToken = global.CJ_SESSION?.accessToken;
    const payload = { pid };

    try {
        if (!pid) return res.status(400).json({ error: "Missing product id (pid)" });

        // STEP 1: ADD BACKEND LOGGING
        console.log("CJ REQUEST PAYLOAD:", payload);

        const response = await axios.get(`${CJ_GATEWAY}/product/query`, {
            params: payload,
            headers: { 'CJ-Access-Token': activeToken },
            timeout: 30000
        });

        // STEP 1: LOG RAW RESPONSE
        console.log("CJ RAW RESPONSE:", response.data);

        return res.json(response.data);
    } catch (error) {
        // STEP 1: LOG ERROR
        console.error("CJ ERROR:", error.message);

        // STEP 2: RETURN DEBUG TO FRONTEND
        return res.status(500).json({ 
            success: false,
            status: "API_ERROR", 
            message: error.message,
            debug: {
                payload,
                response: error.response?.data || null,
                error: error.message
            }
        });
    }
});

// 🚢 CJ FREIGHT CALCULATION (v14.8 - Flat Payload Resolution)
cjRouter.post('/freight', async (req, res) => {
    try {
        const { sku, quantity = 1, countryCode = 'US', warehouseId } = req.body;
        
        if (!sku) {
            return res.status(400).json({ error: "Missing SKU in payload" });
        }

        const activeToken = global.CJ_SESSION?.accessToken;
        const startTime = Date.now();

        // 🧠 v14.13: Refined Warehouse Mapping
        const isUS = warehouseId && (warehouseId.toString().toUpperCase().includes('US') || warehouseId.toString().toUpperCase().includes('UNITED STATES'));
        const startCountryCode = isUS ? 'US' : 'CN';

        const payload = {
            startCountryCode,
            endCountryCode: countryCode || 'US',
            products: [{ variantSku: sku, quantity }]
        };

        const response = await axios.post(`${CJ_GATEWAY}/logistic/freightCalculate`, payload, {
            headers: { 'CJ-Access-Token': activeToken, 'Content-Type': 'application/json' },
            timeout: 10000
        });

        console.log(`[CJ TRACE] FREIGHT v14.8`, {
            sku,
            code: response.data?.code,
            latency: Date.now() - startTime
        });

        return res.json(response.data);
    } catch (error) {
        console.error("[CJ Freight Proxy] Error:", error.message);
        res.status(500).json({ status: "API_ERROR", message: error.message });
    }
});

const { GoogleGenerativeAI } = require("@google/generative-ai");

// 🤖 GEMINI AI OPTIMIZATION (v3.0 - DEBUG & RESILIENCE MODE)
app.post('/api/gemini', async (req, res) => {
    const modelName = "gemini-1.5-flash"; // STRICT MODEL
    const { prompt } = req.body;
    const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    // STEP 2: VERIFY API KEY
    if (!GEMINI_KEY) {
        console.error("GEMINI ERROR: GEMINI_API_KEY_MISSING");
        return res.status(500).json({ error: "GEMINI_API_KEY_MISSING" });
    }

    // STEP 1: LOG BEFORE CALL
    console.log("GEMINI REQUEST:", {
        apiKeyPresent: !!GEMINI_KEY,
        promptLength: prompt?.length,
        model: modelName
    });

    try {
        // Initialize the SDK
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });

        // 🔄 RESILIENCE LAYER: Retry loop for unstable networks
        let result;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                attempts++;
                console.log(`[AI SDK] Handshake Attempt ${attempts}/${maxAttempts}...`);
                result = await model.generateContent(prompt);
                break; // Success!
            } catch (err) {
                console.error(`[AI SDK] Attempt ${attempts} failed:`, err.message);
                if (attempts >= maxAttempts) throw err;
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        const response = await result.response;
        const rawText = response.text();
        
        // STEP 1: LOG AFTER CALL
        console.log("GEMINI RAW RESPONSE RECEIVED (Length:", rawText.length, ")");

        // Clean up markdown code blocks if Gemini wraps the JSON
        const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const jsonResult = JSON.parse(cleanText);
            return res.json({
                success: true,
                ...jsonResult
            });
        } catch (e) {
            console.error("Gemini returned invalid JSON:", cleanText);
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    return res.json({
                        success: true,
                        ...JSON.parse(jsonMatch[0])
                    });
                } catch (innerE) {
                    throw new Error("INVALID_JSON_FORMAT");
                }
            }
            throw new Error("INVALID_JSON_FORMAT");
        }

    } catch (error) {
        // LOG ERRORS
        console.error("GEMINI ERROR:", error.response?.data || error.message);

        // STEP 5: FAIL SAFE RESPONSE
        return res.json({
            success: false,
            error_detail: error.message,
            fallback: {
                titles: [
                    { text: "Optimized eBay Listing (Premium)", score: 95 },
                    { text: "Quality Direct Sourced Item (Best Seller)", score: 88 },
                    { text: "Global Sourcing Special Edition", score: 82 }
                ],
                description: "This product offers premium quality and exceptional value. Sourced directly from verified manufacturers to ensure top-tier performance and reliability. Features high-quality materials and professional-grade durability.",
                tags: ["Top Quality", "Best Seller", "Free Shipping", "Premium Item", "eBay Choice"]
            }
        });
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
    console.log(`🤖 AI OPTIMIZATION: /api/gemini (POST)`);
    console.log(`🔐 VAULT STATUS: READY\n`);
});
