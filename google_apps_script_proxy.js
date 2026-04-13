/**
 * Google Apps Script Proxy for eBay API v2.0
 * Supports GET/POST, Header Mirroring, and Payload Relaying.
 * Deploy as Web App -> Access: Anyone
 */

function doGet(e) {
  return handleRequest(e, "GET");
}

function doPost(e) {
  return handleRequest(e, "POST");
}

function handleRequest(e, method) {
  const params = e.parameter;
  const targetUrl = params.url;
  const auth = params.auth || "";
  const marketplaceid = params.marketplaceid || "EBAY_US";
  const callname = params.callname || "";
  const siteid = params.siteid || "0";

  if (!targetUrl) {
    return ContentService.createTextOutput("Missing target URL.").setMimeType(ContentService.MimeType.TEXT);
  }

  // 1. Prepare Headers
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-EBAY-API-COMPATIBILITY-LEVEL": "967"
  };

  if (auth) {
    const finalAuth = (auth.startsWith("Bearer ") || auth.startsWith("Basic ")) ? auth : "Bearer " + auth;
    headers["Authorization"] = finalAuth;
    headers["X-EBAY-API-IAF-TOKEN"] = auth.replace(/^Bearer /i, "");
  }

  if (marketplaceid) {
    headers["X-EBAY-C-MARKETPLACE-ID"] = marketplaceid;
  }

  if (callname) {
    headers["X-EBAY-API-CALL-NAME"] = callname;
  }

  if (siteid) {
    headers["X-EBAY-API-SITEID"] = siteid;
  }

  // 2. Prepare Fetch Options
  const options = {
    "method": method.toLowerCase(),
    "headers": headers,
    "muteHttpExceptions": true,
    "followRedirects": true
  };

  // 3. Handle POST body
  if (method === "POST") {
    // If it's a JSON string or form data, pass it through
    if (e.postData && e.postData.contents) {
      options["payload"] = e.postData.contents;
      // Mirror the content type if possible, or default to JSON
      if (e.postData.type) {
        headers["Content-Type"] = e.postData.type;
      }
    }
  }

  // 4. Execute Fetch
  try {
    const response = UrlFetchApp.fetch(targetUrl, options);
    const content = response.getContentText();
    const code = response.getResponseCode();

    // Google Script doesn't return the raw status code to the client easily via Web App
    // so we wrap the response if it's an error to help debugging
    if (code >= 400) {
      return ContentService.createTextOutput(JSON.stringify({
        proxyStatus: code,
        ebayResponse: content
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(content)
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      proxyError: error.toString(),
      target: targetUrl
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
