import { useState, useRef } from 'react';
import { FiSearch, FiCamera, FiUpload, FiArrowLeft, FiClock, FiUsers, FiStar, FiYoutube, FiSave, FiShare2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useRecipes } from '../context/RecipesContext';
import { GoogleGenAI } from '@google/genai';

console.log("API Key loaded:", !!process.env.REACT_APP_GEMINI_API_KEY);
console.log("API Key length:", process.env.REACT_APP_GEMINI_API_KEY?.length);

export default function AISearch() {
  const [searchText, setSearchText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { toggleSavedRecipe, savedRecipes, user } = useRecipes();

  const ai = new GoogleGenAI({
    apiKey: process.env.REACT_APP_GEMINI_API_KEY
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhoto = () => {
    fileInputRef.current.click();
  };

  const generateRecipe = async () => {
    if (!searchText.trim() && !imagePreview) {
      showToast("Please enter search text or upload an image", "warning");
      return;
    }

    setLoading(true);
    setRecipeDetails(null);

    try {
      let prompt = "";
      let contents = [];

      if (imagePreview) {
        prompt = `Analyze this food image and provide a detailed recipe that matches what you see.

If you can identify the dish, provide an authentic recipe for it.
If you cannot identify a specific dish, suggest a recipe that could be made with the ingredients visible in the image.

Format your response as a JSON object like this:
{
  "title": "Recipe Name",
  "description": "Brief description of the dish",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "10 mins",
  "cookTime": "20 mins",
  "servings": "4",
  "nutrition": {
    "calories": "300",
    "protein": "15g",
    "carbs": "25g",
    "fat": "10g"
  },
  "difficulty": "Easy",
  "cuisine": "Italian",
  "imageUrl": "https://example.com/food-image.jpg"
}

Make sure to provide a practical recipe that someone could actually cook.`;
        
        const base64Data = imagePreview.split(',')[1];
        contents = [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }
        ];
      } else {
        prompt = `Create a detailed recipe for "${searchText}". 

Format your response as a JSON object like this:
{
  "title": "Recipe Name",
  "description": "Brief description",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "prepTime": "10 mins",
  "cookTime": "20 mins",
  "servings": "4",
  "nutrition": {
    "calories": "300",
    "protein": "15g",
    "carbs": "25g",
    "fat": "10g"
  },
  "difficulty": "Easy",
  "cuisine": "Italian",
  "imageUrl": "https://example.com/food-image.jpg"
}`;

        contents = [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ];
      }

      console.log("Sending prompt:", prompt);
      console.log("Image preview exists:", !!imagePreview);

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: contents,
      });

      const text = response.text;
      console.log("Raw response:", text);
      
      let recipe = null;
      
      try {
        recipe = JSON.parse(text.trim());
      } catch (e1) {
        console.log("Direct parse failed, trying to extract JSON...");
        console.log("Parse error:", e1);
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            recipe = JSON.parse(jsonMatch[0]);
            console.log("JSON extraction successful");
          } catch (e2) {
            console.log("JSON extraction failed:", e2);
          }
        } else {
          console.log("No JSON found in response");
        }
      }
      
      if (recipe && recipe.title) {
        // Add search to history
        if (searchText.trim()) {
          setSearchHistory(prev => [searchText.trim(), ...prev.filter(item => item !== searchText.trim())].slice(0, 5));
        }
        
        setRecipeDetails(recipe);
        showToast("Recipe generated successfully!", "success");
      } else {
        throw new Error("Invalid recipe format");
      }

    } catch (error) {
      console.error("Error generating recipe:", error);
      showToast("Failed to generate recipe. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!user) {
      showToast('Please login to save recipes', 'error');
      return;
    }
    
    try {
      // Create a recipe object compatible with your existing system
      const recipeToSave = {
        id: `ai-${Date.now()}`,
        title: recipeDetails.title,
        description: recipeDetails.description,
        ingredients: recipeDetails.ingredients,
        instructions: recipeDetails.instructions,
        prepTime: parseInt(recipeDetails.prepTime) || 30,
        servings: parseInt(recipeDetails.servings) || 4,
        cuisine: [recipeDetails.cuisine],
        imagePath: recipeDetails.imageUrl || '/placeholder-food.jpg',
        isAIGenerated: true,
        aiData: recipeDetails
      };
      
      await toggleSavedRecipe(recipeToSave.id);
      showToast('Recipe saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save recipe', 'error');
    }
  };

  const isRecipeSaved = savedRecipes.some(r => r.id === `ai-${Date.now()}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center text-gray-600 hover:text-blue-600 mb-4 transition-colors"
          >
            <FiArrowLeft className="mr-2" /> Back to Dashboard
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">AI Recipe Search</h1>
            <p className="text-gray-600">Discover recipes with AI-powered search and image analysis</p>
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setSearchText(search)}
                  className="px-3 py-1 bg-white rounded-full text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          {/* Search Input */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400 text-xl" />
            </div>
            <input
              type="text"
              placeholder="Describe what you want to cook... (e.g., 'spicy chicken pasta', 'vegetarian lasagna')"
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-lg transition-all"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && generateRecipe()}
            />
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="flex flex-col items-center justify-center w-full h-80 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              {imagePreview ? (
                <div className="relative w-full h-full">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setImagePreview(null);
                    }}
                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FiUpload className="w-16 h-16 mb-4 text-gray-400" />
                  <p className="mb-2 text-lg text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">Upload a photo of ingredients or a dish</p>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
            <div className="flex justify-center mt-4">
              <button 
                onClick={handleTakePhoto}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FiCamera className="text-gray-600" />
                <span>Take Photo</span>
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateRecipe}
            disabled={loading || (!searchText && !imagePreview)}
            className={`w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg flex items-center justify-center transition-all ${
              (loading || (!searchText && !imagePreview)) 
                ? 'opacity-75 cursor-not-allowed' 
                : 'hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transform hover:scale-[1.02]'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Recipe...
              </>
            ) : (
              <>
                <FiSearch className="mr-2" />
                Generate Recipe
              </>
            )}
          </button>
        </div>

        {/* Recipe Results */}
        {recipeDetails && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Recipe Header */}
            <div className="relative">
              <img 
                src={recipeDetails.imageUrl || '/placeholder-food.jpg'} 
                alt={recipeDetails.title}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-food.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-4xl font-bold mb-2">{recipeDetails.title}</h2>
                    <p className="text-xl opacity-90">{recipeDetails.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveRecipe}
                      className={`p-3 rounded-full transition-colors ${
                        isRecipeSaved 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-white/20 hover:bg-white/30'
                      }`}
                    >
                      <FiSave className={isRecipeSaved ? 'fill-current' : ''} />
                    </button>
                    <button className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                      <FiShare2 />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipe Content */}
            <div className="p-8">
              {/* Metadata */}
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center text-gray-600">
                  <FiClock className="mr-2" />
                  <span className="font-medium">Prep:</span> {recipeDetails.prepTime}
                </div>
                <div className="flex items-center text-gray-600">
                  <FiClock className="mr-2" />
                  <span className="font-medium">Cook:</span> {recipeDetails.cookTime}
                </div>
                <div className="flex items-center text-gray-600">
                  <FiUsers className="mr-2" />
                  <span className="font-medium">Servings:</span> {recipeDetails.servings}
                </div>
                {recipeDetails.difficulty && (
                  <div className="flex items-center text-gray-600">
                    <FiStar className="mr-2" />
                    <span className="font-medium">Difficulty:</span> {recipeDetails.difficulty}
                  </div>
                )}
                {recipeDetails.cuisine && (
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium">Cuisine:</span> {recipeDetails.cuisine}
                  </div>
                )}
              </div>

              {/* Nutrition */}
              {recipeDetails.nutrition && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-4">Nutrition</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                      <p className="text-sm text-blue-600 font-medium">Calories</p>
                      <p className="text-2xl font-bold text-blue-800">{recipeDetails.nutrition.calories}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl text-center">
                      <p className="text-sm text-green-600 font-medium">Protein</p>
                      <p className="text-2xl font-bold text-green-800">{recipeDetails.nutrition.protein}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-xl text-center">
                      <p className="text-sm text-yellow-600 font-medium">Carbs</p>
                      <p className="text-2xl font-bold text-yellow-800">{recipeDetails.nutrition.carbs}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl text-center">
                      <p className="text-sm text-red-600 font-medium">Fat</p>
                      <p className="text-2xl font-bold text-red-800">{recipeDetails.nutrition.fat}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ingredients and Instructions */}
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Ingredients</h3>
                  <ul className="space-y-3">
                    {recipeDetails.ingredients.map((ingredient, i) => (
                      <li key={i} className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-4">Instructions</h3>
                  <ol className="space-y-4">
                    {recipeDetails.instructions.map((step, i) => (
                      <li key={i} className="flex p-4 bg-gray-50 rounded-lg">
                        <span className="font-bold text-blue-600 mr-4 text-xl min-w-[2rem]">{i + 1}</span>
                        <span className="text-gray-700 leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* YouTube Videos */}
              {recipeDetails.youtubeVideos && recipeDetails.youtubeVideos.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-4 flex items-center">
                    <FiYoutube className="mr-2 text-red-500" />
                    Video Guides
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {recipeDetails.youtubeVideos.map((video, index) => (
                      <a
                        key={index}
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-shrink-0 relative">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-32 h-20 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-red-500 text-white p-2 rounded-full">
                              <FiYoutube className="text-lg" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium line-clamp-2 text-gray-800">{video.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">Watch on YouTube</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Generated Badge */}
              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
                <p className="text-sm text-gray-600">
                  🤖 This recipe was generated by AI for your convenience
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}