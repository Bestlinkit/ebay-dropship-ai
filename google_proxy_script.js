/**
 * Crystal Pulse: Production Identity Bridge (V2.0)
 * Optimized for eBay REST (Browse) and Trading XML APIs.
 */
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const url = e.parameter.url;
  if (!url) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Missing Target URL" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Universal Authentication & Context Extraction
  const authToken = e.parameter.auth || "";
  const callName = e.parameter.callname || "";
  const siteId = e.parameter.siteid || "0";
  const marketplaceId = e.parameter.marketplaceid || "EBAY_US";

  // Unified Header Payload
  const headers = {
    // REST API Headers
    "Authorization": authToken,
    "X-EBAY-C-MARKETPLACE-ID": marketplaceId,
    
    // Trading API (Soap/XML) Headers
    "X-EBAY-API-IAF-TOKEN": authToken,
    "X-EBAY-API-SITEID": siteId,
    "X-EBAY-API-CALL-NAME": callName,
    "X-EBAY-API-COMPATIBILITY-LEVEL": "1001", // Production stable
    
    // Content Context
    "Content-Type": e.postData ? (e.postData.type || "application/json") : "application/json",
    "Accept": "application/json"
  };

  const options = {
    method: e.postData ? "post" : "get",
    muteHttpExceptions: true,
    headers: headers
  };

  if (e.postData) {
    options.payload = e.postData.contents;
  }

  try {
    const response = UrlFetchApp.fetch(url, options);
    const resultText = response.getContentText();
    
    return ContentService.createTextOutput(resultText)
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: "Bridge Failure", 
      details: err.toString(),
      target: url 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
