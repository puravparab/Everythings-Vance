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
	processedImages: Image[];
}

export const defaultData: ExtensionData = {
  imagesSwapped: 0,
  imagesFound: 0,
	processedImages: []

};

export interface Image {
  imageUrl: string;
  width: number;
  height: number;
  swapUrl: string;
}