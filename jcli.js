#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Read command-line arguments.
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error(
    "Usage: node exportScreenshots.js <input_json_file> [output_directory]"
  );
  process.exit(1);
}

const inputFilePath = args[0];
const outputDir = args[1] || "./exported_screenshots";

// Ensure the output directory exists.
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read the input JSON file.
fs.readFile(inputFilePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading input file:", err);
    process.exit(1);
  }

  let history;
  try {
    history = JSON.parse(data);
  } catch (parseErr) {
    console.error("Error parsing JSON file:", parseErr);
    process.exit(1);
  }

  // Check that history is an array.
  if (!Array.isArray(history)) {
    console.error("The JSON file must contain an array of entries.");
    process.exit(1);
  }

  // Process each entry and export screenshots.
  const exportedHistory = history.map((entry, index) => {
    // Make a copy of the entry.
    const newEntry = { ...entry };

    if (newEntry.screenshot) {
      // Expect screenshot to be a data URL: "data:image/png;base64,...."
      const match = newEntry.screenshot.match(/^data:image\/png;base64,(.+)$/);
      if (match && match[1]) {
        const base64Data = match[1];
        // Create a filename using the index and timestamp if available.
        const timeStamp = newEntry.timestamp || Date.now();
        const fileName = `screenshot_${index}_${timeStamp}.png`;
        const filePath = path.join(outputDir, fileName);
        try {
          fs.writeFileSync(filePath, base64Data, "base64");
          // Replace screenshot property with a reference filename.
          newEntry.screenshotFile = fileName;
        } catch (writeErr) {
          console.error(
            `Error writing screenshot for entry ${index}:`,
            writeErr
          );
        }
      } else {
        console.warn(
          `Entry ${index} does not have a valid screenshot data URL.`
        );
      }
      // Remove the original screenshot property.
      delete newEntry.screenshot;
    }
    return newEntry;
  });

  // Write the new JSON file without screenshots.
  const outputJsonFile = path.join(outputDir, "exported_history.json");
  try {
    fs.writeFileSync(
      outputJsonFile,
      JSON.stringify(exportedHistory, null, 2),
      "utf8"
    );
    console.log(`Export complete.
Screenshots saved to: ${outputDir}
JSON file saved as: ${outputJsonFile}`);
  } catch (writeJsonErr) {
    console.error("Error writing the exported JSON file:", writeJsonErr);
  }
});
