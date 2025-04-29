import { useRecipes } from '../context/RecipesContext';
import RecipeCard from '../components/RecipeCard';
import RecipeCardSkeleton from '../components/RecipeCardSkeleton';
import IngredientCategoryFilter from '../components/IngredientCategoryFilter';
import { FiFilter, FiArrowRight } from 'react-icons/fi';
import { useState } from 'react';

export default function Dashboard() {
  const { 
    recipes,
    isLoading,
    selectedIngredients,
    setSelectedIngredients,
    fetchRecipes
  } = useRecipes();
  
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const handleIngredientToggle = (ingredient) => {
    // Ensure ingredient is a string
    const ingredientStr = String(ingredient).trim();
    const newSelection = selectedIngredients.includes(ingredientStr)
      ? selectedIngredients.filter(i => i !== ingredientStr)
      : [...selectedIngredients, ingredientStr];
    setSelectedIngredients(newSelection);
  };

  const clearFilters = () => {
    setSelectedIngredients([]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mobile Filter Button */}
        <button 
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-5 rounded-lg mb-4 transition-colors"
        >
          <FiFilter size={18} /> Filter Recipes
        </button>

        {/* Filter Sidebar */}
        <div className={`lg:col-span-1 ${mobileFiltersOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden lg:block'}`}>
          {mobileFiltersOpen && (
            <button 
              onClick={() => setMobileFiltersOpen(false)}
              className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-2"
              aria-label="Close filters"
            >
              ✕
            </button>
          )}
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiFilter /> Filter Recipes
          </h2>
          <IngredientCategoryFilter 
            selected={selectedIngredients}
            onChange={handleIngredientToggle}
          />
        </div>

        {/* Recipe Results */}
        <div className="lg:col-span-3">
          {selectedIngredients.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center max-w-2xl mx-auto">
              <img 
                src="/images/empty-state.png"
                alt="No ingredients selected"
                className="mx-auto h-48 w-48 md:h-56 md:w-56 mb-6 opacity-90 object-contain"
                loading="lazy"
              />
              <h3 className="text-xl md:text-2xl font-medium text-gray-700 mb-3">
                Let's find your perfect recipe!
              </h3>
              <p className="text-gray-500 mb-6">
                Select ingredients from the categories to discover matching recipes
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <RecipeCardSkeleton key={`skeleton-${i}`} />)}
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">
                    {recipes.length} {recipes.length === 1 ? 'Recipe' : 'Recipes'} Found
                  </h2>
                  <p className="text-gray-600">
                    Matching: {selectedIngredients.join(', ')}
                  </p>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-blue-500 hover:text-blue-700 text-sm"
                >
                  Clear Filters
                </button>
              </div>

              {recipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center max-w-md mx-auto">
                  <img 
                    src="/images/not-found.png"
                    alt="No recipes found"
                    className="mx-auto h-40 mb-4 opacity-80"
                    loading="lazy"
                  />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    No matches found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Try different ingredient combinations
                  </p>
                  <button
                    onClick={clearFilters}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-5 rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    Clear Filters <FiArrowRight className="mt-0.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}