// content.ts
import { ExtensionSettings, defaultSettings } from "../types";

// Variable to store the current settings
let settings: ExtensionSettings = defaultSettings;

// Function to count images on the page
function countImagesOnTwitter(): number {
  // Twitter images are typically in <img> tags or as background images in divs
  // This is a simplified approach - might need adjustment for Twitter's specific DOM structure
  const imgTags = document.querySelectorAll('img');
  return imgTags.length;
}

// Function to initialize the extension
async function initialize() {
  // Load settings from storage
  chrome.storage.sync.get(defaultSettings, (result) => {
    settings = result as ExtensionSettings;
    
    // If extension is enabled, start the process
    if (settings.enabled) {
      // Set up a timer to count images periodically
      setInterval(reportImageCount, 2000);
      // Also count immediately
      reportImageCount();
    }
  });
}

// Function to report image count to background script
function reportImageCount() {
  const imageCount = countImagesOnTwitter();
  chrome.runtime.sendMessage({ 
    action: 'reportImageCount',
    count: imageCount
  });
}

// Listen for settings changes
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'settingsUpdated') {
    settings = message.settings;
  }
});

// Initialize when the page loads
initialize();

// Also handle dynamic content loading by observing DOM changes
const observer = new MutationObserver(() => {
  if (settings.enabled) {
    reportImageCount();
  }
});

// Start observing changes to the body and its descendants
observer.observe(document.body, {
  childList: true,
  subtree: true
});