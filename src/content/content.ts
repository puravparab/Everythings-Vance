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
  
  // Handle loading state
  if (message.action === "startLoading" && message.imageUrl && currentSettings.enabled) {
    // Find the image element
    const images: NodeListOf<HTMLImageElement> = document.querySelectorAll('img');
    
    for (const img of images) {
      if (img.src === message.imageUrl) {
        try {
          const container = img.parentElement as HTMLElement;
          if (!container) continue;
          
          // Ensure container has relative positioning
          const containerStyle = window.getComputedStyle(container);
          if (containerStyle.position === 'static') {
            container.style.position = 'relative';
          }
          
          // Create loading overlay
          const loadingOverlay = document.createElement('div');
          loadingOverlay.className = 'vance-loading-overlay';
          loadingOverlay.style.position = 'absolute';
          loadingOverlay.style.top = '0';
          loadingOverlay.style.left = '0';
          loadingOverlay.style.width = '100%';
          loadingOverlay.style.height = '100%';
          loadingOverlay.style.display = 'flex';
          loadingOverlay.style.flexDirection = 'column';
          loadingOverlay.style.justifyContent = 'center';
          loadingOverlay.style.alignItems = 'center';
          loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          loadingOverlay.style.color = 'white';
          loadingOverlay.style.zIndex = '10000';
          
          // Add loading text
          const loadingText = document.createElement('div');
          loadingText.innerText = 'Vancifying...';
          loadingText.style.fontSize = '18px';
          loadingText.style.fontWeight = 'bold';
          loadingText.style.margin = '10px';
          
          // Add a simple spinner
          const spinner = document.createElement('div');
          spinner.className = 'vance-spinner';
          spinner.style.width = '30px';
          spinner.style.height = '30px';
          spinner.style.border = '3px solid rgba(255, 255, 255, 0.3)';
          spinner.style.borderRadius = '50%';
          spinner.style.borderTop = '3px solid white';
          spinner.style.animation = 'vance-spin 1s linear infinite';
          
          // Add keyframes for spinner animation
          const style = document.createElement('style');
          style.textContent = `
            @keyframes vance-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(style);
          
          // Append elements to overlay
          loadingOverlay.appendChild(spinner);
          loadingOverlay.appendChild(loadingText);
          
          // Add overlay to container while preserving the original image
          container.appendChild(loadingOverlay);
        } catch (error) {
          console.error("Error adding loading state:", error);
        }
        return;
      }
    }
  }
  
  // Handle loading failure
  if (message.action === "loadingFailed" && message.imageUrl) {
    // Find and remove loading overlay
    const overlays = document.querySelectorAll('.vance-loading-overlay');
    overlays.forEach(overlay => overlay.remove());
    
    return;
  }
  
  // Handle vancify action
  if (message.action === "vancify" && message.imageUrl && currentSettings.enabled) {
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
            
            // Remove the loading overlay if it exists
            const existingOverlay = container.querySelector('.vance-loading-overlay');
            if (existingOverlay) {
              container.removeChild(existingOverlay);
            }
            
            // Remove all child nodes in the container
            while (container.firstChild) {
              container.removeChild(container.firstChild);
            }
            
            // Create a new overlay image
            const vanceImg: HTMLImageElement = document.createElement('img');
            vanceImg.src = message.swapURL
            vanceImg.alt = "JD Vance";
            vanceImg.style.width = '100%';
            vanceImg.style.height = '100%';
            vanceImg.style.objectFit = 'cover';
            container.appendChild(vanceImg);
            
            // Add a MutationObserver to ensure only the swapped image stays in the container
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
                  
                  // If the Vance image was removed, add it back
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