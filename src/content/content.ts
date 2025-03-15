import { ExtensionSettings } from '../types';
import { loadSettings } from '../utils';

let extensionEnabled = false;

// Initialize when content script loads
async function initialize() {
  try {
    const settings = await loadSettings();
    extensionEnabled = settings.enabled;
    
    // Listen for settings updates and other messages
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'settingsUpdated' && message.settings) {
        extensionEnabled = message.settings.enabled;
      } else if (message.action === 'logImageUrl' && message.imageUrl) {
        // Log the image URL to the console when requested
        console.log('Image URL:', message.imageUrl);
      }
      return true;
    });
  } catch (error) {
    console.error('Failed to initialize content script:', error);
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}