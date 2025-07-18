// server/routes/recipeRoutes.js
const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');

// Get all recipes
router.get('/', recipeController.getAllRecipes);

// Get a single recipe by ID
router.get('/:id', recipeController.getRecipeById);

// Search/filter recipes (by query params)
router.get('/search', recipeController.searchRecipes);

// Get all ingredient categories
router.get('/ingredient-categories', recipeController.getIngredientCategories);

// Get all filter categories
router.get('/filter-categories', recipeController.getFilterCategories);

// User saved recipes endpoints
router.get('/users/:userId/saved-recipes', recipeController.getSavedRecipes);
router.post('/users/:userId/saved-recipes', recipeController.saveRecipe);
router.delete('/users/:userId/saved-recipes/:recipeId', recipeController.removeSavedRecipe);

// User profile endpoints
router.get('/users/:userId/profile', recipeController.getUserProfile);
router.put('/users/:userId/profile', recipeController.updateUserProfile);
router.delete('/users/:userId', recipeController.deleteUserProfile);

// Profile image signed URL endpoint
router.get('/users/:userId/profile-image-url', recipeController.getProfileImageUrl);

// (Optional) Add, update, delete endpoints here

module.exports = router;
