import { useState, useRef, useEffect } from 'react';
import { FiSearch, FiCamera, FiUpload, FiArrowLeft, FiClock, FiUsers, FiStar, FiYoutube, FiSave, FiShare2, FiImage, FiZap } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useRecipes } from '../context/RecipesContext';
import AIRecipeCard from '../components/AIRecipeCard';

console.log("API Key loaded:", !!process.env.REACT_APP_GEMINI_API_KEY);
console.log("API Key length:", process.env.REACT_APP_GEMINI_API_KEY?.length);
console.log("YouTube API Key:", process.env.REACT_APP_YOUTUBE_API_KEY ? 'Present' : 'Missing');
console.log("YouTube API Key length:", process.env.REACT_APP_YOUTUBE_API_KEY?.length);

// Helper to test if an image URL is valid and loads
const testImageUrl = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

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
  const [showRecipeCard, setShowRecipeCard] = useState(false);
  const location = useLocation();
  const triggeredByUrl = useRef(false);

  // 1. When the URL changes, set searchText if there's a query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('query');
    if (urlQuery && urlQuery !== searchText) {
      setSearchText(urlQuery);
      triggeredByUrl.current = true;
    }
    // eslint-disable-next-line
  }, [location.search]);

  // 2. When searchText changes (from URL), trigger the search
  useEffect(() => {
    if (triggeredByUrl.current && searchText) {
      generateRecipe();
      triggeredByUrl.current = false;
    }
    // eslint-disable-next-line
  }, [searchText]);

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

  const fetchRecipeImage = async (recipeTitle, cuisine = null) => {
    try {
      console.log('Fetching image for:', recipeTitle);
      // Use backend proxy endpoint
      let url = `http://localhost:5000/api/spoonacular/recipe-image?query=${encodeURIComponent(recipeTitle)}`;
      if (cuisine) {
        url += `&cuisine=${encodeURIComponent(cuisine)}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Spoonacular API error:', response.status);
        return null;
      }
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const imageUrl = data.results[0].image;
        if (await testImageUrl(imageUrl)) {
          return imageUrl;
        }
      }
      // Fallback: try random food image
      const randomResponse = await fetch('http://localhost:5000/api/spoonacular/recipe-image?query=food');
      const randomData = await randomResponse.json();
      if (randomData.results && randomData.results.length > 0) {
        return randomData.results[0].image;
      }
      return null;
    } catch (error) {
      console.error('Error fetching recipe image:', error);
      return null;
    }
  };

  const generateRecipe = async () => {
    if (!searchText.trim() && !imagePreview) {
      showToast("Please enter search text or upload an image", "warning");
      return;
    }

    setLoading(true);
    setRecipeDetails(null);

    try {
      const response = await fetch('http://localhost:5000/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchText: searchText.trim(),
          imageData: imagePreview ? imagePreview.split(',')[1] : null
        })
      });

      if (!response.ok) throw new Error('Failed to generate recipe');
      const recipe = await response.json();
      setRecipeDetails(recipe);
      setShowRecipeCard(true);
      showToast("Recipe generated successfully!", "success");
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
      console.error('Error saving recipe:', error);
      showToast('Failed to save recipe', 'error');
    }
  };

  const isSaved = savedRecipes.some(r => r.id === recipeDetails?.id);

  return (
    <div className="min-h-screen bg-[#11221c] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between gap-3 p-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4">
                <FiZap className="w-4 h-4 text-[#0b9766]" />
              </div>
              <h1 className="text-white text-3xl font-bold leading-tight tracking-[-0.015em]">
                Generate Recipes with AI
              </h1>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex max-w-2xl flex-wrap items-end gap-4 px-4 py-3 mb-6">
          <label className="flex flex-col min-w-40 flex-1">
            <textarea
              placeholder="Enter your recipe prompt here"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-0 border border-[#326755] bg-[#19342a] focus:border-[#0b9766] min-h-36 placeholder:text-[#91cab6] p-[15px] text-base font-normal leading-normal"
            />
          </label>
        </div>

        {/* Upload Image Button */}
        <div className="flex px-4 py-3 justify-start mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#23483b] text-white gap-2 pl-4 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#326755] transition-colors"
          >
            <FiImage className="w-5 h-5" />
            <span className="truncate">Upload Image</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="px-4 py-3 mb-6">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border border-[#326755]"
              />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex px-4 py-3 justify-start mb-8">
          <button
            onClick={generateRecipe}
            disabled={loading}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-[#0b9766] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </div>
            ) : (
              <span>Generate Recipes</span>
            )}
          </button>
        </div>

        {/* Generated Recipe Card */}
        {showRecipeCard && recipeDetails && (
          <AIRecipeCard 
            recipe={recipeDetails} 
            onClose={() => setShowRecipeCard(false)} 
          />
        )}

        {/* Simple Recipe Preview (optional) */}
        {recipeDetails && !showRecipeCard && (
          <div className="mt-8 p-4">
            <div className="bg-[#19342a] rounded-lg p-6 border border-[#326755]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-xl font-bold">{recipeDetails.title}</h3>
                <button
                  onClick={() => setShowRecipeCard(true)}
                  className="px-4 py-2 bg-[#0b9766] text-white rounded-lg hover:bg-[#059669] transition-colors"
                >
                  View Full Recipe
                </button>
              </div>
              <p className="text-[#91cab6]">{recipeDetails.description}</p>
            </div>
          </div>
        )}

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mt-8 p-4">
            <h3 className="text-white text-lg font-bold mb-4">Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setSearchText(search)}
                  className="px-3 py-1 bg-[#23483b] text-[#91cab6] rounded-full text-sm hover:bg-[#326755] transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}