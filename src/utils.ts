import { defaultSettings, defaultData } from './constants';
import { ExtensionSettings, ExtensionData } from './types';


/**
 * Load extension settings from Chrome storage
 * @returns Promise resolving to the current settings
 */
export async function loadSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve, reject) => {
    if (!chrome.storage) {
      return resolve({ ...defaultSettings });
    }
    
    chrome.storage.local.get('settings', (result) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      try {
        if (result.settings) {
          resolve(result.settings);
        } else {
          resolve({ ...defaultSettings });
        }
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Save extension settings to Chrome storage
 * @param settings The settings to save
 * @returns Promise resolving when settings are saved
 */
export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!chrome.storage) {
      return resolve();
    }
    chrome.storage.local.set({ settings }, () => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve();
    });
  });
}

/**
 * Load extension data from Chrome storage
 * @returns Promise resolving to the current data
 */
export async function loadData(): Promise<ExtensionData> {
  return new Promise((resolve, reject) => {
    if (!chrome.storage) {
      return resolve({ ...defaultData });
    }
    
    chrome.storage.local.get('extensionData', (result) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      try {
        if (result.extensionData) {
          resolve(result.extensionData);
        } else {
          resolve({ ...defaultData });
        }
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Save extension data to Chrome storage
 * @param data The data to save
 * @returns Promise resolving when data is saved
 */
export async function saveData(data: ExtensionData): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!chrome.storage) {
      return resolve();
    }
    chrome.storage.local.set({ extensionData: data }, () => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      resolve();
    });
  });
}

/**
 * Notify all extension contexts about data updates
 */
export function broadcastDataUpdate(data: ExtensionData): void {
  if (chrome.runtime) {
    chrome.runtime.sendMessage({ 
      action: 'dataUpdated', 
      data 
    }).catch(err => console.error('Failed to broadcast data update:', err));
  }
}

/**
 * Notify all extension contexts about settings updates
 */
export function broadcastSettingsUpdate(settings: ExtensionSettings): void {
  if (chrome.runtime) {
    chrome.runtime.sendMessage({ 
      action: 'settingsUpdated', 
      settings 
    }).catch(err => console.error('Failed to broadcast settings update:', err));
  }
}