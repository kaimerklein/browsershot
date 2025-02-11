// sidebar.js

function renderHistory(documentationHistory) {
  const historyDiv = document.getElementById("history");
  historyDiv.innerHTML = ""; // Clear previous entries.

  documentationHistory.forEach((entry) => {
    const entryDiv = document.createElement("div");
    entryDiv.className = "entry";

    // Create and append the screenshot thumbnail.
    const screenshotImg = document.createElement("img");
    screenshotImg.src = entry.screenshot;

    // Create and append the timestamp.
    const timeStamp = document.createElement("div");
    timeStamp.textContent = new Date(entry.timestamp).toLocaleString();

    // Create and append the element details.
    const elementInfo = document.createElement("pre");
    elementInfo.textContent = `Clicked Element:
Tag: ${entry.elementDetails.tag}
ID: ${entry.elementDetails.id}
Class: ${entry.elementDetails.class}
Text: "${entry.elementDetails.text}"
Coordinates (viewport): (${entry.elementDetails.x}, ${entry.elementDetails.y})
Coordinates (page): (${entry.elementDetails.pageX}, ${entry.elementDetails.pageY})`;

    entryDiv.appendChild(screenshotImg);
    entryDiv.appendChild(timeStamp);
    entryDiv.appendChild(elementInfo);
    historyDiv.appendChild(entryDiv);
  });
}

// Listen for update messages from the background.
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "update_history") {
    renderHistory(message.documentationHistory);
  }
});

// On load, fetch the existing documentation history.
chrome.storage.local.get("documentationHistory", (data) => {
  if (data.documentationHistory) {
    renderHistory(data.documentationHistory);
  }
});
