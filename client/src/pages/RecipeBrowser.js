import { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // Added this import
import { useRecipes } from '../context/RecipesContext';
import RecipeCard from '../components/RecipeCard';
import { FiFilter, FiArrowLeft, FiSearch } from 'react-icons/fi';
import RecipeDetail from '../pages/RecipeDetail';

const categories = [
  { name: 'All', value: 'all' },
  { name: 'Vegetarian', value: 'vegetarian' },
  { name: 'Vegan', value: 'vegan' },
  { name: 'Breakfast', value: 'breakfast' },
  { name: 'Lunch', value: 'lunch' },
  { name: 'Dinner', value: 'dinner' },
  { name: 'Dessert', value: 'dessert' },
];

export default function RecipeBrowser() {
  const { allRecipes, selectedRecipe, setSelectedRecipe } = useRecipes();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();  // Now properly defined

  const filteredRecipes = allRecipes.filter(recipe => {
    const searchLower = searchTerm.toLowerCase();
    const titleMatch = recipe.title?.toLowerCase().includes(searchLower) || false;
    const descMatch = recipe.description?.toLowerCase().includes(searchLower) || false;
    
    const categoryMatch = selectedCategory === 'all' || 
                         recipe.dietaryTags?.includes(selectedCategory) ||
                         recipe.mealType?.includes(selectedCategory);
    
    return (titleMatch || descMatch) && categoryMatch;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with back button */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center text-gray-600 hover:text-blue-600 mb-4"
        >
          <FiArrowLeft className="mr-2" /> Back to Dashboard
        </button>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Browse Recipes</h1>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-600 hover:text-blue-600"
          >
            <FiFilter size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search recipes by name or description..."
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Quick Filter Chips */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-3">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedCategory === category.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } transition-colors`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRecipes.map(recipe => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe}
            onClick={() => setSelectedRecipe(recipe)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FiSearch size={48} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No recipes found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchTerm 
              ? `No recipes match "${searchTerm}"`
              : "Try selecting different filters"}
          </p>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetail 
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}