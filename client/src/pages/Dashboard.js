// /pages/Dashboard.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar'; // Now we import Navbar from the components folder

const Dashboard = () => {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [recipeResults, setRecipeResults] = useState([]);
  const navigate = useNavigate();

  const handleIngredientSelection = (ingredient) => {
    setSelectedIngredients(prevState => 
      prevState.includes(ingredient)
        ? prevState.filter(item => item !== ingredient)
        : [...prevState, ingredient]
    );
  };

  const handleSearchRecipes = () => {
    // Example function to fetch recipes based on selected ingredients
    console.log('Selected Ingredients:', selectedIngredients);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-800 p-4 text-white">
        <h2 className="text-xl font-semibold mb-4">SmartChef</h2>
        <div className="space-y-4">
          <h3 className="font-medium">Select Ingredients</h3>
          <div>
            <h4 className="text-sm font-medium">Pantry Essentials</h4>
            {['butter', 'egg', 'garlic'].map(ingredient => (
              <button
                key={ingredient}
                onClick={() => handleIngredientSelection(ingredient)}
                className={`w-full py-2 mt-2 text-left px-4 rounded ${selectedIngredients.includes(ingredient) ? 'bg-blue-500' : 'bg-gray-700'}`}
              >
                {ingredient}
              </button>
            ))}
          </div>
          <div>
            <h4 className="text-sm font-medium">Vegetables & Greens</h4>
            {['carrot', 'spinach', 'onion'].map(ingredient => (
              <button
                key={ingredient}
                onClick={() => handleIngredientSelection(ingredient)}
                className={`w-full py-2 mt-2 text-left px-4 rounded ${selectedIngredients.includes(ingredient) ? 'bg-blue-500' : 'bg-gray-700'}`}
              >
                {ingredient}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Navbar Component */}
        <Navbar />

        <div className="mt-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
          {/* Recipe Search Section */}
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Find Recipes</h2>
            <div className="space-y-4">
              <button
                onClick={handleSearchRecipes}
                className="w-full py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600"
              >
                Search Recipes
              </button>

              <div className="mt-4">
                <input
                  type="file"
                  accept="image/*"
                  className="w-full p-2 bg-gray-200 rounded-lg"
                  onChange={(e) => {
                    console.log(e.target.files);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Recipe Results */}
          {recipeResults.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold">Recipe Results</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {recipeResults.map((recipe, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-md">
                    <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-40 object-cover rounded-lg" />
                    <h3 className="text-lg font-semibold mt-4">{recipe.name}</h3>
                    <p className="text-gray-600 mt-2">{recipe.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;