import { loadSettings } from '../utils';
import { ExtensionSettings } from '../types';
import { swapFace, imageUrlToBase64 } from './api';

// Initialize context menu
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed");
  
  // Create context menu item
  chrome.contextMenus.create({
    id: "vancify",
    title: "Vancify this image",
    contexts: ["image"],
    documentUrlPatterns: ["<all_urls>"]
  });
  
  // Initialize with current settings
  await updateContextMenuState();
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "vancify" && tab?.id && info.srcUrl) {
    const settings = await loadSettings();
    if (!settings.enabled) return;

		try{
			const swapSource = await imageUrlToBase64(chrome.runtime.getURL('assets/images/vance1.jpg'));
			const swappedImageUrl = await swapFace(swapSource, info.srcUrl, settings.apiKey);

			// Send message to content script
			chrome.tabs.sendMessage(tab.id, {
				action: "vancify",
				imageUrl: info.srcUrl,
				swapURL: swappedImageUrl
			});
		} catch (error) {
      console.error("Face swap failed:", error);
    }
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
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'settingsUpdated',
          settings: settings
        }).catch(err => console.log(`Could not send to tab ${tab.id}:`, err));
      }
    });
  });
}