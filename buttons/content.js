(function () {
  // Ensure this script runs only once per page.
  if (document.getElementById("overlay-container")) return;

  /* === Create Overlay Buttons Container === */
  const overlayContainer = document.createElement("div");
  overlayContainer.id = "overlay-container";
  overlayContainer.style.position = "fixed";
  overlayContainer.style.top = "10px";
  overlayContainer.style.right = "10px";
  overlayContainer.style.display = "flex";
  overlayContainer.style.gap = "10px";
  overlayContainer.style.zIndex = "10000";
  overlayContainer.style.transition = "opacity 0.5s";

  // Button common style.
  const buttonStyle =
    "width: 50px; height: 50px; background-color: pink; border: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;";

  // Screenshot button (left): dark purple camera icon.
  const screenshotButton = document.createElement("button");
  screenshotButton.id = "screenshot-button";
  screenshotButton.style.cssText = buttonStyle;
  screenshotButton.title = "Take Screenshot";
  // Camera icon (using emoji with dark purple color)
  screenshotButton.innerHTML =
    '<span style="font-size:24px; color: #4B0082;">📷</span>';

  // Sidebar toggle button (right): side panel icon.
  const sidebarButton = document.createElement("button");
  sidebarButton.id = "sidebar-button";
  sidebarButton.style.cssText = buttonStyle;
  sidebarButton.title = "Toggle Sidebar";
  sidebarButton.innerHTML =
    '<span style="font-size:24px; color: #4B0082;">☰</span>';

  overlayContainer.appendChild(screenshotButton);
  overlayContainer.appendChild(sidebarButton);
  document.body.appendChild(overlayContainer);

  /* === Create Toast Message Element === */
  const toast = document.createElement("div");
  toast.id = "toast-message";
  toast.style.position = "fixed";
  toast.style.top = "70px";
  toast.style.right = "10px";
  toast.style.padding = "10px 20px";
  toast.style.backgroundColor = "rgba(255,255,255,0.9)";
  toast.style.borderRadius = "5px";
  toast.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
  toast.style.zIndex = "10000";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.5s";
  document.body.appendChild(toast);

  /* === Create Sidebar Container (hidden by default) === */
  const sidebarContainer = document.createElement("div");
  sidebarContainer.id = "sidebar-container";
  sidebarContainer.style.position = "fixed";
  sidebarContainer.style.top = "0";
  sidebarContainer.style.right = "0";
  sidebarContainer.style.width = "350px";
  sidebarContainer.style.height = "100%";
  sidebarContainer.style.backgroundColor = "#fff";
  sidebarContainer.style.borderLeft = "1px solid #ccc";
  sidebarContainer.style.zIndex = "9999";
  sidebarContainer.style.boxShadow = "-2px 0 5px rgba(0,0,0,0.2)";
  sidebarContainer.style.display = "none";

  const sidebarIframe = document.createElement("iframe");
  sidebarIframe.src = chrome.runtime.getURL("sidebar.html");
  sidebarIframe.style.width = "100%";
  sidebarIframe.style.height = "100%";
  sidebarIframe.style.border = "none";
  sidebarContainer.appendChild(sidebarIframe);
  document.body.appendChild(sidebarContainer);

  /* === Helper Functions === */
  // Show toast message.
  function showToast(message, isSuccess) {
    toast.textContent = message;
    toast.style.color = isSuccess ? "green" : "red";
    toast.style.opacity = "1";
    const duration = isSuccess ? 2000 : 7000;
    setTimeout(() => {
      toast.style.opacity = "0";
    }, duration);
  }

  // Set overlay visibility.
  function setOverlayVisibility(visible) {
    overlayContainer.style.opacity = visible ? "1" : "0";
    overlayContainer.style.pointerEvents = visible ? "auto" : "none";
  }

  // Hide UI elements before screenshot
  function hideUIElements() {
    overlayContainer.remove();
    if (sidebarContainer.style.display !== "none") {
      sidebarContainer.dataset.wasVisible = "true";
      sidebarContainer.style.display = "none";
    }
  }

  // Restore UI elements after screenshot
  function restoreUIElements() {
    document.body.appendChild(overlayContainer);
    setOverlayVisibility(true);
    if (sidebarContainer.dataset.wasVisible === "true") {
      sidebarContainer.style.display = "block";
      delete sidebarContainer.dataset.wasVisible;
    }
  }

  // Get minimized DOM snapshot (extract basic field info).
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

  /* === Interaction Recording === */
  function createInteractionRecorder() {
    let interactions = [];
    let startTime = Date.now();

    // Helper to get a unique selector for an element
    function getElementPath(element) {
      if (!element) return '';
      if (element.id) return `#${element.id}`;
      
      let path = [];
      while (element) {
        let selector = element.tagName.toLowerCase();
        if (element.className) {
          selector += `.${element.className.split(' ').join('.')}`;
        }
        let siblings = element.parentNode ? Array.from(element.parentNode.children) : [];
        if (siblings.length > 1) {
          let index = siblings.indexOf(element) + 1;
          selector += `:nth-child(${index})`;
        }
        path.unshift(selector);
        element = element.parentNode;
        if (element && element.tagName === 'BODY') break;
      }
      return path.join(' > ');
    }

    // Record an interaction
    function recordInteraction(type, element, details = {}) {
      const interaction = {
        timestamp: Date.now(),
        type: type,
        elementPath: getElementPath(element),
        tagName: element.tagName,
        value: element.value,
        details: details
      };
      interactions.push(interaction);
    }

    // Wrap event handlers to record interactions
    function wrapEventHandler(element, eventName, originalHandler) {
      return function(event) {
        recordInteraction(eventName, element, {
          x: event.clientX,
          y: event.clientY
        });
        return originalHandler.apply(this, arguments);
      };
    }

    // Initialize recording for an element
    function initializeElementRecording(element) {
      // Skip our own UI elements
      if (element.closest('#overlay-container, #sidebar-container, #toast-message')) {
        return;
      }

      // Record input changes
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        element.addEventListener('change', (e) => {
          recordInteraction('value-change', element, {
            oldValue: element.defaultValue,
            newValue: element.value
          });
        });
      }

      // Wrap existing click handlers
      const existingClick = element.onclick;
      if (existingClick) {
        element.onclick = wrapEventHandler(element, 'click', existingClick);
      }

      // Record all clicks anyway
      element.addEventListener('click', (e) => {
        if (e.target === element) {
          recordInteraction('click', element, {
            x: e.clientX,
            y: e.clientY
          });
        }
      });
    }

    // Initialize recording for all elements
    function initializeRecording() {
      const elements = document.querySelectorAll('*');
      elements.forEach(initializeElementRecording);

      // Watch for dynamic elements
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // ELEMENT_NODE
              initializeElementRecording(node);
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    // Get and clear recorded interactions
    function getAndClearInteractions() {
      const result = {
        interactions: interactions,
        startTime: startTime,
        endTime: Date.now()
      };
      interactions = [];
      startTime = Date.now();
      return result;
    }

    return {
      initialize: initializeRecording,
      getAndClear: getAndClearInteractions
    };
  }

  // Create and initialize the recorder
  const interactionRecorder = createInteractionRecorder();
  interactionRecorder.initialize();

  /* === Update Screenshot Logic === */
  screenshotButton.addEventListener("click", () => {
    hideUIElements();
    
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: "capture_screenshot" }, (response) => {
        if (response && response.status === "done") {
          const screenshotData = response.screenshot;
          const minimizedDOM = getMinimizedDOM();
          const interactions = interactionRecorder.getAndClear();
          
          const newEntry = {
            screenshot: screenshotData,
            minimizedDOM: minimizedDOM,
            timestamp: Date.now(),
            interactions: interactions
          };

          chrome.storage.local.get("documentationHistory", (data) => {
            let history = data.documentationHistory || [];
            history.push(newEntry);
            chrome.storage.local.set({ documentationHistory: history });
          });
          showToast("Screenshot taken", true);
        } else {
          showToast("Screenshot failed", false);
        }
        restoreUIElements();
      });
    }, 100);
  });

  // Sidebar toggle button: toggle display of the sidebar.
  sidebarButton.addEventListener("click", () => {
    sidebarContainer.style.display =
      sidebarContainer.style.display === "none" ? "block" : "none";
  });
})();
