import { useState, useEffect } from 'react';
import { useRecipes } from '../context/RecipesContext';
import { useToast } from '../context/ToastContext';
import { FiClock, FiBookmark, FiStar, FiUsers, FiZap } from 'react-icons/fi';

export default function RecipeCard({ recipe }) {
  const { toggleSavedRecipe, savedRecipes, setSelectedRecipe, user, saving } = useRecipes();
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(true);

  // Move guard clause AFTER all hooks
  const isSaved = savedRecipes.some(r => r.id === recipe?.id);
  const isAIGenerated = recipe?.isAIGenerated || recipe?.aiData;

  useEffect(() => {
    // Early return inside useEffect if no recipe
    if (!recipe) return;

    const getImageUrl = () => {
      // If it's an AI-generated recipe with direct image URL
      if (isAIGenerated && recipe.aiData?.imageUrl) {
        return recipe.aiData.imageUrl;
      }
      
      // For database recipes
      if (recipe.imagePath) {
        const filename = recipe.imagePath.includes('/') ? recipe.imagePath.split('/').pop() : recipe.imagePath;
        return `https://firebasestorage.googleapis.com/v0/b/smartchef-app-c4b56.firebasestorage.app/o/recipes%2F${encodeURIComponent(filename)}?alt=media&token=6e63aebc-a87e-4855-b05b-660a2dd2bb1c`;
      }
      
      return '/placeholder-food.jpg';
    };

    const loadImage = () => {
      const url = getImageUrl();
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setImageUrl(url);
        setImageLoading(false);
      };
      img.onerror = () => {
        setImageUrl('/placeholder-food.jpg');
        setImageLoading(false);
      };
    };

    loadImage();
  }, [recipe, isAIGenerated]);

  // Guard clause AFTER all hooks
  if (!recipe) return null;

  const formatPrepTime = (minutes) => {
    if (!minutes) return '--';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
    return `${minutes}m`;
  };

  const handleSaveClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      showToast('Please login to save recipes', 'error');
      return;
    }
    try {
      await toggleSavedRecipe(recipe.id);
      showToast(
        isSaved ? 'Recipe removed' : 'Recipe saved!',
        isSaved ? 'info' : 'success'
      );
    } catch (err) {
      showToast('Failed to save recipe', 'error');
    }
  };

  // Get recipe data (AI or database) - Fixed data extraction
  const getRecipeData = () => {
    if (isAIGenerated && recipe.aiData) {
      return {
        title: recipe.aiData.title || recipe.title || 'Untitled Recipe',
        ingredients: recipe.aiData.ingredients || recipe.ingredients || [],
        prepTime: recipe.aiData.prepTime || recipe.prepTime || 30,
        servings: recipe.aiData.servings || recipe.servings || 4,
        difficulty: recipe.aiData.difficulty,
        cuisine: recipe.aiData.cuisine
      };
    }
    return {
      title: recipe.title || 'Untitled Recipe',
      ingredients: recipe.ingredients || [],
      prepTime: recipe.prepTime || 30,
      servings: recipe.servings || 4,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine
    };
  };

  const recipeData = getRecipeData();

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden group relative"
      onClick={() => setSelectedRecipe(recipe)}
    >
      {/* AI Badge */}
      {isAIGenerated && (
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
          <FiZap className="w-3 h-3" />
          AI
        </div>
      )}

      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        {imageLoading ? (
          <div className="w-full h-full bg-gray-200 animate-pulse"></div>
        ) : (
          <img
            src={imageUrl}
            alt={recipeData.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-food.jpg';
            }}
          />
        )}
        
        {/* Save Button */}
        <button
          onClick={handleSaveClick}
          disabled={saving}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isSaved 
              ? 'bg-red-500 text-white shadow-lg' 
              : 'bg-white/80 text-gray-600 hover:bg-white hover:shadow-lg'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={isSaved ? "Remove from saved" : "Save recipe"}
        >
          <FiBookmark className={isSaved ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col h-40">
        {/* Recipe Title - Bold and modern */}
        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 leading-tight">
          {recipeData.title}
        </h3>

        {/* Ingredients */}
        {recipeData.ingredients && recipeData.ingredients.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Contains:</h4>
            <ul className="space-y-0.5">
              {recipeData.ingredients.slice(0, 2).map((ing, index) => (
                <li key={index} className="text-xs text-gray-600 truncate">
                  {typeof ing === 'string' ? ing : ing.original || ing.name || 'Unknown ingredient'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags for AI recipes */}
        {isAIGenerated && (recipeData.difficulty || recipeData.cuisine) && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipeData.difficulty && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                <FiStar className="w-2 h-2 mr-1" />
                {recipeData.difficulty}
              </span>
            )}
            {recipeData.cuisine && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                {recipeData.cuisine}
              </span>
            )}
          </div>
        )}

        {/* Metadata - Bottom aligned */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center text-xs text-gray-600 font-medium">
              <FiClock className="w-3 h-3 mr-1" /> 
              {formatPrepTime(recipeData.prepTime)}
            </span>
            {recipeData.servings && (
              <span className="flex items-center text-xs text-gray-600 font-medium">
                <FiUsers className="w-3 h-3 mr-1" /> 
                {recipeData.servings}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}