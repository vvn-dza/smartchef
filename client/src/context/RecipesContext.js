import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

const RecipesContext = createContext();

export function RecipesProvider({ children }) {
  const [recipes, setRecipes] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [cuisineFilter, setCuisineFilter] = useState('all');

  const fetchRecipes = async () => {
    let q = query(collection(db, 'recipes'));
    
    if (selectedIngredients.length > 0) {
      q = query(q, where('ingredients', 'array-contains-any', selectedIngredients));
    }
    
    if (cuisineFilter !== 'all') {
      q = query(q, where('cuisine', 'array-contains', cuisineFilter));
    }

    const snapshot = await getDocs(q);
    setRecipes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchRecipes();
  }, [selectedIngredients, cuisineFilter]);

  return (
    <RecipesContext.Provider value={{
      recipes,
      selectedIngredients,
      setSelectedIngredients,
      cuisineFilter,
      setCuisineFilter,
      refreshRecipes: fetchRecipes
    }}>
      {children}
    </RecipesContext.Provider>
  );
}

export const useRecipes = () => useContext(RecipesContext);