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

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages from content scripts about new images found
  if (message.action === 'imagesFound') {
    console.log('Images found:', message.images.length);
    handleImagesFound(message.images, sender.tab?.id);
  }
  
  // If settings are updated from popup
  if (message.action === 'settingsUpdated') {
    // Forward settings to all tabs with content scripts
    chrome.tabs.query({ url: ['*://*.twitter.com/*', '*://*.x.com/*'] }, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsUpdated',
            settings: message.settings
          }).catch(err => console.error('Failed to send settings to tab:', err));
        }
      });
    });
  }
  
  // Allow async response
  return true;
});

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
// Activate the extension when a Twitter/X tab is selected
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (!tab.url) return;
    const isX = tab.url.includes('twitter.com') || tab.url.includes('x.com');
    if (isX) {
      chrome.tabs.sendMessage(activeInfo.tabId, { action: 'tabActivated' })
        .catch(() => {/* Ignore errors if content script isn't loaded yet */});
    }
  });
});

// Listen for tab updates (URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && (tab.url.includes('twitter.com') || tab.url.includes('x.com'))) {
    chrome.tabs.sendMessage(tabId, { action: 'tabUpdated' })
      .catch(() => {/* Ignore errors if content script isn't loaded yet */});
  }
});