require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // For image data

// Debug logging
console.log("Server API Key loaded:", !!process.env.GEMINI_API_KEY);
console.log("Server API Key length:", process.env.GEMINI_API_KEY?.length);

// Initialize Gemini with server-side API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Proxy endpoint for recipe generation
app.post('/api/generate-recipe', async (req, res) => {
  try {
    const { searchText, imageData } = req.body;
    
    // Validate input
    if (!searchText && !imageData) {
      return res.status(400).json({ error: 'Search text or image is required' });
    }

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

    // Call Gemini API
    const contentParts = imageData ? [prompt, ...imageParts] : [prompt];
    const result = await model.generateContent(contentParts);
    const response = await result.response;
    const text = response.text();
    
    // Clean Gemini response: remove Markdown code block if present
    let cleanText = text.trim();
    // Remove triple backticks and optional 'json' after them
    cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    // Try to extract JSON object if still not valid
    let recipe;
    try {
      recipe = JSON.parse(cleanText);
    } catch (e) {
      // Try to extract JSON from within the text
      const match = cleanText.match(/\{[\s\S]*\}/);
      if (match) {
        recipe = JSON.parse(match[0]);
      } else {
        throw e;
      }
    }
    
    // Send formatted response to frontend
    res.json(recipe);
    
  } catch (error) {
    console.error("Server error:", error);
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

// YouTube proxy endpoint
app.get('/api/youtube/search', async (req, res) => {
  try {
    const { q } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=3&key=${apiKey}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch YouTube videos', details: error.message });
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
