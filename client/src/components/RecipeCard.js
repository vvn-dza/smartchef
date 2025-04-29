import { useState, useEffect, useCallback } from 'react';
import { useRecipes } from '../context/RecipesContext';
import { useToast } from '../context/ToastContext';
import { FiClock, FiBookmark } from 'react-icons/fi';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

export default function RecipeCard({ recipe }) {
  const { 
    toggleSavedRecipe, 
    savedRecipes, 
    setSelectedRecipe, 
    user, 
    saving
  } = useRecipes();
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const isSaved = savedRecipes.some(r => r.id === recipe.id);

  const loadImage = useCallback(async () => {
    if (!recipe.imagePath) {
      setImageUrl('/placeholder-food.jpg');
      setImageLoading(false);
      return;
    }

    try {
      const storage = getStorage();
      const imageRef = ref(storage, recipe.imagePath);
      const url = await getDownloadURL(imageRef);

      const img = new Image();
      img.src = url;
      img.onload = () => {
        setImageUrl(url);
        setImageLoading(false);
        setImageError(false);
      };
      img.onerror = () => {
        setImageUrl('/placeholder-food.jpg');
        setImageLoading(false);
        setImageError(true);
      };
    } catch (error) {
      console.error('Error loading image:', error);
      setImageUrl('/placeholder-food.jpg');
      setImageLoading(false);
      setImageError(true);
    }
  }, [recipe.imagePath]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

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

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all cursor-pointer h-[22rem] flex flex-col"
      onClick={() => setSelectedRecipe(recipe)}
    >
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
        {imageLoading ? (
          <div className="w-full h-full bg-gray-200 animate-pulse"></div>
        ) : (
          <img 
            src={imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            onError={() => {
              setImageUrl('/placeholder-food.jpg');
              setImageError(true);
            }}
          />
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold line-clamp-2 mb-2 min-h-[3rem]">
          {recipe.title}
        </h3>

        {recipe.ingredients?.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Contains:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {recipe.ingredients.slice(0, 3).map((ing, index) => (
                <li key={index} className="line-clamp-1">
                  {typeof ing === 'string' ? ing : ing.original || ing.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-between items-center mt-auto">
          <span className="flex items-center text-sm text-gray-600">
            <FiClock className="mr-1" /> {formatPrepTime(recipe.prepTime)}
          </span>

          <button
            onClick={handleSaveClick}
            disabled={saving}
            className={`transition-colors ${
              isSaved ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isSaved ? "Remove from saved" : "Save recipe"}
          >
            <FiBookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </div>
  );
}

