const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { bucket } = require('../config/firebaseAdmin');

async function compressAndUploadImages() {
  try {
    const imagesDir = path.join(__dirname, '../../recipe_images');
    const files = fs.readdirSync(imagesDir);

    const [exists] = await bucket.exists();
    if (!exists) throw new Error(`Bucket ${bucket.name} does not exist`);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ext !== '.jpg' && ext !== '.jpeg') {
        console.log(`Skipping non-JPEG file: ${file}`);
        continue;
      }

      const inputPath = path.join(imagesDir, file);
      const destination = `recipes/${file}`;

      const originalSize = fs.statSync(inputPath).size / 1024; // KB

      let bufferToUpload;

      if (originalSize < 200) {
        console.log(`🔹 ${file} is already ${Math.round(originalSize)}KB — uploading directly`);
        bufferToUpload = fs.readFileSync(inputPath);
      } else {
        console.log(`⚙️ Compressing ${file} (${Math.round(originalSize)}KB)...`);
        bufferToUpload = await sharp(inputPath)
          .resize({ width: 800 })
          .jpeg({ quality: 60, chromaSubsampling: '4:4:4' })
          .toBuffer();
      }

      const fileUpload = bucket.file(destination);
      await fileUpload.save(bufferToUpload, {
        metadata: {
          contentType: 'image/jpeg',
          cacheControl: 'public, max-age=31536000',
        },
      });

      console.log(`✅ Uploaded ${file} to ${destination} (${Math.round(bufferToUpload.length / 1024)}KB)`);
    }

  } catch (err) {
    console.error('❌ Upload failed:', err.message);
  }
}

compressAndUploadImages();
