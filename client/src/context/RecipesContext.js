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
import { logUserActivity } from '../api/activityService';
import { getIdToken } from 'firebase/auth';

const RecipesContext = createContext();

// Simple recommendation scoring
const ACTIVITY_SCORES = {
  save: 3,
  remove: -3,
  search: 2,
  ai_search: 1,
};

// Local storage keys
const ACTIVITY_STORAGE_KEY = 'smartchef_user_activity';
const RECOMMENDATIONS_STORAGE_KEY = 'smartchef_recommendations';
const NOTIFICATIONS_STORAGE_KEY = 'smartchef_notifications';
const LAST_RECOMMENDATION_TIME_KEY = 'smartchef_last_recommendation_time';

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
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const fetchRecipes = useCallback(async () => {
    // Only fetch if explicitly requested and not recently fetched
    if (!shouldFetchRecipes || (lastFetched && Date.now() - lastFetched < 300000)) {
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching recipes...');
      const recipesData = await fetchAllRecipes();
      setAllRecipes(recipesData);
      setLastFetched(Date.now());
      setIsInitialized(true);
      setShouldFetchRecipes(false); // Reset the flag
      console.log(`Successfully fetched ${recipesData.length} recipes`);
    } catch (err) {
      console.error("Error fetching recipes:", err);
      setError("Failed to load recipes. Please try again later.");
      // Don't set isLoading to false immediately, let user retry
      setTimeout(() => {
        setIsLoading(false);
      }, 5000); // Show loading for 5 seconds before allowing retry
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

  // Check if enough time has passed since last recommendation (4 hours)
  const canShowRecommendation = useCallback(() => {
    const lastTime = localStorage.getItem(LAST_RECOMMENDATION_TIME_KEY);
    if (!lastTime) return true;
    
    const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000); // 4 hours in milliseconds
    return parseInt(lastTime) < fourHoursAgo;
  }, []);

  // Check if notification already exists for this recipe
  const notificationExists = useCallback((recipeId) => {
    const existingNotifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || '[]');
    return existingNotifications.some(noti => 
      noti.recipeId === recipeId && noti.type === 'recommendation'
    );
  }, []);

  // Helper function to generate recommendation reason
  const getRecommendationReason = (recipe, userPreferences) => {
    const reasons = [];
    
    if (recipe.ingredients) {
      const matchingIngredients = recipe.ingredients.filter(ingredient => {
        const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name;
        return userPreferences.ingredients.has(ingredientName?.toLowerCase());
      });
      if (matchingIngredients.length > 0) {
        reasons.push(`uses ${matchingIngredients.length} ingredients you like`);
      }
    }
    
    if (recipe.tags) {
      const matchingTags = recipe.tags.filter(tag => 
        userPreferences.tags.has(tag.toLowerCase())
      );
      if (matchingTags.length > 0) {
        reasons.push(`similar to your ${matchingTags[0]} preferences`);
      }
    }
    
    if (recipe.category && userPreferences.categories.has(recipe.category.toLowerCase())) {
      reasons.push('matches your favorite category');
    }
    
    // Check for AI search matches
    const aiSearches = Array.from(userPreferences.aiSearches);
    const recipeTitle = recipe.title?.toLowerCase() || '';
    const matchingAISearches = aiSearches.filter(query => 
      recipeTitle.includes(query.toLowerCase()) || query.toLowerCase().includes(recipeTitle)
    );
    
    if (matchingAISearches.length > 0) {
      reasons.push(`based on your AI search for "${matchingAISearches[0]}"`);
    }
    
    // Check for meal time preferences
    const mealTimePrefs = Array.from(userPreferences.mealTimePreferences);
    const matchingMealTimes = mealTimePrefs.filter(mealTime => 
      recipeTitle.includes(mealTime) || 
      recipe.category?.toLowerCase().includes(mealTime) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(mealTime))
    );
    
    if (matchingMealTimes.length > 0) {
      reasons.push(`perfect for ${matchingMealTimes[0]}`);
    }
    
    // Check for search pattern matches
    const userSearchPatterns = Array.from(userPreferences.searchedQueries);
    const matchingSearches = userSearchPatterns.filter(query => 
      recipeTitle.includes(query.toLowerCase()) || query.toLowerCase().includes(recipeTitle)
    );
    
    if (matchingSearches.length > 0) {
      reasons.push(`based on your "${matchingSearches[0]}" searches`);
    }
    
    if (reasons.length === 0) {
      reasons.push('based on your cooking style');
    }
    
    return reasons.join(', ');
  };

  // Generate recommendations from local activity
  const generateLocalRecommendations = useCallback(() => {
    if (!user || !allRecipes.length) {
      console.log('Cannot generate recommendations: user=', !!user, 'allRecipes.length=', allRecipes.length);
      return;
    }
    
    setRecommendationsLoading(true);
    
    try {
      const activities = JSON.parse(localStorage.getItem(ACTIVITY_STORAGE_KEY) || '[]');
      console.log('Found activities:', activities.length);
      
      if (activities.length === 0 && savedRecipes.length === 0) {
        console.log('No activities or saved recipes found, no recommendations to generate');
        setRecommendations([]);
        setRecommendationsLoading(false);
        return;
      }
      
      // Extract user preferences from activities AND current saved recipes
      const userPreferences = {
        ingredients: new Set(),
        tags: new Set(),
        categories: new Set(),
        mealTypes: new Set(),
        savedRecipes: new Set(),
        searchedQueries: new Set(),
        aiSearches: new Set(),
        mealTimePreferences: new Set()
      };
      
      // First, add current saved recipes to preferences (this is the main source)
      savedRecipes.forEach(recipe => {
        userPreferences.savedRecipes.add(recipe.id);
        
        // Extract ingredients from saved recipes
        if (recipe.ingredients) {
          recipe.ingredients.forEach(ingredient => {
            if (typeof ingredient === 'string') {
              userPreferences.ingredients.add(ingredient.toLowerCase());
            } else if (ingredient.name) {
              userPreferences.ingredients.add(ingredient.name.toLowerCase());
            }
          });
        }
        
        // Extract tags from saved recipes
        if (recipe.tags) {
          recipe.tags.forEach(tag => userPreferences.tags.add(tag.toLowerCase()));
        }
        
        // Extract categories from saved recipes
        if (recipe.category) {
          userPreferences.categories.add(recipe.category.toLowerCase());
        }
        
        // Extract meal type from saved recipes
        if (recipe.mealType) {
          userPreferences.mealTypes.add(recipe.mealType.toLowerCase());
        }
      });
      
      // Then analyze activities for search queries and AI searches
      activities.forEach(activity => {
        // Extract search queries and categorize them
        if (activity.query) {
          const query = activity.query.toLowerCase();
          userPreferences.searchedQueries.add(query);
          
          // Track AI searches separately
          if (activity.type === 'ai_search') {
            userPreferences.aiSearches.add(query);
          }
          
          // Extract meal time preferences from queries
          const mealTimeKeywords = ['breakfast', 'lunch', 'dinner', 'snack', 'drink', 'beverage'];
          mealTimeKeywords.forEach(keyword => {
            if (query.includes(keyword)) {
              userPreferences.mealTimePreferences.add(keyword);
            }
          });
        }
      });
      
      console.log('User preferences:', {
        ingredients: Array.from(userPreferences.ingredients),
        tags: Array.from(userPreferences.tags),
        categories: Array.from(userPreferences.categories),
        mealTypes: Array.from(userPreferences.mealTypes),
        savedRecipes: Array.from(userPreferences.savedRecipes)
      });
      
      // Score all recipes based on similarity to user preferences
      const recipeScores = allRecipes.map(recipe => {
        if (userPreferences.savedRecipes.has(recipe.id)) {
          return { recipe, score: -1000 }; // Exclude already saved recipes
        }
        
        let score = 0;
        
        // Score based on ingredients match (adaptive to any type)
        if (recipe.ingredients && userPreferences.ingredients.size > 0) {
          const recipeIngredients = recipe.ingredients.map(ingredient => {
            if (typeof ingredient === 'string') return ingredient.toLowerCase();
            return ingredient.name ? ingredient.name.toLowerCase() : '';
          });
          
          const ingredientMatches = recipeIngredients.filter(ingredient => 
            userPreferences.ingredients.has(ingredient)
          ).length;
          
          score += ingredientMatches * 6; // Good weight for ingredient matches
        }
        
        // Score based on tags match (adaptive)
        if (recipe.tags && userPreferences.tags.size > 0) {
          const tagMatches = recipe.tags.filter(tag => 
            userPreferences.tags.has(tag.toLowerCase())
          ).length;
          score += tagMatches * 4;
        }
        
        // Score based on category match (adaptive)
        if (recipe.category && userPreferences.categories.has(recipe.category.toLowerCase())) {
          score += 6;
        }
        
        // Score based on meal type match
        if (recipe.mealType && userPreferences.mealTypes.has(recipe.mealType.toLowerCase())) {
          score += 4;
        }
        
        // Enhanced search query matching (adaptive to any type)
        if (recipe.title && userPreferences.searchedQueries.size > 0) {
          const titleLower = recipe.title.toLowerCase();
          const queryMatches = Array.from(userPreferences.searchedQueries).filter(query => {
            const queryLower = query.toLowerCase();
            return titleLower.includes(queryLower) ||
                   queryLower.includes(titleLower) ||
                   (queryLower.includes('vegan') && titleLower.includes('vegan')) ||
                   (queryLower.includes('vegetarian') && titleLower.includes('vegetarian')) ||
                   (queryLower.includes('chicken') && titleLower.includes('chicken')) ||
                   (queryLower.includes('beef') && titleLower.includes('beef')) ||
                   (queryLower.includes('fish') && titleLower.includes('fish')) ||
                   (queryLower.includes('dessert') && titleLower.includes('dessert')) ||
                   (queryLower.includes('cake') && titleLower.includes('cake')) ||
                   (queryLower.includes('soup') && titleLower.includes('soup')) ||
                   (queryLower.includes('salad') && titleLower.includes('salad')) ||
                   (queryLower.includes('pasta') && titleLower.includes('pasta')) ||
                   (queryLower.includes('bread') && titleLower.includes('bread'));
          }).length;
          score += queryMatches * 3;
        }
        
        // Bonus for AI search matches (higher weight since user specifically asked for it)
        if (recipe.title && userPreferences.aiSearches.size > 0) {
          const titleLower = recipe.title.toLowerCase();
          const aiMatches = Array.from(userPreferences.aiSearches).filter(query => {
            const queryLower = query.toLowerCase();
            return titleLower.includes(queryLower) ||
                   queryLower.includes(titleLower) ||
                   (queryLower.includes('breakfast') && titleLower.includes('breakfast')) ||
                   (queryLower.includes('lunch') && titleLower.includes('lunch')) ||
                   (queryLower.includes('dinner') && titleLower.includes('dinner')) ||
                   (queryLower.includes('snack') && titleLower.includes('snack')) ||
                   (queryLower.includes('drink') && titleLower.includes('drink'));
          }).length;
          score += aiMatches * 5; // Higher weight for AI search matches
        }
        
        // Bonus for meal time preferences
        if (userPreferences.mealTimePreferences.size > 0) {
          const recipeTitle = recipe.title?.toLowerCase() || '';
          const recipeCategory = recipe.category?.toLowerCase() || '';
          const recipeTags = recipe.tags?.map(tag => tag.toLowerCase()) || [];
          const mealTimeMatches = Array.from(userPreferences.mealTimePreferences).filter(mealTime => {
            return recipeTitle.includes(mealTime) ||
                   recipeCategory.includes(mealTime) ||
                   recipeTags.some(tag => tag.includes(mealTime));
          }).length;
          score += mealTimeMatches * 4; // Good weight for meal time preferences
        }
        
        // Bonus for recipes with similar cooking time or difficulty
        const savedRecipes = Array.from(userPreferences.savedRecipes).map(id =>
          allRecipes.find(r => r.id === id)
        ).filter(Boolean);
        if (savedRecipes.length > 0) {
          const avgCookingTime = savedRecipes.reduce((sum, r) => sum + (r.cookingTime || 0), 0) / savedRecipes.length;
          if (recipe.cookingTime && Math.abs(recipe.cookingTime - avgCookingTime) < 15) {
            score += 2;
          }
        }
        
        // Adaptive bonus based on user's search patterns (any type)
        const userSearchPatterns = Array.from(userPreferences.searchedQueries);
        const recipeTitle = recipe.title?.toLowerCase() || '';
        const recipeCategory = recipe.category?.toLowerCase() || '';
        const recipeTags = recipe.tags?.map(tag => tag.toLowerCase()) || [];
        const patternMatches = userSearchPatterns.filter(query => {
          const queryLower = query.toLowerCase();
          return recipeTitle.includes(queryLower) ||
                 queryLower.includes(recipeTitle) ||
                 recipeCategory.includes(queryLower) ||
                 recipeTags.some(tag => tag.includes(queryLower) || queryLower.includes(tag));
        }).length;
        if (patternMatches > 0) {
          score += patternMatches * 3; // Bonus for matching user's search patterns
        }
        
        return { recipe, score };
      });
      
      const topRecipes = recipeScores
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8) // Increased to 8 recipes
        .map(item => ({
          ...item.recipe,
          recommendationScore: item.score,
          recommendationReason: getRecommendationReason(item.recipe, userPreferences)
        }));
      
      setRecommendations(topRecipes);
      console.log('Generated recommendations:', topRecipes.length);
      
      // Create notification if we have recommendations and enough time has passed
      if (topRecipes.length > 0 && canShowRecommendation()) {
        const topRecipe = topRecipes[0];
        
        // Check if notification already exists for this recipe
        if (!notificationExists(topRecipe.id)) {
          const notification = {
            id: `rec_${Date.now()}`,
            message: `🔥 Top pick: "${topRecipe.title}"`,
            recipeId: topRecipe.id,
            timestamp: Date.now(),
            type: 'recommendation'
          };
          
          // Add to notifications
          const existingNotifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY) || '[]');
          existingNotifications.unshift(notification);
          
          // Keep only last 10 notifications
          if (existingNotifications.length > 10) {
            existingNotifications.splice(10);
          }
          
          localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(existingNotifications));
          
          // Update last recommendation time
          localStorage.setItem(LAST_RECOMMENDATION_TIME_KEY, Date.now().toString());
          
          // Trigger notification alert
          if (window.triggerNotificationAlert) {
            window.triggerNotificationAlert();
          }
          
          console.log('Created recommendation notification:', notification.message);
        }
      }
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  }, [user, allRecipes, savedRecipes, canShowRecommendation, notificationExists, getRecommendationReason]);

  // Log activity to localStorage for instant recommendations
  const logLocalActivity = useCallback((type, recipeId = null, query = null) => {
    if (!user) return;
    
    const activity = {
      type,
      recipeId,
      query,
      timestamp: Date.now(),
    };
    
    // Get existing activities
    const existingActivities = JSON.parse(localStorage.getItem(ACTIVITY_STORAGE_KEY) || '[]');
    existingActivities.push(activity);
    
    // Keep only last 100 activities to prevent localStorage from getting too large
    if (existingActivities.length > 100) {
      existingActivities.splice(0, existingActivities.length - 100);
    }
    
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(existingActivities));
    
    // Generate recommendations immediately
    generateLocalRecommendations();
  }, [user, generateLocalRecommendations]);

  // Load recommendations from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedRecommendations = JSON.parse(localStorage.getItem(RECOMMENDATIONS_STORAGE_KEY) || '[]');
      setRecommendations(savedRecommendations);
    }
  }, [user]);

  // Generate recommendations when user or recipes change
  useEffect(() => {
    if (user && allRecipes.length > 0) {
      const activities = JSON.parse(localStorage.getItem(ACTIVITY_STORAGE_KEY) || '[]');
      if (activities.length > 0 || savedRecipes.length > 0) {
        console.log('User has activity data or saved recipes, generating recommendations...');
        generateLocalRecommendations();
      }
    }
  }, [user, allRecipes, savedRecipes, generateLocalRecommendations]);

  const toggleSavedRecipe = useCallback(async (recipe) => {
    if (!user) return;
    setSaving(true);
    try {
      const idToken = await getIdToken(user);
      const isSaved = savedRecipes.some(r => r.id === recipe.id);
      if (isSaved) {
        await removeSavedRecipeForUser(user.uid, recipe.id, idToken);
        setSavedRecipes(prev => prev.filter(r => r.id !== recipe.id));
        // Log remove activity locally
        logLocalActivity('remove', recipe.id);
        // Try backend logging (but don't wait for it)
        logUserActivity({ userId: user.uid, idToken, type: 'remove', recipeId: recipe.id }).catch(() => {});
      } else {
        await saveRecipeForUser(user.uid, recipe.id, recipe, idToken);
        setSavedRecipes(prev => [...prev, recipe]);
        // Log save activity locally
        logLocalActivity('save', recipe.id);
        // Try backend logging (but don't wait for it)
        logUserActivity({ userId: user.uid, idToken, type: 'save', recipeId: recipe.id }).catch(() => {});
      }
    } catch (err) {
      // Optionally handle error
    } finally {
      setSaving(false);
    }
  }, [user, savedRecipes, logLocalActivity]);

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

  // Wrap setSelectedIngredients to log activity
  const setSelectedIngredientsWithLog = useCallback(async (ingredients) => {
    setSelectedIngredients(ingredients);
    if (user && ingredients.length > 0) {
      try {
        const { getIdToken } = await import('firebase/auth');
        const idToken = await getIdToken(user);
        await logUserActivity({ userId: user.uid, idToken, type: 'search', query: ingredients.join(', ') });
      } catch (err) {
        // Optionally handle error
      }
    }
  }, [user]);

  const value = {
    recipes: filteredRecipes,
    allRecipes,
    isLoading,
    error,
    selectedIngredients,
    setSelectedIngredients: setSelectedIngredientsWithLog,
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
    filterCategoriesLoading,
    recommendations,
    recommendationsLoading,
    logLocalActivity
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