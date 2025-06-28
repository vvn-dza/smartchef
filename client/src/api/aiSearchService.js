import { useState, useRef } from 'react';
import { FiSearch, FiCamera, FiUpload, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function AISearch() {
  const [searchText, setSearchText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

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
      const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
      
      let prompt = "Generate a detailed recipe ";
      let imageParts = [];

      if (imagePreview) {
        prompt += "based on this food image:";
        // Convert base64 image to Gemini-compatible format
        const base64Data = imagePreview.split(',')[1];
        imageParts.push({
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        });
      } else {
        prompt += `for: ${searchText}`;
      }

      prompt += `
      Provide the response in this exact JSON format:
      {
        "title": "Recipe name",
        "description": "Brief description",
        "ingredients": ["list", "of", "ingredients"],
        "instructions": ["step", "by", "step", "instructions"],
        "prepTime": "X mins",
        "cookTime": "Y mins",
        "servings": "Z",
        "nutrition": {
          "calories": "A",
          "protein": "B",
          "carbs": "C",
          "fat": "D"
        }
      }`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      const recipe = JSON.parse(text.trim());
      setRecipeDetails(recipe);
      showToast("Recipe generated successfully!", "success");

    } catch (error) {
      console.error("Error generating recipe:", error);
      showToast("Failed to generate recipe. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/dashboard')} 
        className="flex items-center text-gray-600 hover:text-blue-600 mb-6"
      >
        <FiArrowLeft className="mr-2" /> Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">AI Recipe Search</h1>

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Describe what you want to cook..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && generateRecipe()}
        />
      </div>

      {/* Image Upload */}
      <div className="mb-6">
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FiUpload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">Upload a photo of ingredients or a dish</p>
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
        <div className="flex justify-center mt-2">
          <button 
            onClick={handleTakePhoto}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
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
        className={`w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center ${
          (loading || (!searchText && !imagePreview)) ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          'Generate Recipe'
        )}
      </button>

      {/* Recipe Results */}
      {recipeDetails && (
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">{recipeDetails.title}</h2>
            <p className="text-gray-600 mb-4">{recipeDetails.description}</p>
            
            <div className="flex gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <span className="font-medium">Prep:</span> {recipeDetails.prepTime}
              </div>
              <div className="flex items-center text-gray-600">
                <span className="font-medium">Cook:</span> {recipeDetails.cookTime}
              </div>
              <div className="flex items-center text-gray-600">
                <span className="font-medium">Servings:</span> {recipeDetails.servings}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {recipeDetails.ingredients.map((ingredient, i) => (
                    <li key={i} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2"></span>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Instructions</h3>
                <ol className="space-y-3">
                  {recipeDetails.instructions.map((step, i) => (
                    <li key={i} className="flex">
                      <span className="font-bold mr-2">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {recipeDetails.nutrition && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3">Nutrition</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Calories</p>
                    <p className="font-medium">{recipeDetails.nutrition.calories}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Protein</p>
                    <p className="font-medium">{recipeDetails.nutrition.protein}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Carbs</p>
                    <p className="font-medium">{recipeDetails.nutrition.carbs}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Fat</p>
                    <p className="font-medium">{recipeDetails.nutrition.fat}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}