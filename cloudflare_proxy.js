/**
 * Unified Crystal Bridge (v34.0-HMAC)
 * Protocol: AliExpress DS v2.0 (Singapore Global)
 * Security: HMAC-SHA256 with Path-Prefix Signing
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

const fetchWithTimeout = (url, options, timeout = 15000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error("GATEWAY_TIMEOUT")), timeout))
  ]);

// 🛡️ NATIVE HMAC-SHA256 (Required for DS API calls)
async function hmacSha256(key, message) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// 🛡️ NATIVE MD5 (Required for TOP OAuth Exchange)
async function md5Hash(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('MD5', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// 🛡️ NATIVE TOP TIMESTAMP HELPER
function getTopTimestamp() {
  const d = new Date();
  return d.toISOString()
    .replace('T', ' ')
    .replace(/\..+/, ''); // Format: 2024-04-20 12:30:45
}

/**
 * 🛰️ TOP SIGNATURE GENERATOR (Strict Standard)
 * Algorithm: UpperCase(MD5(secret + sorted_params + secret))
 */
async function generateTopSignature(params, appSecret) {
    const paramsCopy = { ...params };
    
    // ⚔️ CRITICAL: Remove specific keys from the signature string
    // These should NOT be part of the concatenated hash
    const keysToRemove = ['sign', 'client_secret', 'secret', 'sign_method_type'];
    keysToRemove.forEach(key => delete paramsCopy[key]);
    
    // Sort keys alphabetically (ASCII)
    const sortedKeys = Object.keys(paramsCopy).sort();
    
    let signString = '';
    for (const key of sortedKeys) {
        // Ensure we only concatenate values that exist
        if (paramsCopy[key] !== undefined && paramsCopy[key] !== null && paramsCopy[key] !== '') {
            signString += key + paramsCopy[key];
        }
    }
    
    // Final wrapping
    const stringToSign = appSecret + signString + appSecret;
    return await md5Hash(stringToSign);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const rawPath = url.pathname;
    const pathname = rawPath.replace(/\/+/g, '/').replace(/\/+$/, '') || '/';
    console.log(`[Bridge Route] Raw: ${rawPath} | Normalized: ${pathname}`);

    // 1. EBAY GATEWAY (Remains legacy passthrough)
    const targetUrl = url.searchParams.get("url");
    if (targetUrl) {
      try {
        const headers = new Headers(request.headers);
        headers.delete("Host");
        const auth = url.searchParams.get("auth");
        const callname = url.searchParams.get("callname");
        const siteid = url.searchParams.get("siteid");
        if (auth) headers.set("X-EBAY-API-IAF-TOKEN", auth);
        if (callname) headers.set("X-EBAY-API-CALL-NAME", callname);
        if (siteid) headers.set("X-EBAY-API-SITEID", siteid);

        const res = await fetchWithTimeout(targetUrl, {
          method: request.method,
          headers: headers,
          body: (request.method !== "GET" && request.method !== "HEAD") ? await request.arrayBuffer() : undefined,
        });

        const respHeaders = new Headers(corsHeaders);
        res.headers.forEach((v, k) => { if (!k.toLowerCase().startsWith("access-control-")) respHeaders.set(k, v); });
        return new Response(res.body, { status: res.status, headers: respHeaders });
      } catch (err) { return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders }); }
    }

    // 2. ALI SEARCH (Scraper Fallback)
    if (pathname === "/aliexpress-search") {
      try {
        const query = url.searchParams.get("q");
        const res = await fetchWithTimeout(`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" }
        });
        const html = await res.text();
        return new Response(html, { headers: { ...corsHeaders, "Content-Type": "text/html" } });
      } catch (err) { return new Response(err.message, { status: 500, headers: corsHeaders }); }
    }

    // 3. ALIEXPRESS OAUTH SURGICAL FIX (v34.22)
    if (pathname.includes("/rest/auth/token/security/create") || pathname.includes("/oauth/token")) {
      try {
        const body = await request.json();
        const ALI_SECRET = env.ALI_APP_SECRET || 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3';
        const ALI_KEY = env.ALI_APP_KEY || '532310';
        const ALI_REDIRECT = body.redirect_uri || 'https://geonoyc-dropshipping.web.app/callback';
        
        // 🛡️ Step 1: Baseline Parameters (EXCLUDING sign and sign_method from hash)
        const signParams = {
          app_key: ALI_KEY,
          code: body.code,
          grant_type: 'authorization_code',
          redirect_uri: ALI_REDIRECT,
          timestamp: Date.now().toString()
        };

        // 🛡️ Step 2: Alphabetical Sort
        const sortedKeys = Object.keys(signParams).sort();
        
        // 🛡️ Step 3: Raw Concatenation (NO encoding, NO symbols)
        let signString = '';
        for (const key of sortedKeys) {
          signString += key + signParams[key];
        }

        // 🛡️ Step 4: Final Wrap and MD5
        const finalStringForHash = ALI_SECRET + signString + ALI_SECRET;
        const signature = await md5Hash(finalStringForHash);

        // 🛠️ MANDATORY LOGGING
        console.log('=== ALIEXPRESS OAUTH SIGNING DEBUG ===');
        console.log('1. Raw Params:', signParams);
        console.log('2. Sorted Param String:', signString);
        console.log('3. Final String Before Hash:', finalStringForHash);
        console.log('4. Generated Sign:', signature);

        // 🛡️ Step 5: Build Final URL-Encoded Body
        const finalBodyParams = new URLSearchParams({
          ...signParams,
          sign: signature,
          sign_method: 'md5'
        });

        const ALI_GATEWAY = env.ALIEXPRESS_API_GATEWAY || 'https://api-sg.aliexpress.com';
        const finalUrl = `${ALI_GATEWAY}/rest/auth/token/security/create`;
        
        console.log('5. Final Request URL:', finalUrl);
        console.log('6. Request Body:', finalBodyParams.toString());

        const res = await fetchWithTimeout(finalUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: finalBodyParams.toString()
        });

        const data = await res.text();
        console.log('7. Response:', data);

        return new Response(data, { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // 4. ALI DS API (Strict TOP Signed Proxy)
    if (pathname.includes("/ali-ds-proxy")) {
      try {
        const body = await request.json();
        const { path = "/sync", params } = body;
        const ALI_SECRET = env.ALI_APP_SECRET || 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3';
        const ALI_KEY = env.ALI_APP_KEY || '532310';
        const ALI_GATEWAY = env.ALIEXPRESS_API_GATEWAY || 'https://api-sg.aliexpress.com';
        
        // 🛡️ Standard TOP System Parameters
        const apiParams = {
          ...params,
          app_key: ALI_KEY,
          timestamp: getTopTimestamp(), // 🎯 Standard TOP Format
          sign_method: 'md5',
          format: 'json',
          v: '2.0'
        };

        // ⚔️ SECURITY: Scrub secrets from the transport body
        delete apiParams['client_secret'];
        delete apiParams['secret'];
        delete apiParams['client_id'];

        // Generate TOP Signature
        console.log('=== ALIEXPRESS API REQUEST START ===');
        const sign = await generateTopSignature(apiParams, ALI_SECRET);
        apiParams.sign = sign;

        const bodyString = new URLSearchParams(apiParams).toString();
        
        console.log('1. Method:', apiParams.method);
        console.log('2. Parameters:', { ...apiParams, app_key: 'PRESENT', session: apiParams.session ? 'PRESENT' : 'MISSING' });
        console.log('3. Signature:', sign);

        const res = await fetchWithTimeout(`${ALI_GATEWAY}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: bodyString
        });

        const data = await res.text();
        console.log('4. Response Status:', res.status);
        console.log('=== ALIEXPRESS API REQUEST END ===');

        return new Response(data, { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    return new Response("Crystal Bridge v34.21-TOP_HARDENED Live", { headers: corsHeaders });
  }
};
