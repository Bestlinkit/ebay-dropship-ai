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

const fetchWithTimeout = (url, options, timeout = 10000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), timeout))
  ]);

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
        const params = await request.json();
        const ALI_GATEWAY = env.ALIEXPRESS_API_GATEWAY || 'https://api-sg.aliexpress.com';
        const ALI_KEY = env.ALI_APP_KEY || '532310';
        const ALI_SECRET = env.ALI_APP_SECRET || 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3';

        const tokenUrl = `${ALI_GATEWAY}/oauth/token`;
        const bodyParams = {
            ...params,
            client_id: params.client_id || ALI_KEY,
            client_secret: params.client_secret || ALI_SECRET
        };

        const bodyString = new URLSearchParams(bodyParams).toString();
        
        console.log(`[AliExpress OAuth] Proxied POST to: ${tokenUrl}`);
        console.log(`[AliExpress OAuth] Body (sanitized): ${bodyString.replace(/client_secret=[^&]+/, "client_secret=***")}`);
        
        const res = await fetch(tokenUrl, {
          method: "POST",
          headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
          },
          body: bodyString
        });

        const data = await res.text();
        console.log(`[AliExpress OAuth] Response (${res.status}):`, data.substring(0, 1000));
        
        return new Response(data, { 
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      } catch (err) {
        console.error(`[AliExpress OAuth] Error:`, err.message);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response("Crystal Bridge v34.1 HMAC Live", { headers: corsHeaders });
  }
};
