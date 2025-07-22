// client/src/api/recipeService.js
const API_BASE = 'http://localhost:5000/api/recipes'; // Change if your backend runs elsewhere

// Helper function to make API calls with timeout and retry
async function fetchWithTimeout(url, options = {}, timeout = 30000, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`API request attempt ${attempt + 1}/${retries + 1}: ${url}`);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      // If response is not ok, throw error to trigger retry
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.warn(`Request timed out (attempt ${attempt + 1}/${retries + 1}): ${url}`);
        if (attempt === retries) {
          throw new Error('Request timed out after all retries');
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      
      if (attempt === retries) {
        throw error;
      }
      
      console.warn(`Request failed (attempt ${attempt + 1}/${retries + 1}): ${error.message}`);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

export async function fetchAllRecipes() {
  const res = await fetchWithTimeout(API_BASE);
  const data = await res.json();
  // Handle both old format (array) and new format (object with recipes array)
  return data.recipes || data;
}

export async function fetchRecipeById(id) {
  const res = await fetchWithTimeout(`${API_BASE}/${id}`);
  return res.json();
}

export async function searchRecipes(params) {
  const query = new URLSearchParams(params).toString();
  const res = await fetchWithTimeout(`${API_BASE}/search?${query}`);
  return res.json();
}

export async function fetchIngredientCategories() {
  const res = await fetchWithTimeout('http://localhost:5000/api/ingredient-categories');
  return res.json();
}

export async function fetchFilterCategories() {
  const res = await fetchWithTimeout('http://localhost:5000/api/filter-categories');
  return res.json();
}

export async function fetchSavedRecipes(userId, idToken) {
  const res = await fetchWithTimeout(`http://localhost:5000/api/recipes/users/${userId}/saved-recipes`, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  return res.json();
}

export async function saveRecipeForUser(userId, recipeId, recipeData, idToken) {
  const res = await fetchWithTimeout(`http://localhost:5000/api/recipes/users/${userId}/saved-recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
    body: JSON.stringify({ recipeId, recipeData })
  });
  return res.json();
}

export async function removeSavedRecipeForUser(userId, recipeId, idToken) {
  const res = await fetchWithTimeout(`http://localhost:5000/api/recipes/users/${userId}/saved-recipes/${recipeId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  return res.json();
}

export async function fetchUserProfile(userId, idToken) {
  const res = await fetchWithTimeout(`http://localhost:5000/api/recipes/users/${userId}/profile`, {
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  return res.json();
}

export async function updateUserProfile(userId, profileData, idToken) {
  const res = await fetchWithTimeout(`http://localhost:5000/api/recipes/users/${userId}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
    body: JSON.stringify(profileData)
  });
  return res.json();
}

export async function deleteUserProfile(userId, idToken) {
  const res = await fetchWithTimeout(`http://localhost:5000/api/recipes/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  return res.json();
}
