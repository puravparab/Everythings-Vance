import { defaultSettings, defaultData } from '../constants';
import { ExtensionSettings, ExtensionData} from '../types';
import { loadSettings, loadData, saveSettings, broadcastSettingsUpdate } from '../utils';

// DOM Elements
// Main
let mainPage: HTMLElement;
let enableToggle: HTMLInputElement;
let imageSwappedElement: HTMLElement;
let settingsButton: HTMLButtonElement;
// Settings
let settingsPage: HTMLElement;
let backButton: HTMLButtonElement;
let apiKeyInput: HTMLInputElement;

let currentSettings: ExtensionSettings;
let currentData: ExtensionData;
let saveTimer: number | null = null; // avoid chrome rate limits

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
  initializeElements(); // Initialize DOM elements
  try {
    // Load settings and data using util functions
    currentSettings = await loadSettings();
    currentData = await loadData();
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
	imageSwappedElement = document.getElementById('image-swapped') as HTMLElement;
  settingsButton = document.getElementById('settings-btn') as HTMLButtonElement;
  backButton = document.getElementById('back-btn') as HTMLButtonElement;
  apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
  mainPage = document.getElementById('main-page') as HTMLElement;
  settingsPage = document.getElementById('settings-page') as HTMLElement;
  
  // Validate all elements were found
  if (!enableToggle || !imageSwappedElement || !settingsButton || !backButton || 
      !apiKeyInput || !mainPage || !settingsPage) {
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

// Debounced settings save function
function debouncedSaveSettings(): void {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
  }
  // Debounce save operations by 300ms
  saveTimer = window.setTimeout(async () => {
    try {
      await saveSettings(currentSettings);
      // Broadcast the settings update to other contexts
      broadcastSettingsUpdate(currentSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      showError('Failed to save settings. Please try again.');
    }
  }, 300);
}

// Update UI elements based on current settings and data
function updateUI(): void {
  // Update main page
  enableToggle.checked = currentSettings.enabled;
	imageSwappedElement.textContent = currentData.imagesSwapped.toString();
  // Update settings page
  apiKeyInput.value = currentSettings.apiKey;
}

// Set up event listeners
function setupEventListeners(): void {
  // Toggle extension on/off
  enableToggle.addEventListener('change', () => {
    currentSettings.enabled = enableToggle.checked;
    debouncedSaveSettings();
  });
  
  // Settings page navigation
  settingsButton.addEventListener('click', () => {
    showPage('settings');
  });
  
  backButton.addEventListener('click', () => {
    // Save any pending changes before returning to main page
    if (apiKeyInput.value.trim() !== currentSettings.apiKey) {
      currentSettings.apiKey = apiKeyInput.value.trim();
      debouncedSaveSettings();
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
    debouncedSaveSettings();
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
    apiKeyInput.focus();
  }
}