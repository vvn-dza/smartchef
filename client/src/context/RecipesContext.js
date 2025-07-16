// src/context/RecipeContext.js
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db } from '../firebaseConfig';
import {
  doc,
  deleteDoc,
  setDoc,
  collection,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import filterCategories from '../data/filterCategories.json';

const RecipesContext = createContext();

export function RecipesProvider({ children }) {
  const [allRecipes, setAllRecipes] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [selectedDietaryType, setSelectedDietaryType] = useState('all');
  const [selectedCourseType, setSelectedCourseType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [shouldFetchRecipes, setShouldFetchRecipes] = useState(false);

  const fetchRecipes = useCallback(async () => {
    // Only fetch if explicitly requested and not recently fetched
    if (!shouldFetchRecipes || (lastFetched && Date.now() - lastFetched < 300000)) {
      return;
    }

    try {
      setIsLoading(true);
      const snapshot = await getDocs(collection(db, 'recipes'));
      const recipesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        ingredients: doc.data().ingredients?.map(ing => ({
          name: ing.name?.toLowerCase().trim() || '',
          amount: ing.amount || '',
          original: ing.original || ''
        })) || []
      }));
      setAllRecipes(recipesData);
      setLastFetched(Date.now());
      setIsInitialized(true);
      setShouldFetchRecipes(false); // Reset the flag
    } catch (err) {
      console.error("Error fetching recipes:", err);
      setError("Failed to load recipes. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [lastFetched, shouldFetchRecipes]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedRecipes([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'savedRecipes'),
      (snapshot) => {
        const savedRecipesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSavedRecipes(savedRecipesData);
      },
      (err) => {
        console.error("Error listening to saved recipes:", err);
        setError("Failed to load saved recipes. Please refresh.");
      }
    );

    return unsubscribe;
  }, [user]);

  // Only fetch recipes when explicitly requested
  useEffect(() => {
    if (shouldFetchRecipes) {
      fetchRecipes();
    }
  }, [shouldFetchRecipes, fetchRecipes]);

  const toggleSavedRecipe = async (recipeOrId) => {
    if (!user) return;

    setSaving(true);
    try {
      const userId = user.uid;
      // Accept either a recipe object or an ID
      const recipeId = typeof recipeOrId === 'string' ? recipeOrId : recipeOrId.id;
      const userSavedRef = doc(db, 'users', userId, 'savedRecipes', recipeId);

      // Try to find in allRecipes, else use the provided object
      let recipeToSave = allRecipes.find(r => r.id === recipeId);
      if (!recipeToSave && typeof recipeOrId === 'object') {
        recipeToSave = recipeOrId;
      }
      const isSaved = savedRecipes.some(r => r.id === recipeId);

      if (isSaved) {
        await deleteDoc(userSavedRef);
      } else if (recipeToSave) {
        await setDoc(userSavedRef, {
          ...recipeToSave,
          savedAt: new Date()
        });
      }
    } catch (err) {
      console.error("Error toggling saved recipe:", err);
      setError("Failed to update saved recipes. Please try again.");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Helper function to check if recipe matches meal type
  const matchesMealType = useCallback((recipe, mealType) => {
    if (mealType === 'all') return true;
    
    const mealTypeConfig = filterCategories.mealTypes.find(mt => mt.value === mealType);
    if (!mealTypeConfig || !mealTypeConfig.keywords) return true;

    const recipeText = `${recipe.title} ${recipe.description || ''}`.toLowerCase();
    return mealTypeConfig.keywords.some(keyword => 
      recipeText.includes(keyword.toLowerCase())
    );
  }, []);

  // Helper function to check if recipe matches dietary type
  const matchesDietaryType = useCallback((recipe, dietaryType) => {
    if (dietaryType === 'all') return true;
    
    const dietaryConfig = filterCategories.dietaryTypes.find(dt => dt.value === dietaryType);
    if (!dietaryConfig) return true;

    const recipeTags = recipe.dietaryTags || [];
    
    if (dietaryConfig.tags) {
      return dietaryConfig.tags.some(tag => 
        recipeTags.some(recipeTag => 
          recipeTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
    }
    
    if (dietaryConfig.excludeTags) {
      return !dietaryConfig.excludeTags.some(tag => 
        recipeTags.some(recipeTag => 
          recipeTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
    }
    
    return true;
  }, []);

  // Helper function to check if recipe matches course type
  const matchesCourseType = useCallback((recipe, courseType) => {
    if (courseType === 'all') return true;
    
    const courseConfig = filterCategories.courseTypes.find(ct => ct.value === courseType);
    if (!courseConfig || !courseConfig.keywords) return true;

    const recipeText = `${recipe.title} ${recipe.description || ''}`.toLowerCase();
    return courseConfig.keywords.some(keyword => 
      recipeText.includes(keyword.toLowerCase())
    );
  }, []);

  const filteredRecipes = useMemo(() => {
    let filtered = allRecipes;

    // Apply meal type filter
    if (selectedMealType !== 'all') {
      filtered = filtered.filter(recipe => matchesMealType(recipe, selectedMealType));
    }

    // Apply dietary type filter
    if (selectedDietaryType !== 'all') {
      filtered = filtered.filter(recipe => matchesDietaryType(recipe, selectedDietaryType));
    }

    // Apply course type filter
    if (selectedCourseType !== 'all') {
      filtered = filtered.filter(recipe => matchesCourseType(recipe, selectedCourseType));
    }

    // Apply ingredient filter
    if (selectedIngredients.length > 0) {
      filtered = filtered.filter(recipe => {
        const ingredientNames = recipe.ingredients.map(ing =>
          ing.name.toLowerCase().trim()
        );

        return selectedIngredients.every(selectedIng =>
          ingredientNames.some(name =>
            name.includes(selectedIng.toLowerCase().trim())
          )
        );
      });
    }

    return filtered;
  }, [allRecipes, selectedMealType, selectedDietaryType, selectedCourseType, selectedIngredients, matchesMealType, matchesDietaryType, matchesCourseType]);

  const clearAllFilters = useCallback(() => {
    setSelectedIngredients([]);
    setSelectedMealType('all');
    setSelectedDietaryType('all');
    setSelectedCourseType('all');
  }, []);

  const requestRecipesFetch = useCallback(() => {
    setShouldFetchRecipes(true);
  }, []);

  const closeRecipeModal = useCallback(() => {
    setSelectedRecipe(null);
  }, []);

  const value = {
    recipes: filteredRecipes,
    allRecipes,
    isLoading,
    error,
    selectedIngredients,
    setSelectedIngredients,
    selectedMealType,
    setSelectedMealType,
    selectedDietaryType,
    setSelectedDietaryType,
    selectedCourseType,
    setSelectedCourseType,
    savedRecipes,
    toggleSavedRecipe,
    selectedRecipe,
    setSelectedRecipe,
    closeRecipeModal,
    user,
    saving,
    clearAllFilters,
    requestRecipesFetch,
    isInitialized
  };

  return (
    <RecipesContext.Provider value={value}>
      {children}
    </RecipesContext.Provider>
  );
}

export const useRecipes = () => {
  const context = useContext(RecipesContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipesProvider');
  }
  return context;
};