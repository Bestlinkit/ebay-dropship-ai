/**
 * Universal Crystal Bridge (v6.0-SHIELD)
 * Production-Ready Sourcing Pipeline
 */

// 1. MD5 HELPER (Legacy Compatibility)
const md5 = (string) => {
    function md5cycle(x, k) {
        var a = x[0], b = x[1], c = x[2], d = x[3];
        a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
        c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
        a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
        c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
        a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
        c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
        a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
        c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
        a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
        c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
        a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
        c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
        a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
        c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
        a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
        c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
        a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
        c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
        a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
        c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
        a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
        c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
        a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
        c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
        a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
        c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
        a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
        c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
        a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
        c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
        a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
        c = ii(c, d, a, b, k[2], 15, 718787280); b = ii(b, c, d, a, k[9], 21, -343485551);
        x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
    }
    function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b); }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
    function md51(s) {
        var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
        for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i)));
        s = s.substring(i - 64);
        var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i++) tail[i] = 0;
        }
        tail[14] = n * 8;
        md5cycle(state, tail);
        return state;
    }
    function md5blk(s) {
        var md5blks = [], i;
        for (i = 0; i < 64; i += 4) md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
        return md5blks;
    }
    var hex_chr = '0123456789abcdef'.split('');
    function rhex(n) { var s = '', j = 0; for (; j < 4; j++) s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F]; return s; }
    function hex(x) { for (var i = 0; i < x.length; i++) x[i] = rhex(x[i]); return x.join(''); }
    function add32(a, b) { return (a + b) & 0xFFFFFFFF; }
    return hex(md51(string));
};

// 2. SHA-256 HELPER
const sha256 = async (string) => {
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(string));
    return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, "0")).join("");
};

// 3. PERSISTENT CACHE
// [DEPRECATED] workingAuthMode removed (AliExpress only architecture)

// 4. TIMEOUT WRAPPER (8s Hard Limit)
const fetchWithTimeout = (url, options, timeout = 8000) =>
    Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("GATEWAY_TIMEOUT")), timeout)
        )
    ]);

export default {
    /**
     * CRYSTAL BRIDGE v7.0
     * MANIFEST:
     * - AliExpress DS API Integration (Official)
     * - HTML Fallback Scraping
     * - Health Monitoring
     * 
     * NOTE: Ensure ALI_APP_KEY and ALI_APP_SECRET are set in the Cloudflare
     * Worker settings (Environment Variables) for production security.
     */
    async fetch(request, env) {
        const url = new URL(request.url);
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*"
        };

        // Standard Monitoring
        console.log(`Route hit: ${url.pathname} [${request.method}]`);
        const pathname = url.pathname.replace(/\/+$/, '') || '/';

        if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

        // 0. ROUTE: /health
        if (pathname === "/health") {
            return new Response(JSON.stringify({ status: "online", version: "7.0-ALPHA" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 1. ROUTE: /aliexpress-search (LEGACY SCRAPE)
        if (pathname === "/aliexpress-search") {
            try {
                const query = url.searchParams.get("q");
                if (!query) throw new Error("Missing query");

                // 🛡️ ANTI-BOT HARDENING (v31.1)
                const response = await fetchWithTimeout(`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                        "Accept-Language": "en-US,en;q=0.9",
                        "Cache-Control": "no-cache",
                        "Pragma": "no-cache"
                    }
                });

                const html = await response.text();
                
                // Detection: Check for Bot-Challenge/Blocked
                if (!html || html.length < 1000 || html.includes('firewall') || html.includes('sliding_pc_code')) {
                     return new Response(JSON.stringify({ 
                         status: "BRIDGE_THROTTLED", 
                         error: "AliExpress has invoked a security challenge. Please try again in 5 minutes.",
                         code: 429
                     }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                return new Response(html, { headers: { ...corsHeaders, "Content-Type": "text/html" } });

            } catch (err) { 
                return new Response(JSON.stringify({ 
                    status: "SCRAPER_ERROR", 
                    error: err.message,
                    context: "Search discovery failed on the worker."
                }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); 
            }
        }

        // 3. ROUTE: /aliexpress-product-details (LEGACY SCRAPE - Maintain for fallback)
        if (pathname === "/aliexpress-product-details") {
            try {
                const targetUrl = url.searchParams.get("url");
                if (!targetUrl) throw new Error("Missing product URL");

                const response = await fetchWithTimeout(targetUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                    }
                });

                const html = await response.text();
                return new Response(html, { headers: { ...corsHeaders, "Content-Type": "text/html" } });
            } catch (err) {
                return new Response(JSON.stringify({ status: "ENRICHMENT_ERROR", error: err.message }), { status: 500, headers: corsHeaders });
            }
        }

        // 4. ROUTE: /api/ali-ds-proxy (OFFICIAL DS API v2.0)
        if (pathname === "/api/ali-ds-proxy" || pathname === "/ali-ds-proxy") {
            try {
                const body = await request.json();
                const params = { ...body };
                
                const ALI_APP_KEY = env.ALI_APP_KEY || '532310';
                const ALI_APP_SECRET = env.ALI_APP_SECRET || 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3';

                // SIGNING PROTOCOL (v2.0 MD5)
                const sortedKeys = Object.keys(params).sort();
                let signStr = ALI_APP_SECRET;
                for (const key of sortedKeys) {
                    signStr += key + params[key];
                }
                signStr += ALI_APP_SECRET;

                const sign = md5(signStr).toUpperCase();
                
                const gateway = 'https://eco.taobao.com/router/rest';
                const searchParams = new URLSearchParams({ ...params, sign });

                const response = await fetchWithTimeout(gateway, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: searchParams.toString()
                });

                const data = await response.json();

                // Validation: Check for HTML leakage (Shadow-routing errors)
                if (typeof data === 'string' && data.trim().startsWith('<!doctype')) {
                    return new Response(JSON.stringify({
                        status: "INVALID_API_ROUTE",
                        message: "HTML returned instead of JSON"
                    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });

            } catch (err) {
                return new Response(JSON.stringify({ status: "API_GATEWAY_ERROR", error: err.message }), { 
                    status: 500, 
                    headers: { ...corsHeaders, "Content-Type": "application/json" } 
                });
            }
        }

        // 5. FALLBACK Proxy
        const targetUrl = url.searchParams.get("url");
        if (targetUrl) {
            try {
                const headers = new Headers(request.headers);
                headers.delete("Host");

                const proxyResponse = await fetchWithTimeout(targetUrl, {
                    method: request.method,
                    headers: headers,
                    body: (request.method !== "GET" && request.method !== "HEAD") ? await request.arrayBuffer() : undefined,
                });

                const responseHeaders = new Headers(corsHeaders);
                proxyResponse.headers.forEach((v, k) => {
                    if (!k.toLowerCase().startsWith("access-control-")) responseHeaders.set(k, v);
                });

                return new Response(proxyResponse.body, { status: proxyResponse.status, headers: responseHeaders });
            } catch (err) { 
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders }); 
            }
        }

        return new Response("Crystal Bridge: v6.5 Active", { status: 200 });
    }
};
