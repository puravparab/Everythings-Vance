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
    console.log("Vancifying image:", message.imageUrl);
    
    // Find the image element
    const images: NodeListOf<HTMLImageElement> = document.querySelectorAll('img');
    
    for (const img of images) {
      if (img.src === message.imageUrl) {
        try {
          const container: HTMLElement = img.parentElement as HTMLElement;
          if (container) {
            const containerStyle = window.getComputedStyle(container);
            if (containerStyle.position === 'static') {
              container.style.position = 'relative';
            }
            
            // Remove all child nodes in the container
            while (container.firstChild) {
              container.removeChild(container.firstChild);
            }
            
            // Create a new overlay image
            const vanceImg: HTMLImageElement = document.createElement('img');
            vanceImg.src = chrome.runtime.getURL('assets/images/vance.png');
            vanceImg.alt = "JD Vance";
            vanceImg.style.width = '100%';
            vanceImg.style.height = '100%';
            vanceImg.style.objectFit = 'cover';
            container.appendChild(vanceImg);
            
            // Add a MutationObserver to ensure only our Vance image stays in the container
            const observer = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                  if (container.children.length > 1) {
                    Array.from(container.children).forEach(child => {
                      if (child !== vanceImg) {
                        container.removeChild(child);
                      }
                    });
                  }
                  
                  // If our Vance image was removed, add it back
                  if (Array.from(container.children).indexOf(vanceImg) === -1) {
                    container.appendChild(vanceImg);
                  }
                }
              }
            });
            
            observer.observe(container, { childList: true, subtree: true });
          } else {
            console.warn("Could not find a suitable container");
          }
        } catch (error) {
          console.error("Error replacing with Vance image:", error);
        }
        return;
      }
    }
    console.warn("Could not find image with URL:", message.imageUrl);
  }
});