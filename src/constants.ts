import { ExtensionData, ExtensionSettings } from "./types";

export const defaultSettings: ExtensionSettings = {
  enabled: false,
  apiKey: '',
};

export const defaultData: ExtensionData = {
  imagesSwapped: 0,
	processedImages: []
};