import { ExtensionSettings, ExtensionData, Image } from '../types';
import { loadSettings, loadData, saveData, broadcastDataUpdate } from '../utils';

// Initialize settings when the extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  try {
    console.log('Extension installed or updated');
    await loadSettings();
    await loadData();
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
  chrome.tabs.query({ url: ['*://*.twitter.com/*', '*://*.x.com/*'] }, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'settingsUpdated',
          settings: settings
        }).catch(err => console.error('Failed to send settings to tab:', err));
      }
    });
  });
}

/**
 * Process newly found images from a content script
 */
async function handleImagesFound(newImages: Image[], tabId?: number): Promise<void> {
  if (!newImages || newImages.length === 0) return;
  
  try {
    const data = await loadData();  // Get current extension data
    const settings = await loadSettings(); // Load settings to check image limit

    // Check if we've already hit the limit
    if (data.processedImages.length >= settings.imageLimit) {
      console.log(`Image limit (${settings.imageLimit}) reached. Skipping new images.`);
      return;
    }
    
    // Create a set of existing image URLs for quick lookup
    const existingImageUrls = new Set(
      data.processedImages.map(img => img.imageUrl)
    );
    
    // Filter out images we've already processed
    const uniqueNewImages = newImages.filter(img => !existingImageUrls.has(img.imageUrl));
    if (uniqueNewImages.length === 0) return;
    
    // Calculate how many images we can still add
    const remainingSlots = settings.imageLimit - data.processedImages.length;
    const imagesToAdd = uniqueNewImages.slice(0, remainingSlots); // Only add up to the limit
    
    // Update data
    data.imagesFound += imagesToAdd.length;
    data.processedImages = [...data.processedImages, ...imagesToAdd];
    await saveData(data);

    // Broadcast update to all contexts (popup and content scripts)
    broadcastDataUpdate(data);
    
  } catch (error) {
    console.error('Error handling new images:', error);
  }
}

// Message handlers organized by action type
const messageHandlers: Record<string, (message: any, sender: chrome.runtime.MessageSender) => void> = {
  'imagesFound': (message, sender) => handleImagesFound(message.images, sender.tab?.id),
  'settingsUpdated': (message) => broadcastSettingsToTabs(message.settings),
  'swapImage': (message, sender) => {
    // TODO
    console.log('Image swap requested:', message.imageUrl);
  }
};

// Central message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message.action];
  if (handler) {
    handler(message, sender);
  } else {
    console.warn('Unknown message action:', message.action);
  }
  // Allow async response
  return true;
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