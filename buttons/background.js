chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "capture_screenshot") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        console.error(
          "Screenshot capture failed:",
          chrome.runtime.lastError
            ? chrome.runtime.lastError.message
            : "No dataUrl returned"
        );
        sendResponse({
          status: "error",
          error: chrome.runtime.lastError
            ? chrome.runtime.lastError.message
            : "Unknown error",
        });
      } else {
        sendResponse({ status: "done", screenshot: dataUrl });
      }
    });
    return true; // Keep the messaging channel open for async response.
  }
});
