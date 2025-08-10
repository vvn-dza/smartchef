// client/src/api/recipeService.js
import { API_ENDPOINTS } from '../config/api';

// Helper function for fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Recipe functions - Updated to match expected exports
export const fetchAllRecipes = async (limit = 300, offset = 0) => {
  const res = await fetchWithTimeout(`${API_ENDPOINTS.RECIPES}?limit=${limit}&offset=${offset}`);
  return res.json();
};

export const fetchRecipeById = async (id) => {
  const res = await fetchWithTimeout(`${API_ENDPOINTS.RECIPES}/${id}`);
  return res.json();
};

export const searchRecipes = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetchWithTimeout(`${API_ENDPOINTS.RECIPES}/search?${queryString}`);
  return res.json();
};

export const fetchIngredientCategories = async () => {
  const res = await fetchWithTimeout(API_ENDPOINTS.INGREDIENT_CATEGORIES);
  return res.json();
};

export const fetchFilterCategories = async () => {
  const res = await fetchWithTimeout(API_ENDPOINTS.FILTER_CATEGORIES);
  return res.json();
};

export const fetchSavedRecipes = async (userId, token) => {
  const res = await fetchWithTimeout(API_ENDPOINTS.USER_SAVED_RECIPES(userId), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return res.json();
};

export const saveRecipeForUser = async (userId, recipe, token) => {
  const res = await fetchWithTimeout(API_ENDPOINTS.USER_SAVED_RECIPES(userId), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(recipe)
  });
  return res.json();
};

export const removeSavedRecipeForUser = async (userId, recipeId, token) => {
  const res = await fetchWithTimeout(API_ENDPOINTS.USER_SAVED_RECIPE(userId, recipeId), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return res.json();
};

export const getUserProfile = async (userId, token) => {
  const res = await fetchWithTimeout(API_ENDPOINTS.USER_PROFILE(userId), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return res.json();
};

export const updateUserProfile = async (userId, profileData, token) => {
  const res = await fetchWithTimeout(API_ENDPOINTS.USER_PROFILE(userId), {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  return res.json();
};

export const deleteUserProfile = async (userId, token) => {
  const res = await fetchWithTimeout(API_ENDPOINTS.USER_DELETE(userId), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return res.json();
};

// Keep the old function names as aliases for backward compatibility
export const getAllRecipes = fetchAllRecipes;
export const getRecipeById = fetchRecipeById;
export const getIngredientCategories = fetchIngredientCategories;
export const getFilterCategories = fetchFilterCategories;
export const getSavedRecipes = fetchSavedRecipes;
export const saveRecipe = saveRecipeForUser;
export const removeSavedRecipe = removeSavedRecipeForUser;
