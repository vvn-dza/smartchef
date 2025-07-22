// server/controllers/recipeController.js
const admin = require('../config/firebaseAdmin');
const { db } = require('../config/firebaseAdmin');

// Get all recipes with pagination
exports.getAllRecipes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 300; // Default limit of 50
    const offset = parseInt(req.query.offset) || 0;
    
    console.log(`Fetching recipes: limit=${limit}, offset=${offset}`);
    
    let query = db.collection('recipes').limit(limit);
    
    // If offset is provided, we need to use a different approach for pagination
    if (offset > 0) {
      // For offset pagination, we need to skip documents
      // This is not efficient for large datasets, but works for smaller ones
      const skipQuery = db.collection('recipes').limit(offset);
      const skipSnapshot = await skipQuery.get();
      const lastDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
      
      if (lastDoc) {
        query = db.collection('recipes').startAfter(lastDoc).limit(limit);
      }
    }
    
    const snapshot = await query.get();
    const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`Successfully fetched ${recipes.length} recipes`);
    
    res.json({
      recipes,
      pagination: {
        limit,
        offset,
        hasMore: recipes.length === limit,
        total: recipes.length
      }
    });
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get a single recipe by ID
exports.getRecipeById = async (req, res) => {
  try {
    const doc = await db.collection('recipes').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search/filter recipes (example: by mealType, dietaryType, etc.)
exports.searchRecipes = async (req, res) => {
  try {
    let query = db.collection('recipes');
    if (req.query.mealType) {
      query = query.where('mealType', '==', req.query.mealType);
    }
    // Add more filters as needed
    const snapshot = await query.get();
    const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all ingredient categories
exports.getIngredientCategories = async (req, res) => {
  try {
    const snapshot = await db.collection('ingredientCategories').get();
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all filter categories
exports.getFilterCategories = async (req, res) => {
  try {
    const snapshot = await db.collection('filterCategories').get();
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all saved recipes for a user
exports.getSavedRecipes = async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db.collection('users').doc(userId).collection('savedRecipes').get();
    const savedRecipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(savedRecipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Save a recipe for a user
exports.saveRecipe = async (req, res) => {
  try {
    const { userId } = req.params;
    const { recipeId, recipeData } = req.body;
    if (!recipeId || !recipeData) {
      return res.status(400).json({ error: 'recipeId and recipeData are required' });
    }
    await db.collection('users').doc(userId).collection('savedRecipes').doc(recipeId).set(recipeData);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove a saved recipe for a user
exports.removeSavedRecipe = async (req, res) => {
  try {
    const { userId, recipeId } = req.params;
    await db.collection('users').doc(userId).collection('savedRecipes').doc(recipeId).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;
    await db.collection('users').doc(userId).set(profileData, { merge: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete user profile
exports.deleteUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    await db.collection('users').doc(userId).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get signed URL for profile image upload/download
exports.getProfileImageUrl = async (req, res) => {
  try {
    const { userId } = req.params;
    const { filename, action } = req.query; // action: 'read' or 'write'
    if (!filename || !action) {
      return res.status(400).json({ error: 'filename and action are required' });
    }
    const { bucket } = require('../config/firebaseAdmin');
    const file = bucket.file(`profile-images/${userId}/${filename}`);
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    let options = { expires };
    if (action === 'read') options.action = 'read';
    else if (action === 'write') options.action = 'write';
    else return res.status(400).json({ error: 'Invalid action' });
    const [url] = await file.getSignedUrl(options);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
