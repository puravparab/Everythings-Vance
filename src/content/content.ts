import { ExtensionSettings } from '../types';
import { loadSettings } from '../utils';

let currentSettings: ExtensionSettings;

// Initialize settings
(async function initialize() {
  currentSettings = await loadSettings();
})();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle settings updates
  if (message.action === 'settingsUpdated') {
    currentSettings = message.settings;
    return;
  }
  
  // Handle vancify action
  if (message.action === "vancify" && message.imageUrl && currentSettings.enabled) {
    const imageElements = document.querySelectorAll('img');
    for (const img of imageElements) {
      if (img.src === message.imageUrl) {
        console.log("Found image element:", img);
        break;
      }
    }
  }
});