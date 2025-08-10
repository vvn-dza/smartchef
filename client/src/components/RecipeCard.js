import { useState, useEffect, useRef } from 'react';
import { useRecipes } from '../context/RecipesContext';
import { useToast } from '../context/ToastContext';
import { FiClock, FiBookmark, FiStar, FiUsers, FiZap } from 'react-icons/fi';
import { ImageService } from '../services/imageService';
import LoadingSpinner from './LoadingSpinner';

export default function RecipeCard({ recipe }) {
  const { toggleSavedRecipe, savedRecipes, setSelectedRecipe, user, saving } = useRecipes();
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const imageLoadTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const isSaved = savedRecipes.some(r => r.id === recipe?.id);
  const isAIGenerated = recipe?.isAIGenerated || recipe?.aiData;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (imageLoadTimeoutRef.current) {
        clearTimeout(imageLoadTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!recipe) return;

    const loadImage = async () => {
      try {
        setImageLoading(true);
        setImageError(false);
        
        // Clear any existing timeout
        if (imageLoadTimeoutRef.current) {
          clearTimeout(imageLoadTimeoutRef.current);
        }

        // Set a timeout for image loading
        imageLoadTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            console.warn('Image load timeout, using fallback');
            setImageUrl('/placeholder-food.jpg');
            setImageLoading(false);
            setImageError(true);
          }
        }, 10000); // 10 second timeout

        if (isAIGenerated && recipe.aiData?.imageUrl) {
          setImageUrl(recipe.aiData.imageUrl);
          setImageLoading(false);
          return;
        }
        
        if (recipe.imagePath) {
          const optimizedUrl = await ImageService.getCardImageUrl(recipe.imagePath);
          
          if (isMountedRef.current) {
            setImageUrl(optimizedUrl);
            setImageLoading(false);
            clearTimeout(imageLoadTimeoutRef.current);
          }
        } else {
          setImageUrl('/placeholder-food.jpg');
          setImageLoading(false);
        }
      } catch (error) {
        console.error('Error loading image:', error);
        if (isMountedRef.current) {
          setImageUrl('/placeholder-food.jpg');
          setImageLoading(false);
          setImageError(true);
          clearTimeout(imageLoadTimeoutRef.current);
        }
      }
    };

    loadImage();
  }, [recipe, isAIGenerated]);

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
      await toggleSavedRecipe(recipe); // Pass the full recipe object
      showToast(
        isSaved ? 'Recipe removed' : 'Recipe saved!',
        isSaved ? 'info' : 'success'
      );
    } catch (err) {
      showToast('Failed to save recipe', 'error');
    }
  };

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
      className="bg-[#19342a] rounded-lg overflow-hidden border border-[#326755] hover:border-[#0b9766] transition-all duration-300 cursor-pointer group"
      onClick={() => setSelectedRecipe(recipe)}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-[#23483b] overflow-hidden">
        {imageLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <LoadingSpinner size="md" text="Loading image..." />
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              console.log('Image failed to load:', imageUrl);
              setImageUrl('/placeholder-food.jpg');
              setImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiZap className="w-12 h-12 text-[#91cab6]" />
          </div>
        )}
        
        {/* AI Badge */}
        {isAIGenerated && (
          <div className="absolute top-2 left-2 bg-[#0b9766] text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <FiZap className="w-3 h-3" />
            AI
          </div>
        )}
        
        {/* Save Button */}
        <button
          onClick={handleSaveClick}
          disabled={saving}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
            isSaved 
              ? 'bg-[#0b9766] text-white' 
              : 'bg-[#23483b] text-[#91cab6] hover:bg-[#0b9766] hover:text-white'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saving ? (
            <LoadingSpinner size="sm" text="" />
          ) : (
            <FiBookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Recipe Title */}
        <h3 className="font-bold text-base sm:text-lg text-white mb-2 line-clamp-2 leading-tight min-h-[2.5rem] sm:min-h-[3.5rem]">
          {recipeData.title}
        </h3>

        {/* Ingredients */}
        {recipeData.ingredients && recipeData.ingredients.length > 0 && (
          <div className="mb-3 flex-1">
            <h4 className="text-xs font-semibold text-[#91cab6] mb-1 uppercase tracking-wide">Contains:</h4>
            <ul className="space-y-0.5">
              {recipeData.ingredients.slice(0, 3).map((ing, index) => (
                <li key={index} className="text-xs text-[#91cab6] truncate">
                  {typeof ing === 'string' ? ing : ing.original || ing.name || 'Unknown ingredient'}
                </li>
              ))}
              {recipeData.ingredients.length > 3 && (
                <li className="text-xs text-[#91cab6]">+{recipeData.ingredients.length - 3} more</li>
              )}
            </ul>
          </div>
        )}

        {/* Tags for AI recipes */}
        {isAIGenerated && (recipeData.difficulty || recipeData.cuisine) && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipeData.difficulty && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-[#0b9766] text-white">
                <FiStar className="w-2 h-2 mr-1" />
                {recipeData.difficulty}
              </span>
            )}
            {recipeData.cuisine && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-[#326755] text-[#91cab6]">
                {recipeData.cuisine}
              </span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center text-xs text-[#91cab6] font-medium">
              <FiClock className="w-3 h-3 mr-1" /> 
              {formatPrepTime(recipeData.prepTime)}
            </span>
            {recipeData.servings && (
              <span className="flex items-center text-xs text-[#91cab6] font-medium">
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