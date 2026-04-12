function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const url = e.parameter.url;
  if (!url) return ContentService.createTextOutput("Error: No URL").setMimeType(ContentService.MimeType.TEXT);

  const options = {
    method: e.postData ? "post" : "get",
    muteHttpExceptions: true,
    headers: {
      "Authorization": e.parameter.auth || "",
      "X-EBAY-API-IAF-TOKEN": e.parameter.iaftoken || "",
      "X-EBAY-API-SITEID": e.parameter.siteid || "0",
      "X-EBAY-API-CALL-NAME": e.parameter.callname || "",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "967",
      "Content-Type": "application/json"
    }
  };

  if (e.postData) {
    options.payload = e.postData.contents;
    options.headers["Content-Type"] = e.postData.type || "application/json";
  }

  try {
    const response = UrlFetchApp.fetch(url, options);
    return ContentService.createTextOutput(response.getContentText())
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
