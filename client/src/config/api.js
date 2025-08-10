// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://smartchef-server.onrender.com' 
  : 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Recipe endpoints
  RECIPES: `${API_BASE_URL}/api/recipes`,
  GENERATE_RECIPE: `${API_BASE_URL}/api/generate-recipe`,
  STORE_AI_RECIPE: `${API_BASE_URL}/api/store-ai-recipe`,
  AI_RECIPE: (id) => `${API_BASE_URL}/api/ai-recipe/${id}`,
  
  // Spoonacular endpoints
  SPOONACULAR_RECIPE_IMAGE: `${API_BASE_URL}/api/spoonacular/recipe-image`,
  SPOONACULAR_TRIVIA: `${API_BASE_URL}/api/spoonacular/trivia`,
  SPOONACULAR_SEASONAL_INGREDIENT: `${API_BASE_URL}/api/spoonacular/seasonal-ingredient`,
  
  // YouTube endpoint
  YOUTUBE_SEARCH: `${API_BASE_URL}/api/youtube/search`,
  
  // Activity endpoint
  ACTIVITY_LOG: `${API_BASE_URL}/api/activity/log`,
  
  // Category endpoints
  INGREDIENT_CATEGORIES: `${API_BASE_URL}/api/ingredient-categories`,
  FILTER_CATEGORIES: `${API_BASE_URL}/api/filter-categories`,
  
  // User endpoints
  USER_SAVED_RECIPES: (userId) => `${API_BASE_URL}/api/recipes/users/${userId}/saved-recipes`,
  USER_SAVED_RECIPE: (userId, recipeId) => `${API_BASE_URL}/api/recipes/users/${userId}/saved-recipes/${recipeId}`,
  USER_PROFILE: (userId) => `${API_BASE_URL}/api/recipes/users/${userId}/profile`,
  USER_DELETE: (userId) => `${API_BASE_URL}/api/recipes/users/${userId}`,
};

export default API_BASE_URL; 