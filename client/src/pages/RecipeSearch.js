// src/pages/RecipeSearch.js
import { useState, useEffect, useMemo } from 'react';
import { useRecipes } from '../context/RecipesContext';
import RecipeCard from '../components/RecipeCard';
import RecipeCardSkeleton from '../components/RecipeCardSkeleton';
import IngredientCategoryFilter from '../components/IngredientCategoryFilter';
import MealTypeDropdown from '../components/MealTypeDropdown';
import { FiFilter, FiSearch, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import filterCategories from '../data/filterCategories.json';
import { useLocation } from 'react-router-dom';

export default function RecipeSearch() {
  const {
    recipes,
    isLoading,
    selectedMealType,
    setSelectedMealType,
    selectedDietaryType,
    setSelectedDietaryType,
    requestRecipesFetch,
    clearAllFilters
  } = useRecipes();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recipesPerPage] = useState(9);
  const dietaryOptions = filterCategories.dietaryTypes;

  const location = useLocation();
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('query');
    if (urlQuery) {
      setSearchText(urlQuery);
      fetchRecipes(urlQuery);
    }
  }, [location.search]);

  const fetchRecipes = async (query) => {
    // Your logic to fetch recipes by title/ingredients
    // setResults(fetchedRecipes);
  };

  // Calculate pagination
  const paginatedRecipes = useMemo(() => {
    const startIndex = (currentPage - 1) * recipesPerPage;
    const endIndex = startIndex + recipesPerPage;
    return recipes.slice(startIndex, endIndex);
  }, [recipes, currentPage, recipesPerPage]);

  const totalPages = Math.ceil(recipes.length / recipesPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMealType, selectedDietaryType, recipes]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMealTypeChange = (mealType) => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      requestRecipesFetch();
    }
    setSelectedMealType(mealType);
  };

  const handleDietaryChange = (dietaryType) => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      requestRecipesFetch();
    }
    setSelectedDietaryType(dietaryType);
  };

  const handleIngredientInteraction = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      requestRecipesFetch();
    }
  };

  // Modern Pagination component
  const ModernPagination = ({ position = 'bottom' }) => {
    if (totalPages <= 1) return null;

    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${position === 'top' ? 'mb-6' : 'mt-8'}`}>
        {/* Page info */}
        <div className="text-xs text-[#91cab6] text-center sm:text-left">
          Showing {((currentPage - 1) * recipesPerPage) + 1} to {Math.min(currentPage * recipesPerPage, recipes.length)} of {recipes.length} recipes
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-all duration-200 ${
              currentPage === 1
                ? 'text-gray-500 cursor-not-allowed opacity-50'
                : 'text-[#91cab6] hover:text-white hover:bg-[#23483b] border border-[#326755] hover:border-[#0b9766]'
            }`}
          >
            <FiChevronLeft size={14} />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page indicator */}
          <div className="flex items-center gap-1 px-3 py-2 bg-[#19342a] rounded border border-[#326755]">
            <span className="text-xs text-[#91cab6]">{currentPage}</span>
            <span className="text-xs text-[#91cab6]">/</span>
            <span className="text-xs text-[#91cab6]">{totalPages}</span>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-all duration-200 ${
              currentPage === totalPages
                ? 'text-gray-500 cursor-not-allowed opacity-50'
                : 'text-[#91cab6] hover:text-white hover:bg-[#23483b] border border-[#326755] hover:border-[#0b9766]'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <FiChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#11221c] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Recipe Search</h1>
          <p className="text-gray-300 text-sm sm:text-base">Find your perfect recipe by filtering ingredients and preferences</p>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-2 bg-[#23483b] border border-[#326755] rounded-lg px-4 py-3 text-white hover:bg-[#19342a] transition-colors w-full"
          >
            <FiFilter className="text-[#0b9766]" />
            <span>Filters</span>
            {mobileFiltersOpen ? <FiX size={20} /> : <FiFilter size={20} />}
          </button>
        </div>

        {/* Mobile Filters Overlay */}
        {mobileFiltersOpen && (
          <div className="lg:hidden mb-6 bg-[#19342a] rounded-xl p-4 border border-[#326755]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Filters</h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-[#91cab6] hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>
            
            {/* Meal Type Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#91cab6] mb-2">Meal Type:</label>
              <MealTypeDropdown 
                selectedMealType={selectedMealType} 
                setSelectedMealType={handleMealTypeChange} 
              />
            </div>
            
            {/* Dietary Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#91cab6] mb-2">Dietary:</label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDietaryChange(option.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedDietaryType === option.value
                        ? 'bg-[#0b9766] text-white'
                        : 'bg-[#23483b] text-gray-300 border border-[#326755] hover:bg-[#19342a]'
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredients Filter */}
            <div>
              <label className="block text-sm font-medium text-[#91cab6] mb-2">Ingredients:</label>
              <div onClick={handleIngredientInteraction}>
                <IngredientCategoryFilter />
              </div>
            </div>
          </div>
        )}

        {/* Top Filters Bar - Desktop */}
        <div className="hidden lg:block mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-300">Meal Type:</span>
              <div className="w-48">
                <MealTypeDropdown 
                  selectedMealType={selectedMealType} 
                  setSelectedMealType={handleMealTypeChange} 
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-300">Dietary:</span>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDietaryChange(option.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedDietaryType === option.value
                        ? 'bg-[#0b9766] text-white'
                        : 'bg-[#19342a] text-gray-300 border border-[#326755] hover:bg-[#23483b]'
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Ingredients Filter Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-52 flex-shrink-0">
            <div className="bg-[#19342a] rounded-xl p-3 border border-[#326755] sticky top-4">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="text-[#0b9766] text-sm" />
                <h2 className="text-sm font-semibold text-white">Ingredients</h2>
              </div>

              <div onClick={handleIngredientInteraction}>
                <IngredientCategoryFilter />
              </div>
            </div>
          </div>

          {/* Recipe Results */}
          <div className="flex-1">
            {/* Pagination - Top */}
            <ModernPagination position="top" />

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <RecipeCardSkeleton key={index} />
                ))}
              </div>
            )}

            {/* Results Grid */}
            {!isLoading && (
              <>
                {paginatedRecipes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-[#91cab6] text-lg mb-4">No recipes found</div>
                    <p className="text-gray-400 text-sm">Try adjusting your filters or search criteria</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {paginatedRecipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Pagination - Bottom */}
            <ModernPagination position="bottom" />
          </div>
        </div>
      </div>
    </div>
  );
}