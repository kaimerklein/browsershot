let sidebarWindowId = null;

// Open the persistent sidebar window when the extension icon is clicked.
chrome.action.onClicked.addListener(() => {
  if (sidebarWindowId) {
    chrome.windows.update(sidebarWindowId, { focused: true });
  } else {
    // Check if chrome.system.display is available
    if (
      chrome.system &&
      chrome.system.display &&
      chrome.system.display.getInfo
    ) {
      chrome.system.display.getInfo((displays) => {
        let primaryDisplay =
          displays.find((display) => display.isPrimary) || displays[0];
        let left =
          primaryDisplay.workArea.left + primaryDisplay.workArea.width - 400;
        let top = primaryDisplay.workArea.top;
        chrome.windows.create(
          {
            url: chrome.runtime.getURL("sidebar.html"),
            type: "popup",
            width: 400,
            height: 800,
            left: left,
            top: top,
          },
          (window) => {
            sidebarWindowId = window.id;
          }
        );
      });
    } else {
      // Fallback coordinates if chrome.system.display is not available.
      chrome.windows.create(
        {
          url: chrome.runtime.getURL("sidebar.html"),
          type: "popup",
          width: 400,
          height: 800,
          left: 100,
          top: 100,
        },
        (window) => {
          sidebarWindowId = window.id;
        }
      );
    }
  }
});

// Add a documentation entry to storage and notify the sidebar.
function addDocumentationEntry(entry) {
  chrome.storage.local.get("documentationHistory", (data) => {
    let history = data.documentationHistory || [];
    history.push(entry);
    chrome.storage.local.set({ documentationHistory: history }, () => {
      // Notify the sidebar of the updated history.
      chrome.runtime.sendMessage({
        type: "update_history",
        documentationHistory: history,
      });
    });
  });
}

// Listen for messages from the content script.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "capture_screenshot") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        console.error("Screenshot capture failed: ", chrome.runtime.lastError);
        sendResponse({ status: "error" });
        return;
      }
      // Create an entry with the screenshot and clicked element details.
      let entry = {
        screenshot: dataUrl,
        elementDetails: message.elementDetails,
        timestamp: Date.now(),
      };
      addDocumentationEntry(entry);
      sendResponse({ status: "done" });
    });
    return true; // Keep the messaging channel open for the asynchronous response.
  }
});
