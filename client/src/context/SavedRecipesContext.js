import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const SavedRecipesContext = createContext();

export function SavedRecipesProvider({ children }) {
  const [savedRecipes, setSavedRecipes] = useState([]);

  const fetchSavedRecipes = async (userId) => {
    if (!userId) return;
    
    const q = query(collection(db, 'savedRecipes'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    setSavedRecipes(snapshot.docs.map(doc => doc.data().recipeId));
  };

  const toggleSavedRecipe = async (userId, recipeId) => {
    const docRef = doc(db, 'savedRecipes', `${userId}_${recipeId}`);
    
    if (savedRecipes.includes(recipeId)) {
      await deleteDoc(docRef);
      setSavedRecipes(savedRecipes.filter(id => id !== recipeId));
    } else {
      await setDoc(docRef, {
        userId,
        recipeId,
        savedAt: new Date()
      });
      setSavedRecipes([...savedRecipes, recipeId]);
    }
  };

  return (
    <SavedRecipesContext.Provider value={{
      savedRecipes,
      fetchSavedRecipes,
      toggleSavedRecipe
    }}>
      {children}
    </SavedRecipesContext.Provider>
  );
}

export const useSavedRecipes = () => useContext(SavedRecipesContext);