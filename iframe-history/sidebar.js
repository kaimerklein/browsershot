document.addEventListener("DOMContentLoaded", function () {
  const captureBtn = document.getElementById("captureBtn");
  const historyDiv = document.getElementById("history");

  // Render the documentation history.
  function renderHistory(history) {
    historyDiv.innerHTML = "";
    history.forEach((entry) => {
      const entryDiv = document.createElement("div");
      entryDiv.className = "entry";

      const img = document.createElement("img");
      img.src = entry.screenshot;

      const timeStamp = document.createElement("div");
      timeStamp.textContent = new Date(entry.timestamp).toLocaleString();

      const domPre = document.createElement("pre");
      domPre.textContent = JSON.stringify(entry.minimizedDOM, null, 2);

      entryDiv.appendChild(img);
      entryDiv.appendChild(timeStamp);
      entryDiv.appendChild(domPre);
      historyDiv.appendChild(entryDiv);
    });
  }

  // Load history on startup.
  chrome.storage.local.get("documentationHistory", (data) => {
    if (data.documentationHistory) {
      renderHistory(data.documentationHistory);
    }
  });

  // Listen for changes to the documentation history.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.documentationHistory) {
      renderHistory(changes.documentationHistory.newValue);
    }
  });

  // Capture button click event.
  captureBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      const activeTabId = tabs[0].id;
      // Hide the sidebar in the active tab before capturing.
      chrome.tabs.sendMessage(
        activeTabId,
        { type: "hide_sidebar" },
        (hideResponse) => {
          // Wait briefly to ensure the sidebar is hidden.
          setTimeout(() => {
            // Request the screenshot from the background.
            chrome.runtime.sendMessage(
              { type: "capture_screenshot" },
              (screenshotResponse) => {
                if (
                  screenshotResponse &&
                  screenshotResponse.status === "done"
                ) {
                  const screenshotData = screenshotResponse.screenshot;
                  // Show the sidebar back.
                  chrome.tabs.sendMessage(
                    activeTabId,
                    { type: "show_sidebar" },
                    (showResponse) => {
                      // Request the minimized DOM from the content script.
                      chrome.tabs.sendMessage(
                        activeTabId,
                        { type: "get_minimized_dom" },
                        (domResponse) => {
                          const minimizedDOM = domResponse
                            ? domResponse.dom
                            : [];
                          const newEntry = {
                            screenshot: screenshotData,
                            minimizedDOM: minimizedDOM,
                            timestamp: Date.now(),
                          };
                          // Append the new entry to the existing history.
                          chrome.storage.local.get(
                            "documentationHistory",
                            (data) => {
                              let history = data.documentationHistory || [];
                              history.push(newEntry);
                              chrome.storage.local.set({
                                documentationHistory: history,
                              });
                            }
                          );
                        }
                      );
                    }
                  );
                } else {
                  console.error(
                    "Screenshot capture failed:",
                    screenshotResponse
                      ? screenshotResponse.error
                      : "No response"
                  );
                  // Ensure the sidebar is shown back even if the capture fails.
                  chrome.tabs.sendMessage(activeTabId, {
                    type: "show_sidebar",
                  });
                }
              }
            );
          }, 100); // 100ms delay to let the UI update.
        }
      );
    });
  });

  // Optional: set up a hotkey (Ctrl+Shift+S) for capture.
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyS") {
      captureBtn.click();
    }
  });
});
