require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    const modelName = imageData ? "gemini-pro-vision" : "gemini-pro";
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
    
    // Parse and validate response
    const recipe = JSON.parse(text.trim());
    
    // Send formatted response to frontend
    res.json(recipe);
    
  } catch (error) {
    console.error("Server error:", error);
    
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

// Test route
app.get('/', (req, res) => {
  res.send('SmartChef Server is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
