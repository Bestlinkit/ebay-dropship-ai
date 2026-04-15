/**
 * Universal Crystal Bridge (v2.0)
 * Optimized for Eprolo Open API and AliExpress Scraping
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    };

    // 1. Handle Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. ROUTE: /eprolo-search
    if (url.pathname === "/eprolo-search") {
      try {
        const body = await request.json();
        const timestamp = Date.now();
        const rawSign = (env.EPROLO_APP_KEY || '') + timestamp + (env.EPROLO_SECRET || '');

        // Generate SHA-256 Signature (as per Production Patch)
        const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawSign));
        const sign = [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, "0")).join("");

        const eproloUrl = env.EPROLO_BASE_URL || "https://openapi.eprolo.com/eprolo_product_list.html";
        
        // Fetch from Eprolo
        const response = await fetch(`${eproloUrl}?apiKey=${env.EPROLO_APP_KEY}&sign=${sign}&timestamp=${timestamp}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        const data = await response.text();
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

    // 3. ROUTE: /aliexpress-search
    if (url.pathname === "/aliexpress-search") {
      try {
        const query = url.searchParams.get("q");
        if (!query) throw new Error("Missing query");

        const target = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`;
        const response = await fetch(target, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
          }
        });

        const html = await response.text();
        return new Response(html, {
          headers: { ...corsHeaders, "Content-Type": "text/html" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    // 4. FALLBACK: Generic Proxy (for eBay and others)
    const targetUrl = url.searchParams.get("url");
    if (targetUrl) {
      try {
        const headers = new Headers(request.headers);
        // Clean up headers for the target
        headers.delete("Host");
        
        const response = await fetch(targetUrl, {
          method: request.method,
          headers: headers,
          body: request.method !== "GET" ? request.body : undefined
        });

        return new Response(response.body, {
          status: response.status,
          headers: { ...corsHeaders, ...Object.fromEntries(response.headers) }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    return new Response("Crystal Bridge: Invalid Route", { status: 404 });
  }
};
