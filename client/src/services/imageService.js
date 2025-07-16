import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';

// Simple in-memory cache
const imageCache = new Map();

export class ImageService {
  static async getOptimizedImageUrl(imagePath, options = {}) {
    if (!imagePath) {
      console.log('ImageService: No image path provided, using placeholder');
      return '/placeholder-food.jpg';
    }
    
    const {
      width = 400,
      height = 300,
      quality = 80,
      format = 'webp'
    } = options;

    // Create cache key
    const cacheKey = `${imagePath}_${width}x${height}_${format}`;
    
    // Check cache first
    if (imageCache.has(cacheKey)) {
      console.log('ImageService: Using cached URL for:', imagePath);
      return imageCache.get(cacheKey);
    }

    console.log('ImageService: Processing image:', imagePath, 'with options:', options);

    try {
      // Extract filename from path
      const filename = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;
      
      // Determine which size to use based on width
      let sizePath = '';
      if (width <= 200) {
        sizePath = '200x200';
      } else if (width <= 400) {
        sizePath = '400x300';
      } else {
        sizePath = '800x600';
      }
      
      // The extension creates files in: recipes/resized/filename_size.webp
      const resizedPath = `recipes/resized/${filename.replace(/\.(jpg|jpeg|png)$/i, '')}_${sizePath}.webp`;
      
      console.log('ImageService: Trying resized WebP version:', resizedPath);
      
      // Create a reference to the resized image
      const imageRef = ref(storage, resizedPath);
      
      // Get download URL with timeout
      const url = await Promise.race([
        getDownloadURL(imageRef),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);
      
      console.log('ImageService: Success! Resized WebP URL:', url);
      
      // Cache the result
      imageCache.set(cacheKey, url);
      
      return url;
      
    } catch (error) {
      console.log('ImageService: Resized version not found, trying original');
      
      try {
        // Fallback to original format
        const filename = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;
        const imageRef = ref(storage, `recipes/${filename}`);
        
        const url = await Promise.race([
          getDownloadURL(imageRef),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        
        console.log('ImageService: Success! Original URL:', url);
        
        // Cache the result
        imageCache.set(cacheKey, url);
        
        return url;
        
      } catch (fallbackError) {
        console.error('ImageService: Error getting image URL:', fallbackError);
        
        // Final fallback to hardcoded URL
        const filename = imagePath.includes('/') ? imagePath.split('/').pop() : imagePath;
        const fallbackUrl = `https://firebasestorage.googleapis.com/v0/b/smartchef-app-c4b56.firebasestorage.app/o/recipes%2F${encodeURIComponent(filename)}?alt=media&token=6e63aebc-a87e-4855-b05b-660a2dd2bb1c`;
        
        console.log('ImageService: Using fallback URL:', fallbackUrl);
        
        // Cache the fallback
        imageCache.set(cacheKey, fallbackUrl);
        
        return fallbackUrl;
      }
    }
  }

  static async getThumbnailUrl(imagePath) {
    console.log('ImageService: Getting thumbnail for:', imagePath);
    return this.getOptimizedImageUrl(imagePath, {
      width: 200,
      height: 200,
      quality: 70,
      format: 'webp'
    });
  }

  static async getCardImageUrl(imagePath) {
    console.log('ImageService: Getting card image for:', imagePath);
    return this.getOptimizedImageUrl(imagePath, {
      width: 400,
      height: 300,
      quality: 80,
      format: 'webp'
    });
  }

  static async getFullImageUrl(imagePath) {
    console.log('ImageService: Getting full image for:', imagePath);
    return this.getOptimizedImageUrl(imagePath, {
      width: 800,
      height: 600,
      quality: 90,
      format: 'webp'
    });
  }

  // Clear cache if needed
  static clearCache() {
    imageCache.clear();
  }
}