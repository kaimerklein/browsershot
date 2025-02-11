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

      // Add interactions section if it exists and has interactions
      if (entry.interactions && entry.interactions.interactions && entry.interactions.interactions.length > 0) {
        const interactionsDiv = document.createElement("div");
        interactionsDiv.className = "interactions";
        
        const interactionsTitle = document.createElement("h3");
        interactionsTitle.textContent = "User Interactions";
        interactionsDiv.appendChild(interactionsTitle);

        const interactionsList = document.createElement("ul");
        entry.interactions.interactions.forEach(interaction => {
          const li = document.createElement("li");
          const time = new Date(interaction.timestamp).toLocaleTimeString();
          let text = `${time} - ${interaction.type} on ${interaction.elementPath}`;
          
          // Add value change details if they exist
          if (interaction.details && interaction.details.newValue !== undefined) {
            text += ` (value changed to: ${interaction.details.newValue})`;
          }
          
          li.textContent = text;
          interactionsList.appendChild(li);
        });
        interactionsDiv.appendChild(interactionsList);
        
        // Add duration if start and end times exist
        if (entry.interactions.startTime && entry.interactions.endTime) {
          const duration = document.createElement("div");
          const durationSeconds = ((entry.interactions.endTime - entry.interactions.startTime) / 1000).toFixed(1);
          duration.textContent = `Duration: ${durationSeconds}s`;
          interactionsDiv.appendChild(duration);
        }

        entryDiv.appendChild(interactionsDiv);
      }

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
