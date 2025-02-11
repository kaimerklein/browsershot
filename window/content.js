// content.js

function captureDocumentationOnClick(event) {
  // Optionally, add conditions to filter out unwanted clicks.
  // event.preventDefault(); // Temporarily block the default click behavior.

  let clickedElement = event.target;
  let elementDetails = {
    tag: clickedElement.tagName.toLowerCase(),
    id: clickedElement.id || null,
    class: clickedElement.className || null,
    text: clickedElement.innerText
      ? clickedElement.innerText.trim().substring(0, 100)
      : "",
    x: event.clientX, // Viewport X
    y: event.clientY, // Viewport Y
    pageX: event.pageX, // Document X
    pageY: event.pageY, // Document Y
  };

  // Request screenshot capture from the background.
  chrome.runtime.sendMessage(
    { type: "capture_screenshot", elementDetails: elementDetails },
    (response) => {
      if (response && response.status === "done") {
        // Re-dispatch the original click event.
        // let newEvent = new MouseEvent(event.type, event);
        // clickedElement.dispatchEvent(newEvent);
      } else {
        console.error("Error capturing screenshot.");
      }
    }
  );
}

// Listen for clicks in the capture phase.
document.addEventListener("click", captureDocumentationOnClick, true);
