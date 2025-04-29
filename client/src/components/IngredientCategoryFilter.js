import React, { useEffect, useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { FiChevronDown, FiChevronRight, FiX, FiSearch } from 'react-icons/fi';
import ingredientData from '../data/ingredientCategories.json';

const IngredientCategoryFilter = ({ selected = [], onChange }) => {
  const [categories, setCategories] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelected, setLocalSelected] = useState([]);

  // Initialize with all categories from JSON
  useEffect(() => {
    const categoryMap = {};
    ingredientData.categories.forEach((category) => {
      categoryMap[category.name] = category.ingredients;
    });
    setCategories(categoryMap);
    setLocalSelected(selected);
  }, [selected]);

  // Handle filter toggle
  const handleToggle = (ingredient) => {
    const newSelected = localSelected.includes(ingredient)
      ? localSelected.filter(i => i !== ingredient)
      : [...localSelected, ingredient];
    
    setLocalSelected(newSelected);
    onChange(newSelected); // Propagate changes to parent
  };

  // Clear all filters
  const clearAllFilters = () => {
    setLocalSelected([]);
    onChange([]); // This is crucial - actually clears the filters
    setSearchTerm('');
  };

  // Filter categories based on search term
  const filteredCategories = Object.entries(categories).reduce((acc, [category, ingredients]) => {
    const filteredIngredients = ingredients.filter(ingredient =>
      ingredient.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredIngredients.length > 0) {
      acc[category] = filteredIngredients;
    }
    
    return acc;
  }, {});

  return (
    <div className="p-4 bg-white rounded shadow-md max-h-[80vh] overflow-y-auto sticky top-4">
      <h2 className="text-xl font-semibold mb-4">Filter Ingredients</h2>
      
      {/* Search and Clear */}
      <div className="mb-4">
        <div className="relative mb-2">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search ingredients..."
            className="w-full pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <FiX 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
              onClick={() => setSearchTerm('')}
            />
          )}
        </div>
        <button
          onClick={clearAllFilters}
          disabled={localSelected.length === 0}
          className={`w-full py-2 px-3 rounded-lg text-sm font-medium ${
            localSelected.length > 0 
              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Clear All Filters
        </button>
      </div>

      {/* Selected Tags */}
      {localSelected.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {localSelected.map(ingredient => (
              <button
                key={ingredient}
                onClick={() => handleToggle(ingredient)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {ingredient}
                <FiX size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {ingredientData.categories.map(category => {
        const isExpanded = expandedCategories[category.name] || false;
        const visibleIngredients = isExpanded 
          ? category.ingredients 
          : category.ingredients.slice(0, 8);
        
        const filteredIngredients = visibleIngredients.filter(ingredient =>
          ingredient.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredIngredients.length === 0) return null;

        return (
          <div key={category.name} className="mb-4">
            <button
              onClick={() => setExpandedCategories(prev => ({
                ...prev,
                [category.name]: !prev[category.name]
              }))}
              className="flex justify-between items-center w-full text-left font-medium mb-2 hover:text-blue-600"
            >
              <span>{category.name}</span>
              {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
            </button>
            
            <div className="flex flex-wrap gap-2">
              {filteredIngredients.map(ingredient => (
                <button
                  key={ingredient}
                  onClick={() => handleToggle(ingredient)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    localSelected.includes(ingredient)
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {ingredient}
                </button>
              ))}
            </div>
            
            {category.ingredients.length > 8 && (
              <button
                onClick={() => setExpandedCategories(prev => ({
                  ...prev,
                  [category.name]: !prev[category.name]
                }))}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                {isExpanded ? 'Show less' : 'Show more...'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default IngredientCategoryFilter;