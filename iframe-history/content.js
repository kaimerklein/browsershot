(function () {
  // Only inject once per page.
  if (document.getElementById("documentation-sidebar-container")) return;

  // Create the container for the sidebar.
  const container = document.createElement("div");
  container.id = "documentation-sidebar-container";
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.right = "0";
  container.style.width = "350px";
  container.style.height = "100%";
  container.style.backgroundColor = "#fff";
  container.style.borderLeft = "1px solid #ccc";
  container.style.zIndex = "999999";
  container.style.boxShadow = "-2px 0 5px rgba(0,0,0,0.2)";

  // Create an iframe to load the sidebar UI.
  const iframe = document.createElement("iframe");
  iframe.src = chrome.runtime.getURL("sidebar.html");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";

  container.appendChild(iframe);
  document.body.appendChild(container);

  // Adjust the page so content is not covered.
  document.body.style.marginRight = "350px";

  // Listen for messages (for minimized DOM, hide and show sidebar).
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "get_minimized_dom") {
      sendResponse({ dom: getMinimizedDOM() });
    } else if (message.type === "hide_sidebar") {
      container.style.display = "none";
      sendResponse({ status: "hidden" });
    } else if (message.type === "show_sidebar") {
      container.style.display = "";
      sendResponse({ status: "shown" });
    }
  });

  // Function to "minimize" the DOM by extracting basic field info.
  function getMinimizedDOM() {
    const results = [];
    const fields = document.querySelectorAll("input, textarea, select");
    fields.forEach((field) => {
      let label = "";
      if (field.id) {
        const lab = document.querySelector(`label[for='${field.id}']`);
        if (lab) {
          label = lab.innerText.trim();
        }
      }
      if (!label) {
        const parentLabel = field.closest("label");
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
