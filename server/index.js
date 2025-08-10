const path = require('path');
const fs = require('fs');

// Read .env file manually and remove BOM
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
// Remove BOM if present
const cleanEnvContent = envContent.replace(/^\uFEFF/, '');

// Parse .env content manually
const envVars = {};
cleanEnvContent.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Set environment variables
Object.assign(process.env, envVars);

require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Debug environment variables
console.log("=== Environment Variables Debug ===");
console.log("Current directory:", __dirname);
console.log("Env file path:", path.join(__dirname, '.env'));
console.log("GEMINI_API_KEY loaded:", !!process.env.GEMINI_API_KEY);
console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length);
console.log("GEMINI_API_KEY first 10 chars:", process.env.GEMINI_API_KEY?.substring(0, 10));
console.log("YOUTUBE_API_KEY loaded:", !!process.env.YOUTUBE_API_KEY);
console.log("YOUTUBE_API_KEY length:", process.env.YOUTUBE_API_KEY?.length);
console.log("YOUTUBE_API_KEY first 10 chars:", process.env.YOUTUBE_API_KEY?.substring(0, 10));
console.log("All env vars:", Object.keys(process.env).filter(key => key.includes('GEMINI') || key.includes('YOUTUBE')));
console.log("================================");

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // For image data

// Initialize Gemini with server-side API key
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables!");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
