const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  const inputDir = './original-images';
  const outputDir = './optimized-images';
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(inputDir);
  
  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, `${path.parse(file).name}.webp`);
      
      try {
        await sharp(inputPath)
          .webp({ quality: 80 })
          .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
          .toFile(outputPath);
        
        console.log(`Optimized: ${file} -> ${path.basename(outputPath)}`);
      } catch (error) {
        console.error(`Error optimizing ${file}:`, error);
      }
    }
  }
}

optimizeImages();