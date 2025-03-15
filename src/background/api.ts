import Replicate from "replicate";

// Convert a image to a base64 data URL
async function getBase64Image(imagePath: string): Promise<string> {
  try {
    const imageUrl = chrome.runtime.getURL(imagePath);
    console.log('Attempting to load image from:', imageUrl);
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (fetchError) {
      console.error(`Fetch error for ${imageUrl}:`, fetchError);
      throw fetchError;
    }
  } catch (error: any) {
    console.error(`Failed to load image from ${imagePath}:`, error);
    throw new Error(`Failed to load image: ${error.message}`);
  }
}

// Process an image through the Replicate API
export async function processImageSwap(
  imageUrl: string, 
  apiKey: string, 
  swapImagePath: string = "assets/images/vance1.jpg"
): Promise<string | null> {
  try {
    // Skip if not JPG or PNG
    const lowerUrl = imageUrl.toLowerCase();
    if (!lowerUrl.endsWith('.jpg') && !lowerUrl.endsWith('.jpeg') && !lowerUrl.endsWith('.png')) {
      return null;
    }
    
    // Load swap image
    const swapImageBase64 = await getBase64Image(swapImagePath);
    
    // Initialize Replicate with API key
    const replicate = new Replicate({
      auth: apiKey,
    });
    
    // Run the model directly
    const output = await replicate.run(
      "cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111",
      {
        input: {
          swap_image: swapImageBase64,
          input_image: imageUrl
        }
      }
    );
    
    console.log("Face swap output received", typeof output);
    
    if (!output) {
      return null;
    }
    
    // Convert the binary data to a base64 data URL
    // This works in both browser and Node.js environments
    const uint8Array = new Uint8Array(output as ArrayBufferLike);
    let binaryString = '';
    uint8Array.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });
    const base64 = btoa(binaryString);
		console.log(base64)
    return `data:image/jpeg;base64,${base64}`;
    
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}