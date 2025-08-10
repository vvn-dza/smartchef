// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Debug environment variables
console.log("=== Environment Variables Debug ===");
console.log("GEMINI_API_KEY loaded:", !!process.env.GEMINI_API_KEY);
console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length);
console.log("GEMINI_API_KEY first 10 chars:", process.env.GEMINI_API_KEY?.substring(0, 10));
console.log("YOUTUBE_API_KEY loaded:", !!process.env.YOUTUBE_API_KEY);
console.log("YOUTUBE_API_KEY length:", process.env.YOUTUBE_API_KEY?.length);
console.log("YOUTUBE_API_KEY first 10 chars:", process.env.YOUTUBE_API_KEY?.substring(0, 10));
console.log("FIREBASE_PROJECT_ID loaded:", !!process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_CLIENT_EMAIL loaded:", !!process.env.FIREBASE_CLIENT_EMAIL);
console.log("FIREBASE_PRIVATE_KEY loaded:", !!process.env.FIREBASE_PRIVATE_KEY);
console.log("All env vars:", Object.keys(process.env).filter(key => key.includes('GEMINI') || key.includes('YOUTUBE') || key.includes('FIREBASE')));
console.log("================================");

// Initialize Firebase Admin
const { db: firestoreDb } = require('./config/firebaseAdmin');

// Test Firebase connection
console.log("Testing Firebase connection...");
firestoreDb.collection('test').doc('test').get()
  .then(() => {
    console.log("✅ Firebase connection successful!");
  })
  .catch((error) => {
    console.error("❌ Firebase connection failed:", error);
  });

// Initialize Gemini with server-side API key
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables!");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // For image data

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    geminiKey: !!process.env.GEMINI_API_KEY
  });
});

// Proxy endpoint for recipe generation
app.post('/api/generate-recipe', async (req, res) => {
  try {
    const { searchText, imageData } = req.body;
    
    // Validate input
    if (!searchText && !imageData) {
      return res.status(400).json({ error: 'Search text or image is required' });
    }

    console.log("🔍 Generating recipe for:", searchText || "image upload");

    // Choose the right model
    const modelName = imageData ? "gemini-2.0-pro-vision" : "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({ model: modelName });
    
    let prompt = "";
    let imageParts = [];

    if (imageData) {
      prompt = `Analyze this food image and provide a detailed recipe.`;
      imageParts.push({
        inlineData: {
          data: imageData,
          mimeType: "image/jpeg"
        }
      });
    } else {
      prompt = `Provide a detailed recipe for: "${searchText}"`;
    }

    prompt += `\n\nProvide the response in this exact JSON format:
    {
      "title": "Recipe name",
      "description": "Brief description",
      "ingredients": ["list of ingredients"],
      "instructions": ["step by step instructions"],
      "prepTime": "X mins",
      "cookTime": "Y mins",
      "servings": "Z",
      "nutrition": {
        "calories": "calories",
        "protein": "protein",
        "carbs": "carbs",
        "fat": "fat"
      },
      "difficulty": "Easy/Medium/Hard",
      "cuisine": "cuisine type"
    }`;

    console.log(" Calling Gemini API with model:", modelName);

    // Call Gemini API
    const contentParts = imageData ? [prompt, ...imageParts] : [prompt];
    const result = await model.generateContent(contentParts);
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ Received response from Gemini");
    
    // Clean Gemini response: remove Markdown code block if present
    let cleanText = text.trim();
    // Remove triple backticks and optional 'json' after them
    cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    // Try to extract JSON object if still not valid
    let recipe;
    try {
      recipe = JSON.parse(cleanText);
      console.log("✅ Successfully parsed recipe JSON");
    } catch (e) {
      console.log("⚠️ Failed to parse JSON, trying to extract...");
      // Try to extract JSON from within the text
      const match = cleanText.match(/\{[\s\S]*\}/);
      if (match) {
        recipe = JSON.parse(match[0]);
        console.log("✅ Successfully extracted and parsed recipe JSON");
      } else {
        throw e;
      }
    }
    
    // Generate image for text-based recipes using Spoonacular
    if (!imageData && recipe.title && process.env.SPOONACULAR_API_KEY) {
      try {
        console.log(" Fetching image for recipe:", recipe.title);
        console.log("Spoonacular API Key present:", !!process.env.SPOONACULAR_API_KEY);
        
        // Use Spoonacular to get a food image
        const imageUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${process.env.SPOONACULAR_API_KEY}&query=${encodeURIComponent(recipe.title)}&number=1&addRecipeInformation=false`;
        console.log("Spoonacular URL:", imageUrl.replace(process.env.SPOONACULAR_API_KEY, 'API_KEY_HIDDEN'));
        
        const imageResponse = await axios.get(imageUrl);
        console.log("Spoonacular response status:", imageResponse.status);
        console.log("Spoonacular response data:", imageResponse.data);
        
        if (imageResponse.data.results && imageResponse.data.results.length > 0) {
          recipe.imageUrl = imageResponse.data.results[0].image;
          console.log("✅ Generated image URL from Spoonacular:", recipe.imageUrl);
        } else {
          console.log("⚠️ No image found in Spoonacular for:", recipe.title);
        }
      } catch (imageError) {
        console.log("⚠️ Image generation failed:", imageError.message);
        if (imageError.response) {
          console.log("Spoonacular error response:", imageError.response.status, imageError.response.data);
        }
        // Continue without image
      }
    } else {
      console.log("Image generation skipped:", {
        hasImageData: !!imageData,
        hasTitle: !!recipe.title,
        hasSpoonacularKey: !!process.env.SPOONACULAR_API_KEY
      });
    }
    
    // Send formatted response to frontend
    res.json(recipe);
    
  } catch (error) {
    console.error("❌ Server error:", error);
    if (error && error.stack) {
      console.error("Error stack:", error.stack);
    }
    
    // Provide user-friendly error messages
    if (error.message.includes('API key')) {
      res.status(500).json({ error: "API configuration error" });
    } else if (error.message.includes('JSON')) {
      res.status(500).json({ error: "Invalid recipe format received" });
    } else {
      res.status(500).json({ error: "Failed to generate recipe" });
    }
  }
});

// Store AI recipe temporarily
app.post('/api/store-ai-recipe', async (req, res) => {
  try {
    const { recipe, userId } = req.body;
    
    console.log('Storing AI recipe:', { recipe: recipe.title, userId });
    
    if (!recipe || !userId) {
      return res.status(400).json({ error: 'Recipe and userId are required' });
    }

    // Create a complete AI recipe document
    const aiRecipeData = {
      ...recipe,
      isAIGenerated: true,
      aiData: recipe,
      createdAt: new Date().toISOString(),
      userId: userId,
      temporary: true, // Mark as temporary
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire in 24 hours
      // Store all recipe data
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      nutrition: recipe.nutrition,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine,
      imageUrl: recipe.imageUrl
    };

    // Store in Firestore
    const recipeRef = firestoreDb.collection('aiRecipes').doc();
    await recipeRef.set(aiRecipeData);

    console.log('AI recipe stored successfully:', recipeRef.id);

    res.json({ 
      success: true, 
      recipeId: recipeRef.id,
      message: 'AI recipe stored temporarily'
    });
  } catch (error) {
    console.error('Error storing AI recipe:', error);
    res.status(500).json({ error: 'Failed to store AI recipe', details: error.message });
  }
});

// Get AI recipe by ID
app.get('/api/ai-recipe/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const recipeDoc = await firestoreDb.collection('aiRecipes').doc(id).get();
    
    if (!recipeDoc.exists) {
      return res.status(404).json({ error: 'AI recipe not found' });
    }

    const recipeData = recipeDoc.data();
    
    // Check if expired
    if (recipeData.expiresAt && new Date(recipeData.expiresAt.toDate()) < new Date()) {
      // Delete expired recipe
      await firestoreDb.collection('aiRecipes').doc(id).delete();
      return res.status(404).json({ error: 'AI recipe has expired' });
    }

    res.json({ id: recipeDoc.id, ...recipeData });
  } catch (error) {
    console.error('Error fetching AI recipe:', error);
    res.status(500).json({ error: 'Failed to fetch AI recipe' });
  }
});

// Add your existing routes
const recipeRoutes = require('./routes/recipeRoutes');
app.use('/api/recipes', recipeRoutes);

const { getIngredientCategories, getFilterCategories } = require('./controllers/recipeController');
app.get('/api/ingredient-categories', getIngredientCategories);
app.get('/api/filter-categories', getFilterCategories);

const authenticateFirebaseToken = require('./middleware/authenticateFirebaseToken');
app.use('/api/recipes/users', authenticateFirebaseToken);

const activityRoutes = require('./routes/activityRoutes');
app.use('/api/activity', activityRoutes);

// Spoonacular proxy endpoints
app.get('/api/spoonacular/recipe-image', async (req, res) => {
  try {
    const { query, cuisine } = req.query;
    const apiKey = process.env.SPOONACULAR_API_KEY;
    let url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}&query=${encodeURIComponent(query)}&number=1&addRecipeInformation=false`;
    if (cuisine) {
      url += `&cuisine=${encodeURIComponent(cuisine)}`;
    }
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recipe image', details: error.message });
  }
});

app.get('/api/spoonacular/trivia', async (req, res) => {
  try {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    const url = `https://api.spoonacular.com/food/trivia/random?apiKey=${apiKey}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trivia', details: error.message });
  }
});

app.get('/api/spoonacular/seasonal-ingredient', async (req, res) => {
  try {
    const { query } = req.query;
    const apiKey = process.env.SPOONACULAR_API_KEY;
    const url = `https://api.spoonacular.com/food/ingredients/search?apiKey=${apiKey}&query=${encodeURIComponent(query)}&number=1`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch seasonal ingredient', details: error.message });
  }
});

// YouTube proxy endpoint - FIXED: Better error handling
app.get('/api/youtube/search', async (req, res) => {
  try {
    const { q } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    console.log("🎥 YouTube search request:", { query: q, hasApiKey: !!apiKey });
    
    if (!apiKey) {
      console.warn('❌ YouTube API key not configured');
      return res.json({ items: [] });
    }
    
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=3&key=${apiKey}`;
    console.log(" YouTube API URL:", url.replace(apiKey, 'API_KEY_HIDDEN'));
    
    const response = await axios.get(url);
    
    if (response.data && response.data.items) {
      console.log("✅ YouTube API response:", { itemCount: response.data.items.length });
      res.json(response.data);
    } else {
      console.warn('⚠️ No YouTube videos found for query:', q);
      res.json({ items: [] });
    }
  } catch (error) {
    console.error('❌ YouTube API error:', error.message);
    if (error.response) {
      console.error('YouTube API response error:', error.response.status, error.response.data);
    }
    // Return empty results instead of 500 error
    res.json({ items: [] });
  }
});

// Test route
app.get('/', (req, res) => {
  res.send('SmartChef Server is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
