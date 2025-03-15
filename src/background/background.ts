import { loadSettings, saveSettings } from '../utils';
import { ExtensionSettings } from '../types';

// Initialize context menu
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed");
  
  // Create context menu item
  chrome.contextMenus.create({
    id: "vancify",
    title: "Vancify this image",
    contexts: ["image"],
    documentUrlPatterns: ["*://*.twitter.com/*", "*://*.x.com/*"]
  });
  
  // Initialize with current settings
  await updateContextMenuState();
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "vancify" && tab?.id && info.srcUrl) {
    const settings = await loadSettings();
    if (!settings.enabled) return;
		
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, {
      action: "vancify",
      imageUrl: info.srcUrl
    });
  }
});

// Listen for settings changes
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'settingsUpdated') {
    updateContextMenuState();
    propagateSettingsToTabs(message.settings);
  }
});

// Update context menu based on enabled state
async function updateContextMenuState() {
  const settings = await loadSettings();
  chrome.contextMenus.update("vancify", {
    enabled: settings.enabled
  });
}

// Propagate settings to all tabs
async function propagateSettingsToTabs(settings?: ExtensionSettings) {
  if (!settings) {
    settings = await loadSettings();
  }
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id && (tab.url?.includes('twitter.com') || tab.url?.includes('x.com'))) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'settingsUpdated',
          settings: settings
        }).catch(err => console.log(`Could not send to tab ${tab.id}:`, err));
      }
    });
  });
}