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

// 🛡️ NATIVE HMAC-SHA256 (Required for v2.0 Protocol)
async function hmacSha256(key, message) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', 
    keyData, 
    { name: 'HMAC', hash: 'SHA-256' }, 
    false, 
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

const fetchWithTimeout = (url, options, timeout = 15000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error("GATEWAY_TIMEOUT")), timeout))
  ]);

/**
 * 🛰️ TOP SIGNATURE GENERATOR (AliExpress v2.0 Requirements)
 * Algorithm: HMAC-SHA256(secret, secret + sorted_params + secret)
 */
async function generateTopSignature(params, appSecret) {
    const sortedKeys = Object.keys(params).sort();
    console.log('[AliExpress OAuth] Sorted Keys for Signature:', sortedKeys);
    
    let signString = '';
    for (const key of sortedKeys) {
        if (key !== 'sign' && params[key] !== undefined && params[key] !== null) {
            signString += key + params[key];
        }
    }
    
    // Pattern: secret + sorted_params + secret
    const finalSignString = appSecret + signString + appSecret;
    console.log('[AliExpress OAuth] Signature String (pre-hash):', finalSignString);
    
    const signature = await hmacSha256(appSecret, finalSignString);
    console.log('[AliExpress OAuth] Resulting Signature:', signature);
    return signature;
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

    // 3. ALI DS API v2.0 (OFFICIAL SYNC GATEWAY)
    if (pathname.includes("/ali-ds-proxy")) {
      try {
        const body = await request.json();
        const { path = "/sync", params } = body;
        const ALI_SECRET = env.ALI_APP_SECRET || 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3';
        const ALI_GATEWAY = env.ALIEXPRESS_API_GATEWAY || 'https://api-sg.aliexpress.com';
        
        // v2.0 Protocol: HMAC-SHA256 with PATH prefix
        let signBase = path; 
        Object.keys(params).sort().forEach(k => {
            if (params[k] !== undefined && params[k] !== null) {
                signBase += k + params[k];
            }
        });

        const sign = await hmacSha256(ALI_SECRET, signBase);
        const searchParams = new URLSearchParams({ ...params, sign });
        
        const finalUrl = `${ALI_GATEWAY}${path}`;
        
        const res = await fetchWithTimeout(finalUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: searchParams.toString()
        });

        const data = await res.text();
        return new Response(data, {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message, context: "AliExpress Proxy Failure" }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    // 4. ALIEXPRESS OAUTH HANDLERS
    if (pathname === "/oauth/token" || pathname === "/oauth/token-refresh") {
      try {
        console.log('=== TOKEN EXCHANGE DEBUG START ===');
        console.log(`[AliExpress OAuth] INCOMING | Method: ${request.method} | Path: ${pathname}`);
        
        const params = await request.json();
        const ALI_GATEWAY = env.ALIEXPRESS_API_GATEWAY || 'https://api-sg.aliexpress.com';
        const ALI_KEY = env.ALI_APP_KEY || '532310';
        const ALI_SECRET = env.ALI_APP_SECRET || 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3';

        // Helper for Token Exchange (Signed)
        const performExchange = async (endpointPath) => {
          const tokenUrl = `${ALI_GATEWAY}${endpointPath}`;
          
          // Timestamp in milliseconds (Required for Singapore Gateway)
          const timestamp = Date.now().toString();

          // DUAL-NAMING STRATEGY: Include both app_key/client_id for max compatibility
          const baseParams = {
              ...params,
              client_id: params.client_id || ALI_KEY,
              client_secret: params.client_secret || ALI_SECRET,
              app_key: params.client_id || ALI_KEY,
              secret: params.client_secret || ALI_SECRET,
              timestamp: timestamp,
              sign_method: 'sha256'
          };

          // Generate Signature
          const sign = await generateTopSignature(baseParams, ALI_SECRET);
          const finalParams = { ...baseParams, sign };

          const bodyString = new URLSearchParams(finalParams).toString();
          
          console.log(`[AliExpress OAuth] Request URL: ${tokenUrl}`);
          console.log(`[AliExpress OAuth] Timestamp Audit:`, {
            value: finalParams.timestamp,
            isNumeric: /^\d+$/.test(finalParams.timestamp),
            length: finalParams.timestamp.length
          });
          console.log(`[AliExpress OAuth] Parameters (sanitized):`, {
            ...finalParams,
            client_secret: '***',
            secret: '***'
          });

          return await fetch(tokenUrl, {
            method: "POST",
            headers: { 
              "Content-Type": "application/x-www-form-urlencoded",
              "Accept": "application/json",
              "User-Agent": "Mozilla/5.0 (Bridge/v34.7)"
            },
            body: bodyString
          });
        };

        // Try primary endpoint (/oauth/token)
        let res = await performExchange('/oauth/token');
        let dataStr = await res.text();

        // FALLBACK: If 405 Method Not Allowed, try the alternative REST endpoint
        if (res.status === 405) {
          console.warn(`[AliExpress OAuth] Primary endpoint blocked (405). Attempting REST fallback...`);
          res = await performExchange('/rest/auth/token/security/create');
          dataStr = await res.text();
        }

        console.log('=== ALIEXPRESS RESPONSE START ===');
        console.log(`[AliExpress OAuth] Status: ${res.status} ${res.statusText}`);
        console.log(`[AliExpress OAuth] Headers:`, Object.fromEntries(res.headers.entries()));
        console.log(`[AliExpress OAuth] Raw Body:`, dataStr);

        // Try to parse TOP error response structure
        try {
          const data = JSON.parse(dataStr);
          if (data.error_response) {
            console.log('--- DETAILED TOP ERROR ---');
            console.log(`Code: ${data.error_response.code}`);
            console.log(`Msg: ${data.error_response.msg}`);
            console.log(`Sub-Code: ${data.error_response.sub_code}`);
            console.log(`Sub-Msg: ${data.error_response.sub_msg}`);
          }
        } catch (e) {}

        console.log('=== ALIEXPRESS RESPONSE END ===');
        console.log('=== TOKEN EXCHANGE DEBUG END ===');
        
        return new Response(dataStr, { 
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      } catch (err) {
        console.error(`[AliExpress OAuth] Global Exception:`, err.message);
        return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500, headers: corsHeaders });
      }
    }

        console.log(`[AliExpress OAuth] Response (${res.status}):`, data.substring(0, 1000));
        
        return new Response(data, { 
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      } catch (err) {
        console.error(`[AliExpress OAuth] Exception:`, err.message);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response("Crystal Bridge v34.1 HMAC Live", { headers: corsHeaders });
  }
};
