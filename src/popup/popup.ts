import { ExtensionSettings, ExtensionData, defaultSettings, defaultData } from '../types';

// DOM Elements
// Main
let mainPage: HTMLElement;
let enableToggle: HTMLInputElement;
let imageCountElement: HTMLElement;
let settingsButton: HTMLButtonElement;
// Settings
let settingsPage: HTMLElement;
let backButton: HTMLButtonElement;
let apiKeyInput: HTMLInputElement;
let imageLimitInput: HTMLInputElement;

let currentSettings: ExtensionSettings;
let currentData: ExtensionData;
let saveTimer: number | null = null; // avoid chrome rate limits

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
  initializeElements(); // Initialize DOM elements
  try {
    await Promise.all([loadSettings(), loadData()]);
    updateUI();
    setupEventListeners();
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    showError('Failed to load settings. Please try reopening the popup.');
  }
});

// Initialize DOM element references
function initializeElements(): void {
  enableToggle = document.getElementById('enable-toggle') as HTMLInputElement;
  imageCountElement = document.getElementById('image-count') as HTMLElement;
  settingsButton = document.getElementById('settings-btn') as HTMLButtonElement;
  backButton = document.getElementById('back-btn') as HTMLButtonElement;
  apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
  imageLimitInput = document.getElementById('image-limit') as HTMLInputElement;
  mainPage = document.getElementById('main-page') as HTMLElement;
  settingsPage = document.getElementById('settings-page') as HTMLElement;
  
  // Validate all elements were found
  if (!enableToggle || !imageCountElement || !settingsButton || !backButton || 
      !apiKeyInput || !imageLimitInput || !mainPage || !settingsPage) {
    throw new Error('Failed to initialize UI elements');
  }
}

// Show error message in the popup
function showError(message: string): void {
  const errorElement = document.createElement('div');
  errorElement.style.color = 'red';
  errorElement.style.padding = '10px';
  errorElement.style.margin = '10px 0';
  errorElement.style.backgroundColor = '#ffeeee';
  errorElement.style.borderRadius = '5px';
  errorElement.textContent = message;
  document.body.prepend(errorElement);
}

// Load settings from Chrome storage
async function loadSettings(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!chrome.storage) {
      currentSettings = { ...defaultSettings };
      return resolve();
    }
    
    chrome.storage.local.get('settings', (result) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      try {
        if (result.settings) {
          currentSettings = result.settings;
        } else {
          currentSettings = { ...defaultSettings };
          saveSettings();
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Load data from Chrome storage (read-only)
async function loadData(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!chrome.storage) {
      currentData = { ...defaultData };
      return resolve();
    }
    
    chrome.storage.local.get('extensionData', (result) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      try {
        if (result.extensionData) {
          currentData = result.extensionData;
        } else {
          currentData = { ...defaultData };
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Save settings to Chrome local storage
function saveSettings(): void {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
  }
  // Debounce save operations by 300ms
  saveTimer = window.setTimeout(() => {
    if (!chrome.storage) return;
    
    chrome.storage.local.set({ settings: currentSettings }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to save settings:', chrome.runtime.lastError);
        return;
      }
      // Notify the background script that settings have changed
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ 
          action: 'settingsUpdated', 
          settings: currentSettings 
        }).catch(err => console.error('Failed to notify background script:', err));
      }
    });
  }, 300);
}

// Update UI elements based on current settings and data
function updateUI(): void {
  // Update main page
  enableToggle.checked = currentSettings.enabled;
  imageCountElement.textContent = currentData.imagesSwapped.toString();
  
  // Update settings page
  apiKeyInput.value = currentSettings.apiKey;
  imageLimitInput.value = currentSettings.imageLimit.toString();
}

// Set up event listeners
function setupEventListeners(): void {
  // Toggle extension on/off
  enableToggle.addEventListener('change', () => {
    currentSettings.enabled = enableToggle.checked;
    saveSettings();
  });
  
  // Settings page navigation
  settingsButton.addEventListener('click', () => {
    showPage('settings');
  });
  
  backButton.addEventListener('click', () => {
    // Save any pending changes before returning to main page
    if (apiKeyInput.value.trim() !== currentSettings.apiKey) {
      currentSettings.apiKey = apiKeyInput.value.trim();
      saveSettings();
    }
    const newLimit = parseInt(imageLimitInput.value, 10);
    if (!isNaN(newLimit) && newLimit >= 0 && newLimit !== currentSettings.imageLimit) {
      currentSettings.imageLimit = Math.min(1000, newLimit);
      saveSettings();
    }
    showPage('main');
  });
  
  // Input change handlers with validation
  apiKeyInput.addEventListener('input', () => {
    // We'll save on blur or when returning to main page
    apiKeyInput.classList.toggle('invalid', apiKeyInput.value.trim() === '');
  });
  
  apiKeyInput.addEventListener('blur', () => {
    currentSettings.apiKey = apiKeyInput.value.trim();
    saveSettings();
  });
  
  imageLimitInput.addEventListener('input', () => {
    const limit = parseInt(imageLimitInput.value, 10);
    imageLimitInput.classList.toggle('invalid', isNaN(limit) || limit < 0);
  });
  
  imageLimitInput.addEventListener('blur', () => {
    const limit = parseInt(imageLimitInput.value, 10);
    if (!isNaN(limit) && limit >= 0) {
      currentSettings.imageLimit = Math.min(1000, limit);
      saveSettings();
    } else {
      // Reset to current value if invalid
      imageLimitInput.value = currentSettings.imageLimit.toString();
    }
  });
  
  // Listen for data updates from content script or background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'dataUpdated' && message.data) {
      currentData = message.data;
      updateUI();
    }
  });
}

// Show specified page (main or settings)
function showPage(page: 'main' | 'settings'): void {
  if (page === 'main') {
    mainPage.classList.add('active');
    settingsPage.classList.remove('active');
    enableToggle.focus();
  } else {
    mainPage.classList.remove('active');
    settingsPage.classList.add('active');
    imageLimitInput.focus();
  }
}