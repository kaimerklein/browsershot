document.addEventListener("DOMContentLoaded", function () {
  const historyDiv = document.getElementById("history");
  const downloadBtn = document.getElementById("download-history");
  const deleteBtn = document.getElementById("delete-history");

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

  // Listen for storage changes to update history.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.documentationHistory) {
      renderHistory(changes.documentationHistory.newValue);
    }
  });

  // Download History button: create a JSON file and trigger download.
  downloadBtn.addEventListener("click", () => {
    chrome.storage.local.get("documentationHistory", (data) => {
      const history = data.documentationHistory || [];
      const jsonStr = JSON.stringify(history, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "documentation_history.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Delete History button: confirm and clear history.
  deleteBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete the capture history?")) {
      chrome.storage.local.remove("documentationHistory", () => {
        renderHistory([]);
      });
    }
  });
});
