const { storage } = require('../config/firebaseAdmin');
const { ref, uploadBytes } = require('firebase/storage');

async function triggerResizeForExistingImages() {
  try {
    const bucket = storage.bucket('smartchef-app-c4b56.firebasestorage.app');
    const [files] = await bucket.getFiles({ prefix: 'recipes/' });
    
    console.log(`Found ${files.length} images to process`);
    
    for (const file of files) {
      if (file.name.match(/\.(jpg|jpeg|png)$/i)) {
        console.log(`Triggering resize for: ${file.name}`);
        
        // Download and re-upload to trigger the extension
        const [buffer] = await file.download();
        await file.save(buffer, {
          metadata: {
            contentType: file.metadata.contentType
          }
        });
        
        console.log(`Processed: ${file.name}`);
      }
    }
    
    console.log('All images processed! Check the resized folder in Firebase Storage.');
  } catch (error) {
    console.error('Error processing images:', error);
  }
}

triggerResizeForExistingImages();