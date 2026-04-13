/**
 * Cloudflare Worker Proxy for eBay API v2.0
 * Optimized for CORS Transparency and Multi-API support (Trading + Browse)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 1. Handle CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-EBAY-C-MARKETPLACE-ID, X-EBAY-API-CALL-NAME, X-EBAY-API-SITEID, X-EBAY-API-COMPATIBILITY-LEVEL, X-EBAY-API-APP-NAME, X-EBAY-API-DEV-NAME, X-EBAY-API-CERT-NAME",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 2. Extract Identity & Target
    const targetUrl = url.searchParams.get("url");
    const auth = url.searchParams.get("auth") || "";
    const marketplaceid = url.searchParams.get("marketplaceid") || "EBAY_US";
    const callname = url.searchParams.get("callname") || "";
    const siteid = url.searchParams.get("siteid") || "0";

    if (!targetUrl) {
      return new Response("Missing target URL.", { status: 400 });
    }

    // 3. Prepare Mirror Headers
    const headers = new Headers(request.headers);
    
    // Identity Injection
    if (auth) {
      const finalAuth = (auth.startsWith("Bearer ") || auth.startsWith("Basic ")) ? auth : `Bearer ${auth}`;
      headers.set("Authorization", finalAuth);
      headers.set("X-EBAY-API-IAF-TOKEN", auth.replace(/^Bearer /i, ""));
    }
    
    if (marketplaceid) headers.set("X-EBAY-C-MARKETPLACE-ID", marketplaceid);
    if (callname) headers.set("X-EBAY-API-CALL-NAME", callname);
    if (siteid) headers.set("X-EBAY-API-SITEID", siteid);
    
    if (!headers.has("X-EBAY-API-COMPATIBILITY-LEVEL")) {
      headers.set("X-EBAY-API-COMPATIBILITY-LEVEL", "967");
    }

    try {
      // 4. Execute Mirror Fetch
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.method === "POST" ? await request.arrayBuffer() : null,
      });

      // 5. Finalize with CORS
      const finalResponse = new Response(response.body, response);
      finalResponse.headers.set("Access-Control-Allow-Origin", "*");
      finalResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      finalResponse.headers.set("Access-Control-Allow-Headers", "*"); // Allow all headers for simplicity
      
      return finalResponse;
    } catch (error) {
      return new Response(JSON.stringify({
        proxyError: error.message,
        target: targetUrl
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }
};
