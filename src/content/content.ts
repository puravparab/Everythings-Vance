import { loadSettings } from '../utils';

let extensionEnabled = false;

// Initialize when content script loads
async function initialize() {
  try {
    const settings = await loadSettings();
    extensionEnabled = settings.enabled;
    
    chrome.runtime.onMessage.addListener((message) => {
			// Listen for settings updates
      if (message.action === 'settingsUpdated' && message.settings) {
        extensionEnabled = message.settings.enabled;
      } 
			// Listen for image url
			else if (message.action === 'logImageUrl' && message.imageUrl) {
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