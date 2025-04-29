const { db } = require('../config/firebaseAdmin');
const fs = require('fs');
const path = require('path');

async function importData() {
  try {
    // Load and parse recipes.json
    const filePath = path.join(__dirname, '../../client/src/data/recipes.json');
    const rawData = fs.readFileSync(filePath, 'utf8');
    const allRecipes = JSON.parse(rawData);

    if (!Array.isArray(allRecipes)) {
      throw new Error('Invalid data format: Expected an array of recipes');
    }

    // Filter out recipes with null image_filename
    const recipes = allRecipes.filter(recipe => {
      return recipe.image_filename !== null && recipe.image_filename !== undefined;
    });

    console.log(`Found ${allRecipes.length} total recipes, keeping ${recipes.length} with images`);

    const BATCH_SIZE = 100;
    let processed = 0;
    const recipesRef = db.collection('recipes');

    while (processed < recipes.length) {
      const batch = db.batch();
      const batchRecipes = recipes.slice(processed, processed + BATCH_SIZE);

      batchRecipes.forEach((recipe, i) => {
        const index = processed + i;

        // Additional null check (shouldn't be needed after filtering)
        if (!recipe || typeof recipe !== 'object') {
          console.warn(`Skipping invalid recipe at index ${index}`);
          return;
        }

        // Required field check
        if (!recipe.title) {
          console.warn(`Skipping recipe at index ${index} - missing title`);
          return;
        }

        // Ingredient parsing
        let ingredients = [];
        if (Array.isArray(recipe.ingredients)) {
          ingredients = recipe.ingredients.map(ing => {
            if (typeof ing === 'string') {
              const parts = ing.split(' ').filter(Boolean);
              return {
                name: parts.slice(1).join(' ').trim(),
                amount: parts[0] || '',
                original: ing
              };
            }
            return {
              name: 'Unknown',
              amount: '',
              original: JSON.stringify(ing)
            };
          }).filter(Boolean);
        } else if (recipe.ingredients) {
          ingredients = [{
            name: 'See instructions',
            amount: '',
            original: 'Various'
          }];
        }

        // Clean and format image path
        let imagePath = null;
        if (recipe.image_filename) {
          // Remove any existing .jpg/.jpeg/.png extension
          const cleanName = recipe.image_filename
            .replace(/\.(jpg|jpeg|png)$/i, '')
            .trim();
          imagePath = `recipes/${cleanName}.jpg`;
        }

        const docData = {
          title: recipe.title || 'Untitled Recipe',
          description: recipe.description || '',
          ingredients,
          steps: recipe.instructions ? Object.values(recipe.instructions) : [],
          prepTime: recipe.cooking_time || null,
          servings: recipe.servings || null,
          cuisine: recipe.tags?.cuisine || [],
          dietaryTags: recipe.tags?.['special-consideration'] || [],
          imagePath: imagePath,
          createdAt: new Date()
        };

        const docRef = recipesRef.doc();
        batch.set(docRef, docData);
      });

      // Commit the batch
      await batch.commit();
      processed += batchRecipes.length;
      console.log(`Processed ${processed}/${recipes.length} recipes with images`);

      // Wait 1 sec before next batch to avoid throttling
      if (processed < recipes.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Successfully imported ${recipes.length} recipes (only with images)`);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
}

importData();