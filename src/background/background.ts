// background.ts
import { ExtensionSettings, defaultSettings } from "../types";

// Store the current settings
let settings: ExtensionSettings = defaultSettings;
// Store the current image count
let currentImageCount = 0;

// Initialize settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(defaultSettings, (result) => {
    settings = result as ExtensionSettings;
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle image count reports from content script
  if (message.action === 'reportImageCount') {
    currentImageCount = message.count;
    
    // Forward the count to the popup if it's open
    chrome.runtime.sendMessage({ 
      action: 'updateImageCount',
      count: currentImageCount
    });
  }
  
  // Handle toggle requests from popup
  if (message.action === 'toggleEnabled') {
    settings.enabled = message.enabled;
    
    // Save to storage
    chrome.storage.sync.set({ enabled: settings.enabled });
    
    // Notify content scripts of the change
    chrome.tabs.query({ url: ["*://*.twitter.com/*", "*://*.x.com/*"] }, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'settingsUpdated',
            settings
          });
        }
      });
    });
  }
});

// Provide image count when popup opens and requests it
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getImageCount') {
    sendResponse({ count: currentImageCount });
  }
  return true; // Keeps the message channel open for async response
});