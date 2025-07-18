// src/context/RecipeContext.js
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db } from '../firebaseConfig';
import {
  doc,
  deleteDoc,
  setDoc,
  collection,
  onSnapshot
} from 'firebase/firestore';
import { fetchAllRecipes, fetchFilterCategories, fetchSavedRecipes, saveRecipeForUser, removeSavedRecipeForUser } from '../api/recipeService';

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
  const [filterCategories, setFilterCategories] = useState(null);
  const [filterCategoriesLoading, setFilterCategoriesLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    // Only fetch if explicitly requested and not recently fetched
    if (!shouldFetchRecipes || (lastFetched && Date.now() - lastFetched < 300000)) {
      return;
    }

    try {
      setIsLoading(true);
      const recipesData = await fetchAllRecipes();
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
    let isMounted = true;
    const fetchSaved = async () => {
      try {
        const saved = await fetchSavedRecipes(user.uid);
        if (isMounted) setSavedRecipes(saved);
      } catch (err) {
        if (isMounted) setSavedRecipes([]);
      }
    };
    fetchSaved();
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await fetchFilterCategories();
        // If data is an array, use the first doc (for single doc storage)
        setFilterCategories(Array.isArray(data) ? data[0] : data);
      } catch (err) {
        setFilterCategories(null);
      }
      setFilterCategoriesLoading(false);
    };
    fetchCategories();
  }, []);

  // Only fetch recipes when explicitly requested
  useEffect(() => {
    if (shouldFetchRecipes) {
      fetchRecipes();
    }
  }, [shouldFetchRecipes, fetchRecipes]);

  const toggleSavedRecipe = useCallback(async (recipe) => {
    if (!user) return;
    setSaving(true);
    try {
      const isSaved = savedRecipes.some(r => r.id === recipe.id);
      if (isSaved) {
        await removeSavedRecipeForUser(user.uid, recipe.id);
        setSavedRecipes(prev => prev.filter(r => r.id !== recipe.id));
      } else {
        await saveRecipeForUser(user.uid, recipe.id, recipe);
        setSavedRecipes(prev => [...prev, recipe]);
      }
    } catch (err) {
      // Optionally handle error
    } finally {
      setSaving(false);
    }
  }, [user, savedRecipes]);

  // Helper function to check if recipe matches meal type
  const matchesMealType = useCallback((recipe, mealType) => {
    if (mealType === 'all') return true;
    
    if (!filterCategories || !filterCategories.mealTypes) return true;

    const mealTypeConfig = filterCategories.mealTypes.find(mt => mt.value === mealType);
    if (!mealTypeConfig || !mealTypeConfig.keywords) return true;

    const recipeText = `${recipe.title} ${recipe.description || ''}`.toLowerCase();
    return mealTypeConfig.keywords.some(keyword => 
      recipeText.includes(keyword.toLowerCase())
    );
  }, [filterCategories]);

  // Helper function to check if recipe matches dietary type
  const matchesDietaryType = useCallback((recipe, dietaryType) => {
    if (dietaryType === 'all') return true;
    
    if (!filterCategories) return true;

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
  }, [filterCategories]);

  // Helper function to check if recipe matches course type
  const matchesCourseType = useCallback((recipe, courseType) => {
    if (courseType === 'all') return true;
    
    if (!filterCategories || !filterCategories.courseTypes) return true;

    const courseConfig = filterCategories.courseTypes.find(ct => ct.value === courseType);
    if (!courseConfig || !courseConfig.keywords) return true;

    const recipeText = `${recipe.title} ${recipe.description || ''}`.toLowerCase();
    return courseConfig.keywords.some(keyword => 
      recipeText.includes(keyword.toLowerCase())
    );
  }, [filterCategories]);

  const filteredRecipes = useMemo(() => {
    let filtered = (allRecipes || []);

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
        const ingredientNames = (recipe.ingredients || []).map(ing =>
          (ing.name || '').toLowerCase().trim()
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
    isInitialized,
    filterCategories,
    filterCategoriesLoading
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