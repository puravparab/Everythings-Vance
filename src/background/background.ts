import { ExtensionSettings } from '../types';
import { loadSettings } from '../utils';

// Initialize settings when the extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  try {
    console.log('Extension installed or updated');
    const settings = await loadSettings();
    // Create context menu item
    chrome.contextMenus.create({
      id: 'vanceImageOption',
      title: "Vancify",
      contexts: ['image'],
      enabled: settings.enabled
    });
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
});

// Helper functions for tab operations
function isTwitterOrX(url: string | undefined): boolean {
  return Boolean(url && (url.includes('twitter.com') || url.includes('x.com')));
}

function notifyContentScript(tabId: number, action: string): void {
  chrome.tabs.sendMessage(tabId, { action })
    .catch(() => {/* Ignore errors if content script isn't loaded yet */});
}

// Broadcast settings to all Twitter/X tabs
function broadcastSettingsToTabs(settings: ExtensionSettings): void {
  // Update context menu based on enabled state
  chrome.contextMenus.update('vanceImageOption', {
    enabled: settings.enabled
  });

  chrome.tabs.query({ url: ['*://*.twitter.com/*', '*://*.x.com/*'] }, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'settingsUpdated',
          settings: settings
        }).catch(err => {
          if (!err.message.includes("Receiving end does not exist")) {
            console.error('Failed to send settings to tab:', err);
          }
        });
      }
    });
  });
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'vanceImageOption' && info.srcUrl) {
    console.log('Image URL:', info.srcUrl);
    
    // Send message to content script to log URL
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'logImageUrl',
        imageUrl: info.srcUrl
      }).catch(err => console.error('Failed to send message to content script:', err));
    }
  }
});

// Message handlers organized by action type
const messageHandlers: Record<string, (message: any, sender: chrome.runtime.MessageSender) => void> = {
  'settingsUpdated': (message) => broadcastSettingsToTabs(message.settings),
};

// Central message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message.action];
  if (handler) {
    handler(message, sender);
  } else {
    console.warn('Unknown message action:', message.action);
  }
  return true; // Allow async response
});

// Tab event handlers using shared helper functions
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (isTwitterOrX(tab.url)) {
      notifyContentScript(activeInfo.tabId, 'tabActivated');
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && isTwitterOrX(tab.url)) {
    notifyContentScript(tabId, 'tabUpdated');
  }
});