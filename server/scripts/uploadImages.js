const { bucket } = require('../config/firebaseAdmin');
const path = require('path');
const fs = require('fs');

async function uploadImages() {
  const imagesDir = path.join(__dirname, '../../recipe_images'); // Your unzipped folder
  const files = fs.readdirSync(imagesDir);

  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const destination = `recipes/${path.parse(file).name}`;
    
    await bucket.upload(filePath, { destination });
    console.log(`Uploaded ${file}`);
  }
}

uploadImages().catch(console.error);