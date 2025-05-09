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

const RecipesContext = createContext();

export function RecipesProvider({ children }) {
  const [allRecipes, setAllRecipes] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [error, setError] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchRecipes = useCallback(async () => {
    if (lastFetched && Date.now() - lastFetched < 300000) return;

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
    } catch (err) {
      console.error("Error fetching recipes:", err);
      setError("Failed to load recipes. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [lastFetched]);

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

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const toggleSavedRecipe = async (recipeId) => {
    if (!user) return;

    setSaving(true);
    try {
      const userId = user.uid;
      const userSavedRef = doc(db, 'users', userId, 'savedRecipes', recipeId);
      const recipeToSave = allRecipes.find(r => r.id === recipeId);
      const isSaved = savedRecipes.some(r => r.id === recipeId);

      if (isSaved) {
        await deleteDoc(userSavedRef);
      } else {
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

  const filteredRecipes = useMemo(() => {
    if (selectedIngredients.length === 0) return [];

    return allRecipes.filter(recipe => {
      const ingredientNames = recipe.ingredients.map(ing =>
        ing.name.toLowerCase().trim()
      );

      return selectedIngredients.every(selectedIng =>
        ingredientNames.some(name =>
          name.includes(selectedIng.toLowerCase().trim())
        )
      );
    });
  }, [allRecipes, selectedIngredients]);

  const value = {
    recipes: filteredRecipes,
    savedRecipes,
    allRecipes,
    isLoading,
    error,
    selectedIngredients,
    setSelectedIngredients,
    toggleSavedRecipe,
    selectedRecipe,
    setSelectedRecipe,
    closeRecipeModal: () => setSelectedRecipe(null),
    user,
    saving,
    fetchRecipes
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