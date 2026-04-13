/**
 * eBay Proxy Identity Bridge v1.0
 * Optimized for transparent marketplace relaying.
 */
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // 1. Deep-Encoded Target Extraction
  const targetUrl = url.searchParams.get("url");
  const auth = url.searchParams.get("auth") || "";
  const marketplaceid = url.searchParams.get("marketplaceid") || "EBAY_US";
  const callname = url.searchParams.get("callname") || "";
  const siteid = url.searchParams.get("siteid") || "0";

  if (!targetUrl) {
    return new Response("Missing target URL.", { status: 400 });
  }

  // 2. Clone and Sanitize Headers
  const headers = new Headers(request.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  
  // Inject Identity Parameters
  if (auth) {
    const finalAuth = (auth.startsWith("Bearer ") || auth.startsWith("Basic ")) ? auth : `Bearer ${auth}`;
    headers.set("Authorization", finalAuth);
    headers.set("X-EBAY-API-IAF-TOKEN", auth.replace(/^Bearer /i, "")); // For Legacy Trading API
  }
  
  if (marketplaceid) {
    headers.set("X-EBAY-C-MARKETPLACE-ID", marketplaceid);
  }

  if (callname) {
    headers.set("X-EBAY-API-CALL-NAME", callname);
  }

  if (siteid) {
    headers.set("X-EBAY-API-SITEID", siteid);
  }

  // Set Production API Context if missing
  if (!headers.has("X-EBAY-API-COMPATIBILITY-LEVEL")) {
    headers.set("X-EBAY-API-COMPATIBILITY-LEVEL", "967");
  }

  try {
    // 3. Transparent Fetch (Mirror Method and Body)
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method === "POST" ? await request.arrayBuffer() : null,
    });

    // 4. Return Mirror Response with CORS enabled
    const finalResponse = new Response(response.body, response);
    finalResponse.headers.set("Access-Control-Allow-Origin", "*");
    finalResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    finalResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-EBAY-C-MARKETPLACE-ID");

    return finalResponse;
  } catch (error) {
    return new Response(`Identity Bridge Error: ${error.message}`, { status: 500 });
  }
}
