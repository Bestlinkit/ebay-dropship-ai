/**
 * Unified Crystal Bridge (v31.3-COMPACT)
 * Compact version to prevent truncation errors.
 * USES WEB CRYPTO API FOR MD5.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

// 🛡️ NATIVE ASYNC MD5 (Prevents 150 lines of legacy code)
async function md5(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('MD5', msgUint8);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

const fetchWithTimeout = (url, options, timeout = 8000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), timeout))
  ]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    // 1. EBAY GATEWAY (Priority)
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

    // 2. ALI SEARCH (Hardened Scraper)
    if (pathname === "/aliexpress-search") {
      try {
        const query = url.searchParams.get("q");
        const res = await fetchWithTimeout(`https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" }
        });
        const html = await res.text();
        if (html.includes('firewall')) return new Response("THROTTLED", { status: 429, headers: corsHeaders });
        return new Response(html, { headers: { ...corsHeaders, "Content-Type": "text/html" } });
      } catch (err) { return new Response(err.message, { status: 500, headers: corsHeaders }); }
    }

    // 3. ALI DS API (Official)
    if (pathname === "/api/ali-ds-proxy") {
      try {
        const params = await request.json();
        const ALI_SECRET = env.ALI_APP_SECRET || 'oz81TWcu6CSR7ZjqoN0rwqUuWCSbY6o3';
        
        let signStr = ALI_SECRET;
        Object.keys(params).sort().forEach(k => { signStr += k + params[k]; });
        signStr += ALI_SECRET;

        const sign = await md5(signStr);
        const searchParams = new URLSearchParams({ ...params, sign });
        
        const res = await fetchWithTimeout('https://eco.taobao.com/router/rest', {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: searchParams.toString()
        });
        return new Response(await res.text(), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (err) { return new Response(err.message, { status: 500, headers: corsHeaders }); }
    }

    return new Response("Crystal Bridge v31.3 Live", { headers: corsHeaders });
  }
};
