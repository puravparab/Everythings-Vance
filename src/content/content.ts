import { ExtensionSettings, Image } from '..//types';
import { loadSettings } from '../utils';

// State variables
let settings: ExtensionSettings | null = null;
let observer: MutationObserver | null = null;
let processedImages: Map<string, boolean> = new Map();
let scanning: boolean = false;

// Initialize the content script
initialize();

async function initialize(): Promise<void> {
  try {
    settings = await loadSettings();
    
    // Listen for settings changes
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'settingsUpdated') {
        settings = message.settings;
        updateObserver();
      }
      return true;
    });

    // Set up visibility change listener to refresh when tab becomes active
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        settings = await loadSettings();
        updateObserver();
      }
    });

    // Initial setup based on loaded settings
    updateObserver();
  } catch (error) {
    console.error('Failed to initialize content script:', error);
  }
}

function updateObserver(): void {
  // If disabled, disconnect observer if it exists
  if (!settings?.enabled) {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    return;
  }
  // If already set up and enabled, do nothing
  if (observer) {
    return;
  }

  // Set up observer and do initial scan
  setupObserver();
  scanImages();
}

function setupObserver(): void {
  observer = new MutationObserver(() => {
    if (scanning) return;  // Throttle scanning to avoid performance issues
    scanning = true;
    setTimeout(() => {
      scanImages();
      scanning = false;
    }, 1000);
  });
  // Observe the entire document for added nodes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function scanImages(): void {
  if (!settings?.enabled) return;

	const newImages: Image[] = [];
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    const imageUrl = img.src;
    if (!imageUrl || imageUrl.trim() === '') return;
    if (processedImages.has(imageUrl)) return;

    processedImages.set(imageUrl, true);
    newImages.push({
      imageUrl,
      width: img.width,
      height: img.height,
      swapUrl: ''
    });
  });

  if (newImages.length > 0) {
    chrome.runtime.sendMessage({
      action: 'imagesFound',
      images: newImages
    });
  }
}