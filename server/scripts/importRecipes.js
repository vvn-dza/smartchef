const { db } = require('../config/firebaseAdmin');
const recipes = require('../../client/src/data/recipes.json'); // Your JSON data

async function importData() {
  const batch = db.batch();
  const recipesRef = db.collection('recipes');

  recipes.forEach(recipe => {
    const docRef = recipesRef.doc(); // Auto-generated ID
    const transformed = {
      title: recipe.title,
      description: recipe.description || '',
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.split(' ').slice(1).join(' ').trim(),
        amount: ing.split(' ')[0]
      })),
      steps: Object.values(recipe.instructions),
      prepTime: recipe.cooking_time || null,
      servings: recipe.servings || null,
      cuisine: recipe.tags?.cuisine || [],
      dietaryTags: recipe.tags?.['special-consideration'] || [],
      imagePath: recipe.image_filename ? `recipes/${recipe.image_filename}.jpg` : null
    };
    batch.set(docRef, transformed);
  });

  await batch.commit();
  console.log(`Successfully imported ${recipes.length} recipes`);
}

importData().catch(console.error);