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

const fetchWithTimeout = (url, options, timeout = 15000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error("GATEWAY_TIMEOUT")), timeout))
  ]);

/**
 * 🛰️ TOP SIGNATURE GENERATOR (MD5 Wrapping)
 * Algorithm: MD5(secret + sorted_params + secret)
 * Variation 1: Exclude secret from inside the params list
 */
async function generateTopSignature(params, appSecret) {
    const paramsCopy = { ...params };
    // Step 1: Remove 'sign' and secret-related parameters from the signing string
    delete paramsCopy['sign'];
    delete paramsCopy['client_secret'];
    delete paramsCopy['secret'];
    
    // Step 2: Sort parameters alphabetically by key
    const sortedKeys = Object.keys(paramsCopy).sort();
    
    console.log('=== SIGNATURE GENERATION DEBUG ===');
    console.log('1. App Secret:', appSecret ? 'PRESENT' : 'MISSING');
    console.log('2. Sorted Keys:', sortedKeys);
    
    // Step 3: Build string as: key1value1key2value2...
    let signString = '';
    console.log('3. Parameter Audit:');
    for (const key of sortedKeys) {
        if (paramsCopy[key] !== undefined && paramsCopy[key] !== null) {
            signString += key + paramsCopy[key];
            console.log(`   ${key} = ${paramsCopy[key]}`);
        }
    }
    
    console.log('4. Concatenated String (no secret):', signString);
    
    // Step 4: Wrap with app_secret at BOTH ends
    const stringToSign = appSecret + signString + appSecret;
    console.log('5. String to Sign (with secret wrapper):', stringToSign);
    console.log('6. String to Sign Length:', stringToSign.length);
    
    const signature = await md5Hash(stringToSign);
    
    console.log('7. Generated Signature:', signature);
    console.log('8. Signature Length:', signature.length);
    console.log('=== END SIGNATURE DEBUG ===');
    
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

          // 🛡️ Variation 1 (MINIMAL): Only include core parameters in signature
          // As requested: Exclude client_id/app_key from hashing
          const paramsForSigning = {
              code: params.code,
              grant_type: 'authorization_code',
              redirect_uri: 'https://geonoyc-dropshipping.web.app/callback',
              timestamp: timestamp
          };

          // Generate Signature
          const sign = await generateTopSignature(paramsForSigning, ALI_SECRET);
          
          // Add secrets and signature back for the final request body
          const finalParams = { 
            ...paramsForSigning, 
            client_id: ALI_KEY,
            client_secret: ALI_SECRET,
            sign 
          };

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

    return new Response("Crystal Bridge v34.8-STABLE Live", { headers: corsHeaders });
  }
};
