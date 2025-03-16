import Replicate from "replicate";

// Call Replicate Face Swap API
export async function swapFace(
  sourceImageUrl: string, 
  targetImageUrl: string, 
  apiKey: string
): Promise<string> {
  try {
    const replicate = new Replicate({
      auth: apiKey,
    });

    // Run the model
    const output: any = await replicate.run(
      "cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111", 
      { 
        input: {
          swap_image: sourceImageUrl,
          input_image: targetImageUrl
        }
      }
    );
    
    console.log("API response:", output);
    
    // Handle string output
    if (typeof output === 'string') {
      return output;
    }
    
    // Handle FileOutput object where url is a method
    if (output && typeof output === 'object' && typeof output.url === 'function') {
      const urlObj = output.url();
      return urlObj.toString();
    }
    
    // Fallback for other object formats
    if (output && typeof output === 'object') {
      if (output.output) return output.output;
      if (output.result) return output.result;
      
      // Handle array of outputs
      if (Array.isArray(output) && output.length > 0) {
        const firstOutput = output[0];
        if (typeof firstOutput === 'string') return firstOutput;
        if (firstOutput && typeof firstOutput.url === 'function') {
          return firstOutput.url().toString();
        }
      }
    }
    
    throw new Error("Could not extract URL from API response");
  } catch (error: any) {
    console.error("Face swap error:", error.message);
    throw error;
  }
}

// Converts an image URL to base64
export async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}