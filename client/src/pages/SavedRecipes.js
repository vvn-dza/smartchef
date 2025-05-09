import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../context/RecipesContext';
import RecipeCard from '../components/RecipeCard';
import { 
  FiBookmark, 
  FiTrash2, 
  FiArrowRight, 
  FiCheck, 
  FiArrowLeft,
  FiX
} from 'react-icons/fi';
import { auth } from '../firebaseConfig';

export default function SavedRecipes() {
  const {
    savedRecipes = [],
    isLoading,
    error,
    toggleSavedRecipe,
    setSelectedRecipe
  } = useRecipes();

  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
      if (!user) {
        navigate('/login', { state: { from: '/saved' } });
      }
    });
    return unsubscribe;
  }, [navigate]);

  const toggleSelectRecipe = (recipeId) => {
    setSelectedRecipes(prev =>
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedRecipes.map(recipeId => toggleSavedRecipe(recipeId))
      );
      setSelectedRecipes([]);
      setIsSelectMode(false);
    } catch (err) {
      console.error("Failed to remove recipes:", err);
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedRecipes([]);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-4"
        >
          <FiArrowLeft className="mr-2" /> Back to Dashboard
        </button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <FiBookmark className="text-red-500" /> Saved Recipes
            </h1>
            <p className="text-gray-600 mt-1">
              {savedRecipes.length} {savedRecipes.length === 1 ? 'recipe' : 'recipes'} saved
            </p>
          </div>

          {savedRecipes.length > 0 && (
            <button
              onClick={toggleSelectMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isSelectMode 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
            >
              {isSelectMode ? (
                <>
                  <FiX size={16} /> Cancel
                </>
              ) : (
                <>
                  <FiCheck size={16} /> Select
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{error}</p>
        </div>
      )}

      {/* Selection Actions */}
      {isSelectMode && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-center justify-between">
          <span className="font-medium text-blue-800">
            {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={selectedRecipes.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded text-white ${
              selectedRecipes.length > 0
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-red-300 cursor-not-allowed'
            } transition-colors`}
          >
            <FiTrash2 size={16} /> Remove
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-white rounded-lg shadow-md h-[22rem] animate-pulse" />
          ))}
        </div>
      )}

      {/* Saved Recipes Grid */}
      {!isLoading && savedRecipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedRecipes.map((recipe) => (
            <div key={recipe.id} className="relative group">
              {isSelectMode && (
                <div
                  className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 cursor-pointer transition-colors ${
                    selectedRecipes.includes(recipe.id)
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 hover:border-blue-300'
                  }`}
                  onClick={() => toggleSelectRecipe(recipe.id)}
                >
                  {selectedRecipes.includes(recipe.id) && <FiCheck size={14} />}
                </div>
              )}
              <div 
                onClick={() => !isSelectMode && setSelectedRecipe(recipe)}
                className={`transition-transform ${
                  isSelectMode 
                    ? 'cursor-pointer hover:scale-[1.02]' 
                    : 'hover:shadow-lg'
                }`}
              >
                <RecipeCard recipe={recipe} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && savedRecipes.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center max-w-md mx-auto">
          <div className="w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiBookmark size={48} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            No saved recipes yet
          </h3>
          <p className="text-gray-500 mb-6">
            Click the bookmark icon on recipes to save them here
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-5 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            Browse Recipes <FiArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}