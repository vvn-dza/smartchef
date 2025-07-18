// client/src/api/recipeService.js
const API_BASE = 'http://localhost:5000/api/recipes'; // Change if your backend runs elsewhere

export async function fetchAllRecipes() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Failed to fetch recipes');
  return res.json();
}

export async function fetchRecipeById(id) {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch recipe');
  return res.json();
}

export async function searchRecipes(params) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/search?${query}`);
  if (!res.ok) throw new Error('Failed to search recipes');
  return res.json();
}

export async function fetchIngredientCategories() {
  const res = await fetch('http://localhost:5000/api/ingredient-categories');
  if (!res.ok) throw new Error('Failed to fetch ingredient categories');
  return res.json();
}

export async function fetchFilterCategories() {
  const res = await fetch('http://localhost:5000/api/filter-categories');
  if (!res.ok) throw new Error('Failed to fetch filter categories');
  return res.json();
}

export async function fetchSavedRecipes(userId, idToken) {
  const res = await fetch(`http://localhost:5000/api/recipes/users/${userId}/saved-recipes`, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch saved recipes');
  return res.json();
}

export async function saveRecipeForUser(userId, recipeId, recipeData, idToken) {
  const res = await fetch(`http://localhost:5000/api/recipes/users/${userId}/saved-recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
    body: JSON.stringify({ recipeId, recipeData })
  });
  if (!res.ok) throw new Error('Failed to save recipe');
  return res.json();
}

export async function removeSavedRecipeForUser(userId, recipeId, idToken) {
  const res = await fetch(`http://localhost:5000/api/recipes/users/${userId}/saved-recipes/${recipeId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  if (!res.ok) throw new Error('Failed to remove saved recipe');
  return res.json();
}

export async function fetchUserProfile(userId, idToken) {
  const res = await fetch(`http://localhost:5000/api/recipes/users/${userId}/profile`, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

export async function updateUserProfile(userId, profileData, idToken) {
  const res = await fetch(`http://localhost:5000/api/recipes/users/${userId}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) throw new Error('Failed to update user profile');
  return res.json();
}

export async function deleteUserProfile(userId, idToken) {
  const res = await fetch(`http://localhost:5000/api/recipes/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  if (!res.ok) throw new Error('Failed to delete user profile');
  return res.json();
}
