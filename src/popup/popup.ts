interface ExtensionSettings {
  enabled: boolean;
  swapCount: number;
  apiKey: string;
  imageLimit: number;
}

// Default settings
const defaultSettings: ExtensionSettings = {
  enabled: false,
  swapCount: 0,
  apiKey: '',
  imageLimit: 100
};

// DOM Elements
const mainPage = document.getElementById('main-page') as HTMLDivElement;
const settingsPage = document.getElementById('settings-page') as HTMLDivElement;
const enableToggle = document.getElementById('enable-toggle') as HTMLInputElement;
const swapCountElement = document.getElementById('swap-count') as HTMLSpanElement;
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
const backBtn = document.getElementById('back-btn') as HTMLButtonElement;
const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
const imageLimitInput = document.getElementById('image-limit') as HTMLInputElement;

// Load settings from storage
function loadSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultSettings, (result) => {
      resolve(result as ExtensionSettings);
    });
  });
}

// Save settings to storage
function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
}

// Update UI with settings
async function updateUI() {
  const settings = await loadSettings();
  
  enableToggle.checked = settings.enabled;
  swapCountElement.textContent = settings.swapCount.toString();
  apiKeyInput.value = settings.apiKey;
  imageLimitInput.value = settings.imageLimit.toString();
}

// Switch between pages
function showPage(pageId: string) {
  mainPage.classList.remove('active');
  settingsPage.classList.remove('active');
  
  if (pageId === 'main') {
    mainPage.classList.add('active');
  } else if (pageId === 'settings') {
    settingsPage.classList.add('active');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  
  // Toggle enable/disable
  enableToggle.addEventListener('change', async () => {
    await saveSettings({ enabled: enableToggle.checked });
    
    // Notify background script of the change
    chrome.runtime.sendMessage({ 
      action: 'toggleEnabled', 
      enabled: enableToggle.checked 
    });
  });
  
  // Navigation between pages
  settingsBtn.addEventListener('click', () => {
    showPage('settings');
  });
  
  backBtn.addEventListener('click', () => {
    showPage('main');
  });
  
  // Save API key
  apiKeyInput.addEventListener('change', async () => {
    await saveSettings({ apiKey: apiKeyInput.value });
  });
  
  // Save image limit
  imageLimitInput.addEventListener('change', async () => {
    const limit = parseInt(imageLimitInput.value) || 100;
    await saveSettings({ imageLimit: limit });
  });
});

// Listen for updates from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'updateSwapCount') {
    swapCountElement.textContent = message.count.toString();
  }
});