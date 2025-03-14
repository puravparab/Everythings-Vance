export interface ExtensionSettings {
  enabled: boolean;
  apiKey: string;
  imageLimit: number;
}

export const defaultSettings: ExtensionSettings = {
  enabled: false,
  apiKey: '',
  imageLimit: 20
};

export interface ExtensionData {
  imagesSwapped: number;
  imagesFound: number;
}

export const defaultData: ExtensionData = {
  imagesSwapped: 0,
  imagesFound: 0
};