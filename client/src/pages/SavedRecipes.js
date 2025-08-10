import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../context/RecipesContext';
import RecipeCard from '../components/RecipeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  FiBookmark, 
  FiTrash2, 
  FiArrowRight, 
  FiCheck, 
  FiArrowLeft,
  FiX,
  FiFilter,
  FiSearch
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
        selectedRecipes.map(recipeId => {
          const recipe = savedRecipes.find(r => r.id === recipeId);
          return recipe ? toggleSavedRecipe(recipe) : Promise.resolve();
        })
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
      <div className="min-h-screen bg-[#11221c] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verifying your session..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#11221c] text-white">

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Recipe Count */}
        <div className="mb-6">
          <p className="text-[#91cab6] text-sm">
            {savedRecipes.length} {savedRecipes.length === 1 ? 'recipe' : 'recipes'} saved
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-300 p-4 mb-6 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {/* Selection Actions */}
        {isSelectMode && (
          <div className="bg-[#19342a] border border-[#326755] p-4 rounded-lg mb-6 flex items-center justify-between">
            <span className="font-medium text-[#91cab6]">
              {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBulkDelete}
              disabled={selectedRecipes.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
                selectedRecipes.length > 0
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-red-600/50 cursor-not-allowed'
              }`}
            >
              <FiTrash2 size={16} /> Remove
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={`skeleton-${i}`} className="bg-[#19342a] rounded-lg border border-[#326755] h-[22rem] animate-pulse" />
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
                        ? 'bg-[#0b9766] border-[#0b9766] text-white'
                        : 'bg-[#19342a] border-[#326755] hover:border-[#0b9766]'
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
          <div className="bg-[#19342a] rounded-xl p-8 text-center max-w-md mx-auto border border-[#326755]">
            <div className="w-40 h-40 bg-[#23483b] rounded-full flex items-center justify-center mx-auto mb-6">
              <FiBookmark size={48} className="text-[#91cab6]" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              No saved recipes yet
            </h3>
            <p className="text-[#91cab6] mb-6">
              Click the bookmark icon on recipes to save them here
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-[#0b9766] hover:bg-[#059669] text-white font-medium py-2 px-5 rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              Browse Recipes <FiArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}