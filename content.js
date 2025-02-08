(function () {
  // Only inject once per page.
  if (document.getElementById("documentation-sidebar-container")) return;

  // Create a container div for the sidebar.
  let container = document.createElement("div");
  container.id = "documentation-sidebar-container";
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.right = "0";
  container.style.width = "350px";
  container.style.height = "100%";
  container.style.backgroundColor = "#f9f9f9";
  container.style.borderLeft = "1px solid #ccc";
  container.style.zIndex = "999999";
  container.style.boxShadow = "-2px 0 5px rgba(0,0,0,0.2)";

  // Create an iframe that loads sidebar.html from the extension.
  let iframe = document.createElement("iframe");
  iframe.src = chrome.runtime.getURL("sidebar.html");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";

  container.appendChild(iframe);
  document.body.appendChild(container);

  // Adjust the page's layout so that the sidebar doesn't cover content.
  // Add a right margin to the body equal to the sidebar's width.
  document.body.style.marginRight = "350px";

  // Listen for messages requesting the minimized DOM.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "get_minimized_dom") {
      sendResponse({ dom: getMinimizedDOM() });
    }
  });

  // Function to “minimize” the DOM:
  // For demonstration, we extract common form fields and try to get associated labels.
  function getMinimizedDOM() {
    let results = [];
    let fields = document.querySelectorAll("input, textarea, select");
    fields.forEach((field) => {
      let label = "";
      if (field.id) {
        let lab = document.querySelector("label[for='" + field.id + "']");
        if (lab) {
          label = lab.innerText.trim();
        }
      }
      if (!label) {
        let parentLabel = field.closest("label");
        if (parentLabel) {
          label = parentLabel.innerText.trim();
        }
      }
      results.push({
        field: label || field.name || field.placeholder || "Unknown",
        value: field.value || "",
      });
    });
    return results;
  }
})();
