export const checkImageBlur = (file, threshold = 150) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas and scale down for faster processing and scale-invariance
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const MAX_DIMENSION = 500;
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > MAX_DIMENSION) {
          height *= MAX_DIMENSION / width;
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width *= MAX_DIMENSION / height;
          height = MAX_DIMENSION;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const variance = calculateLaplacianVariance(imageData);
        
        resolve({
          isBlurry: variance < threshold,
          score: variance.toFixed(2),
          previewUrl: e.target.result
        });
      };
      
      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsDataURL(file);
  });
};

function calculateLaplacianVariance(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // Convert to grayscale
  const grayscale = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    grayscale[i / 4] = gray;
  }

  const laplacian = new Float32Array(width * height);
  let mean = 0;
  
  // Apply 3x3 Laplacian kernel
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const value = grayscale[idx - width] + 
                    grayscale[idx - 1] + 
                    grayscale[idx + 1] + 
                    grayscale[idx + width] - 
                    4 * grayscale[idx];
      laplacian[idx] = value;
      mean += value;
    }
  }
  
  const count = (width - 2) * (height - 2);
  mean /= count;
  
  let variance = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const diff = laplacian[idx] - mean;
      variance += diff * diff;
    }
  }
  
  return variance / count;
}
