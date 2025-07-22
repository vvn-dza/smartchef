// src/pages/Dashboard.js
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiX } from 'react-icons/fi';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import RecipeCard from '../components/RecipeCard';
import AISearch from './AISearch';
import { useNavigate } from 'react-router-dom';
import { fetchAllRecipes } from '../api/recipeService';
import RecipeCardSkeleton from '../components/RecipeCardSkeleton';

export default function Dashboard() {
  const [search, setSearch] = useState('');
  const [showAISearch, setShowAISearch] = useState(false);
  const [aiQuery, setAIQuery] = useState('');
  const [quickRecipes, setQuickRecipes] = useState([]);
  const [showRecipeCard, setShowRecipeCard] = useState(false);
  const [featuredRecipe, setFeaturedRecipe] = useState(null);
  const [dailyTip, setDailyTip] = useState('');
  const [seasonalIngredient, setSeasonalIngredient] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const navigate = useNavigate();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const carouselRef = useRef(null);

  // Fetch quick recipes for the carousel
  useEffect(() => {
    const fetchRandomRecipes = async () => {
      setCarouselLoading(true);
      try {
        const recipes = await fetchAllRecipes();
        // Shuffle the array
        for (let i = recipes.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [recipes[i], recipes[j]] = [recipes[j], recipes[i]];
        }
        setQuickRecipes(recipes.slice(0, 7));
      } catch (err) {
        setQuickRecipes([]);
      } finally {
        setCarouselLoading(false);
      }
    };
    fetchRandomRecipes();
  }, []);

  // Carousel auto-scroll (DOM-based, scrollBy/scrollTo)
  useEffect(() => {
    if (!carouselRef.current) return;
    if (quickRecipes.length === 0) return;
    const interval = setInterval(() => {
      const container = carouselRef.current;
      const card = container.querySelector('div.snap-center');
      if (card) {
        container.scrollBy({ left: card.offsetWidth + 16, behavior: 'smooth' });
        // If at the end, scroll back to start
        if (container.scrollLeft + container.offsetWidth >= container.scrollWidth - 10) {
          setTimeout(() => {
            container.scrollTo({ left: 0, behavior: 'smooth' });
          }, 450);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [quickRecipes]);

  // Reset index if cards array shrinks
  useEffect(() => {
    if (carouselIndex > quickRecipes.length - 1) {
      setCarouselIndex(0);
    }
  }, [quickRecipes.length, carouselIndex]);

  // Fetch featured recipe
  useEffect(() => {
    const fetchRandomFeatured = async () => {
      const q = query(collection(db, 'recipes'), limit(20));
      const snapshot = await getDocs(q);
      const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (recipes.length > 0) {
        const random = recipes[Math.floor(Math.random() * recipes.length)];
        setFeaturedRecipe(random);
      }
    };
    fetchRandomFeatured();
  }, []);

  // Fetch daily content from API
  useEffect(() => {
    const fetchDailyContent = async () => {
      setIsLoadingContent(true);
      try {
        // Get food trivia for cooking tips
        const triviaResponse = await fetch('http://localhost:5000/api/spoonacular/trivia');
        const triviaData = await triviaResponse.json();
        const cookingTip = triviaData.text || "Always taste your food while cooking!";
        // Get seasonal ingredient based on current month
        const currentMonth = new Date().getMonth();
        let seasonalQuery = '';
        if (currentMonth >= 2 && currentMonth <= 5) {
          seasonalQuery = 'mango';
        } else if (currentMonth >= 6 && currentMonth <= 9) {
          seasonalQuery = 'spinach';
        } else if (currentMonth >= 10 && currentMonth <= 11) {
          seasonalQuery = 'pumpkin';
        } else {
          seasonalQuery = 'orange';
        }
        const ingredientResponse = await fetch(`http://localhost:5000/api/spoonacular/seasonal-ingredient?query=${encodeURIComponent(seasonalQuery)}`);
        const ingredientData = await ingredientResponse.json();
        let seasonalIngredient = "Fresh seasonal vegetables are perfect for healthy cooking.";
        if (ingredientData.results && ingredientData.results.length > 0) {
          const ingredient = ingredientData.results[0];
          seasonalIngredient = `${ingredient.name}: Perfect for seasonal cooking and packed with nutrients.`;
        }
        setDailyTip(cookingTip);
        setSeasonalIngredient(seasonalIngredient);
      } catch (error) {
        console.error('Error fetching daily content:', error);
        setDailyTip("Always taste your food while cooking - it's the best way to adjust seasoning!");
        setSeasonalIngredient("Fresh herbs can transform a simple dish into something special.");
      } finally {
        setIsLoadingContent(false);
      }
    };
    fetchDailyContent();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/ai-search?query=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleRecipeClick = (recipe) => {
    navigate(`/search?query=${encodeURIComponent(recipe.title)}`);
  };

  const handleCloseAISearch = () => {
    setShowAISearch(false);
    setAIQuery('');
  };

  const handleCloseRecipeCard = () => {
    setShowRecipeCard(false);
    if (featuredRecipe) {
      navigate(`/search?query=${encodeURIComponent(featuredRecipe.title)}`);
    }
  };

  // Helper to get visible cards with wrap-around
  const getVisibleCards = () => {
    if (quickRecipes.length <= 7) return quickRecipes; // Assuming 7 is the limit for visible cards
    const cards = [];
    for (let i = 0; i < 7; i++) {
      const idx = (carouselIndex + i) % quickRecipes.length;
      cards.push(quickRecipes[idx]);
    }
    return cards;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Search Bar */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <form onSubmit={handleSearch} className="w-full">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="What do you want to cook today?"
              className="flex-1 w-full px-4 py-3 sm:py-2 rounded-lg border border-[#326755] bg-[#19342a] text-white placeholder-[#91cab6] focus:outline-none focus:ring-2 focus:ring-[#0b9766] text-base"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 sm:py-2 rounded-lg bg-[#0b9766] text-white font-semibold hover:bg-[#059669] transition-colors text-base"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* AI Search Modal/Overlay */}
      {showAISearch && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#23483b] rounded-lg p-4 sm:p-6 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseAISearch}
              className="absolute top-2 right-2 text-[#91cab6] hover:text-white p-2 z-10"
            >
              <FiX size={20} />
            </button>
            <AISearch initialQuery={aiQuery} />
          </div>
        </div>
      )}

      {/* Carousel Section */}
      <div className="mb-8 sm:mb-10">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#91cab6] mb-4 px-2">Featured Recipes</h2>
        <div 
          ref={carouselRef}
          className="w-full overflow-x-auto flex gap-3 sm:gap-4 pb-4 hide-scrollbar snap-x snap-mandatory px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', minHeight: '370px' }}
        >
          {quickRecipes.length === 0 ? (
            <div className="text-[#91cab6] px-2 py-8 text-center w-full">No quick recipes found.</div>
          ) : (
            quickRecipes.map(recipe => (
              <div
                key={recipe.id}
                className="w-[calc(100%/3-1rem)] min-w-[300px] flex-shrink-0 cursor-pointer snap-center"
                onClick={() => handleRecipeClick(recipe)}
              >
                <RecipeCard recipe={recipe} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Browse Recipes CTA */}
      <div className="px-2 sm:px-4 py-6 mb-8 sm:mb-10">
        <div className="bg-[#23483b] rounded-xl p-4 sm:p-6 border border-[#326755]">
          <h2 className="text-white text-base sm:text-lg md:text-xl font-bold mb-3">Discover More Recipes</h2>
          <p className="text-[#91cab6] mb-4 text-sm sm:text-base leading-relaxed">
            Browse our collection of recipes by selecting your favorite ingredients
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 bg-[#0b9766] hover:bg-[#059669] text-white py-2 px-4 rounded-lg transition-colors text-sm sm:text-base"
          >
            Browse Recipes <FiArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Today's Inspiration */}
      <div className="px-2 sm:px-4">
        <h2 className="text-white text-base sm:text-lg md:text-xl lg:text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-2 mb-4">Today's Inspiration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#23483b] rounded-xl p-4 sm:p-6 border border-[#326755]">
            <h3 className="text-white font-semibold mb-3 text-sm sm:text-base">💡 Fun Facts</h3>
            {isLoadingContent ? (
              <div className="animate-pulse">
                <div className="h-4 bg-[#326755] rounded mb-2"></div>
                <div className="h-4 bg-[#326755] rounded w-3/4"></div>
              </div>
            ) : (
              <p className="text-[#91cab6] text-sm sm:text-base leading-relaxed">{dailyTip}</p>
            )}
          </div>
          
          <div className="bg-[#23483b] rounded-xl p-4 sm:p-6 border border-[#326755]">
            <h3 className="text-white font-semibold mb-3 text-sm sm:text-base">🌱 Seasonal Ingredient</h3>
            {isLoadingContent ? (
              <div className="animate-pulse">
                <div className="h-4 bg-[#326755] rounded mb-2"></div>
                <div className="h-4 bg-[#326755] rounded w-2/3"></div>
              </div>
            ) : (
              <p className="text-[#91cab6] text-sm sm:text-base leading-relaxed">{seasonalIngredient}</p>
            )}
          </div>
        </div>
      </div>

      {/* Recipe Card Modal */}
      {showRecipeCard && featuredRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#23483b] rounded-lg p-4 sm:p-6 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseRecipeCard}
              className="absolute top-2 right-2 text-[#91cab6] hover:text-white transition-colors p-2 z-10"
            >
              <FiX size={20} />
            </button>
            <RecipeCard recipe={featuredRecipe} />
          </div>
        </div>
      )}
    </div>
  );
}