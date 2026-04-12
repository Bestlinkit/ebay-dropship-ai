function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e.parameter;
  const targetUrl = params.url;
  
  if (!targetUrl) {
    return ContentService.createTextOutput("Error: No URL provided").setMimeType(ContentService.MimeType.TEXT);
  }

  // Forward all headers from the incoming request (except restricted ones)
  const headers = {};
  const restrictedHeaders = ['host', 'content-length', 'connection', 'accept-encoding'];
  
  // Note: Apps Script doesn't automatically pass headers to doGet/doPost in a simple way.
  // We'll rely on the client passing headers in the body or specific params if needed,
  // but for a simple proxy, we can try to use what's available.
  
  const options = {
    method: e.postData ? "post" : "get",
    headers: {
      "Authorization": e.parameter.auth || "",
      "X-EBAY-API-SITEID": e.parameter.siteid || "0",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "967",
      "X-EBAY-API-CALL-NAME": e.parameter.callname || "",
      "X-EBAY-API-IAF-TOKEN": e.parameter.iaftoken || "",
      "Content-Type": e.postData ? e.postData.type : "application/json"
    },
    payload: e.postData ? e.postData.contents : null,
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(targetUrl, options);
    const content = response.getContentText();
    return ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput("Proxy Error: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}
