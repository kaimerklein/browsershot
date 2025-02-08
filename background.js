chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "capture_screenshot") {
    // Capture the visible tab as a PNG data URL.
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      sendResponse({ screenshot: dataUrl });
    });
    // Indicate that we wish to send a response asynchronously.
    return true;
  }
});
