import React, { useEffect, useState, useCallback } from 'react';
//import { Disclosure } from '@headlessui/react';
import { FiChevronDown, FiChevronRight, FiX, FiSearch } from 'react-icons/fi';
import { fetchIngredientCategories } from '../api/recipeService';
import { useRecipes } from '../context/RecipesContext';

const IngredientCategoryFilter = () => {
  const { selectedIngredients, setSelectedIngredients } = useRecipes();
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await fetchIngredientCategories();
        setCategories(data);
      } catch (err) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Updated: Handle filter toggle with useCallback to prevent infinite loops
  const handleToggle = useCallback((ingredient) => {
    setSelectedIngredients(prev => {
      const newSelected = prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient];
      return newSelected;
    });
  }, [setSelectedIngredients]);

  // Updated: Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedIngredients([]);
    setSearchTerm('');
  }, [setSelectedIngredients]);

  return (
    <div className="space-y-3">
      {/* Search and Clear */}
      <div className="mb-3">
        <div className="relative mb-2">
          <FiSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#91cab6]" size={14} />
          <input
            type="text"
            placeholder="Search ingredients..."
            className="w-full pl-8 pr-6 py-1.5 border border-[#326755] rounded-lg focus:ring-1 focus:ring-[#0b9766] focus:border-[#0b9766] bg-[#19342a] text-white placeholder:text-[#91cab6] text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <FiX 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-[#91cab6] hover:text-white"
              size={12}
              onClick={() => setSearchTerm('')}
            />
          )}
        </div>
        {selectedIngredients.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="w-full py-1.5 px-2 rounded text-xs font-medium bg-[#0b9766] text-white hover:bg-[#059669] transition-colors"
          >
            Clear Ingredients
          </button>
        )}
      </div>

      {/* Selected Tags */}
      {selectedIngredients.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {selectedIngredients.map(ingredient => (
              <button
                key={ingredient}
                onClick={() => handleToggle(ingredient)}
                className="flex items-center gap-1 px-2 py-1 bg-[#0b9766] text-white rounded text-xs hover:bg-[#059669] transition-colors"
              >
                {ingredient}
                <FiX size={10} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.map(category => {
        const isExpanded = expandedCategories[category.name] || false;
        // Use 'ingredients' or 'items', default to []
        const allIngredients = category.ingredients || category.items || [];
        const visibleIngredients = isExpanded 
          ? allIngredients 
          : allIngredients.slice(0, 4);

        // Only filter string ingredients
        const filteredIngredients = visibleIngredients.filter(ingredient =>
          typeof ingredient === 'string' && ingredient.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredIngredients.length === 0) return null;

        return (
          <div key={category.name} className="mb-3">
            <button
              onClick={() => setExpandedCategories(prev => ({
                ...prev,
                [category.name]: !prev[category.name]
              }))}
              className="flex justify-between items-center w-full text-left font-medium mb-2 hover:text-[#0b9766] text-white transition-colors text-xs"
            >
              <span>{category.name}</span>
              {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
            </button>
            
            <div className="flex flex-wrap gap-1">
              {filteredIngredients.map(ingredient => (
                <button
                  key={ingredient}
                  onClick={() => handleToggle(ingredient)}
                  className={`px-2 py-1 rounded text-xs border transition-colors ${
                    selectedIngredients.includes(ingredient)
                      ? 'bg-[#0b9766] text-white border-[#0b9766]'
                      : 'bg-[#19342a] text-[#91cab6] border-[#326755] hover:bg-[#23483b] hover:text-white'
                  }`}
                >
                  {ingredient}
                </button>
              ))}
            </div>
            
            {category.ingredients.length > 4 && (
              <button
                onClick={() => setExpandedCategories(prev => ({
                  ...prev,
                  [category.name]: !prev[category.name]
                }))}
                className="mt-1 text-xs text-[#0b9766] hover:underline"
              >
                {isExpanded ? 'Show less' : `Show ${category.ingredients.length - 4} more...`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default IngredientCategoryFilter;
