document.addEventListener("DOMContentLoaded", function () {
  const captureBtn = document.getElementById("captureBtn");
  const analysisArea = document.getElementById("analysisArea");
  const updateBtn = document.getElementById("updateBtn");
  const commentsArea = document.getElementById("comments");
  const screenshotThumbnail = document.getElementById("screenshotThumbnail");

  captureBtn.addEventListener("click", function () {
    captureDocumentation();
  });

  updateBtn.addEventListener("click", function () {
    let updatedText = analysisArea.value;
    let userComments = commentsArea.value;
    // Process the updated documentation (e.g., send to a server or save locally).
    console.log("Updated Documentation:", updatedText);
    console.log("User Comments:", userComments);
    alert("Documentation updated. Check the console for details.");
  });

  function captureDocumentation() {
    // First, request the screenshot from the background script.
    chrome.runtime.sendMessage(
      { type: "capture_screenshot" },
      function (response) {
        let screenshotData = response.screenshot;

        // Display the screenshot as a thumbnail.
        screenshotThumbnail.src = screenshotData;

        // Now get the minimized DOM from the active tab via the content script.
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            if (tabs.length === 0) return;
            let tabId = tabs[0].id;
            chrome.tabs.sendMessage(
              tabId,
              { type: "get_minimized_dom" },
              function (response) {
                let minimizedDOM = response.dom;

                // Now send both the screenshot and DOM to the vision LLM API.
                analyzeDocumentation(screenshotData, minimizedDOM);
              }
            );
          }
        );
      }
    );
  }

  function analyzeDocumentation(screenshotData, minimizedDOM) {
    // For demonstration purposes, we simulate an API call.
    // Replace the following with your actual API endpoint and POST logic.
    let payload = {
      screenshot: screenshotData,
      dom: minimizedDOM,
    };

    analysisArea.value = "Analyzing screenshot and DOM...";

    // Simulate a delay to represent the API call.
    setTimeout(function () {
      // Fake analysis output:
      let analysisResult =
        "Draft Documentation:\n\n" +
        "Screenshot captured.\n" +
        "Detected fields:\n" +
        JSON.stringify(minimizedDOM, null, 2) +
        "\n\n[Analysis based on screenshot and DOM provided by vision LLM]";
      analysisArea.value = analysisResult;
    }, 1000);

    /* Example of a real API call:
      fetch("https://your-vision-llm-api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
      .then(response => response.json())
      .then(data => {
        analysisArea.value = data.analysis;
      })
      .catch(error => {
        console.error("Error in LLM analysis:", error);
        analysisArea.value = "Error analyzing documentation.";
      });
      */
  }
});
