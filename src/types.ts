export interface ExtensionSettings {
  enabled: boolean;
  apiKey: string;
}

export interface ExtensionData {
  imagesSwapped: number;
	processedImages: Image[];
}

export interface Image {
  imageUrl: string;
  width: number;
  height: number;
  swapUrl: string;
}