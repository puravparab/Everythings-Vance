export interface ExtensionSettings {
  enabled: boolean;
  swapCount: number;
  apiKey: string;
  imageLimit: number;
}

export const defaultSettings: ExtensionSettings = {
  enabled: false,
  swapCount: 0,
  apiKey: '',
  imageLimit: 100
};