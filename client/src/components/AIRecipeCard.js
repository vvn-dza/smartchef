import { useState, useEffect } from 'react';
import { FiClock, FiUsers, FiStar, FiSave, FiShare2, FiYoutube, FiImage, FiZap, FiX } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';
import { useRecipes } from '../context/RecipesContext';

// Debug API keys
console.log("API Keys check:", {
  spoonacular: !!process.env.REACT_APP_SPOONACULAR_API_KEY,
  youtube: !!process.env.REACT_APP_YOUTUBE_API_KEY,
  youtubeKey: process.env.REACT_APP_YOUTUBE_API_KEY.substring(0, 10) + '...'
});

// Helper functions
const formatText = (text) => {
  if (!text) return '';
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

const testImageUrl = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const img = new window.Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

// Generate a nice placeholder with recipe initials
const generateRecipePlaceholder = (recipeTitle) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#FF8A80', '#80CBC4', '#81C784', '#FFB74D'
  ];
  
  const color = colors[recipeTitle.length % colors.length];
  const words = recipeTitle.split(' ').filter(word => word.length > 0);
  const initials = words.map(word => word[0]).join('').toUpperCase().slice(0, 2);
  
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#grad)"/>
      <circle cx="200" cy="150" r="60" fill="rgba(255,255,255,0.2)"/>
      <text x="200" y="200" font-family="Arial, sans-serif" font-size="48" 
            font-weight="bold" fill="white" text-anchor="middle" dy=".3em">${initials}</text>
      <text x="200" y="250" font-family="Arial, sans-serif" font-size="16" 
            fill="white" text-anchor="middle">${recipeTitle}</text>
    </svg>
  `)}`;
};

// Fetch Indian recipe images specifically
const fetchIndianRecipeImage = async (recipeTitle) => {
  try {
    console.log('Fetching Indian recipe image for:', recipeTitle);
    
    const indianSearchTerms = [
      'indian biryani',
      'biryani rice',
      'indian curry',
      'indian food',
      'rice dish',
      'spiced rice'
    ];
    
    for (const term of indianSearchTerms) {
      console.log('Trying Indian search term:', term);
      
      const response = await fetch(
        `http://localhost:5000/api/spoonacular/recipe-image?query=${encodeURIComponent(term)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Indian search results for "${term}":`, data);
        
        if (data.results && data.results.length > 0) {
          const imageUrl = data.results[0].image;
          if (imageUrl && await testImageUrl(imageUrl)) {
            console.log('Found Indian recipe image:', imageUrl);
            return imageUrl;
          }
        }
      }
    }
    
    return generateRecipePlaceholder(recipeTitle);
    
  } catch (error) {
    console.error('Error fetching Indian recipe image:', error);
    return generateRecipePlaceholder(recipeTitle);
  }
};

// Fetch general recipe images
const fetchGeneralRecipeImage = async (recipeTitle) => {
  try {
    console.log('Fetching general recipe image for:', recipeTitle);
    
    const cleanTitle = recipeTitle.replace(/recipe|dish|food/gi, '').trim();
    
    const searchStrategies = [
      cleanTitle,
      cleanTitle + ' recipe',
      cleanTitle.split(' ')[0], // First word
      'food',
      'cooking'
    ];
    
    for (const strategy of searchStrategies) {
      console.log('Trying general search strategy:', strategy);
      
      const response = await fetch(
        `http://localhost:5000/api/spoonacular/recipe-image?query=${encodeURIComponent(strategy)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const imageUrl = data.results[0].image;
          if (imageUrl && await testImageUrl(imageUrl)) {
            console.log('Found general recipe image:', imageUrl);
            return imageUrl;
          }
        }
      }
    }
    
    return generateRecipePlaceholder(recipeTitle);
    
  } catch (error) {
    console.error('Error fetching general recipe image:', error);
    return generateRecipePlaceholder(recipeTitle);
  }
};

// Main image fetching function
const fetchRecipeImage = async (recipeTitle) => {
  try {
    console.log('Fetching image for recipe:', recipeTitle);
    
    if (!process.env.REACT_APP_SPOONACULAR_API_KEY) {
      console.log('No Spoonacular API key, using placeholder');
      return generateRecipePlaceholder(recipeTitle);
    }
    
    // Check if it's an Indian recipe and use specific search
    const isIndianRecipe = recipeTitle.toLowerCase().includes('biryani') || 
                          recipeTitle.toLowerCase().includes('curry') ||
                          recipeTitle.toLowerCase().includes('tikka') ||
                          recipeTitle.toLowerCase().includes('masala');
    
    if (isIndianRecipe) {
      return await fetchIndianRecipeImage(recipeTitle);
    }
    
    // Use the general search for other cuisines
    return await fetchGeneralRecipeImage(recipeTitle);
    
  } catch (error) {
    console.error('Error fetching recipe image:', error);
    return generateRecipePlaceholder(recipeTitle);
  }
};

export default function AIRecipeCard({ recipe, onClose }) {
  const { showToast } = useToast();
  const { toggleSavedRecipe, savedRecipes, user } = useRecipes();
  const [activeTab, setActiveTab] = useState('ingredients');
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [recipeImage, setRecipeImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  const isSaved = savedRecipes.some(r => r.id === recipe?.id);

  useEffect(() => {
    const loadImage = async () => {
      setImageLoading(true);
      
      // ONLY use Gemini's imageUrl
      if (recipe?.imageUrl) {
        console.log('Using Gemini imageUrl:', recipe.imageUrl);
        setRecipeImage(recipe.imageUrl);
        setImageLoading(false);
      } else {
        // If no imageUrl from Gemini, use placeholder
        console.log('No imageUrl from Gemini, using placeholder');
        setRecipeImage(generateRecipePlaceholder(recipe.title));
        setImageLoading(false);
      }
    };

    if (recipe) {
      loadImage();
    }
  }, [recipe]);

  const searchYoutubeVideos = async () => {
    if (youtubeVideos.length > 0) return;

    setLoadingVideos(true);
    try {
      const searchQuery = encodeURIComponent(`${recipe.title} recipe cooking`);
      const response = await fetch(
        `http://localhost:5000/api/youtube/search?q=${searchQuery}`
      );

      if (response.ok) {
        const data = await response.json();
        setYoutubeVideos(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!user) {
      showToast('Please login to save recipes', 'error');
      return;
    }

    try {
      await toggleSavedRecipe(recipe.id);
      showToast(
        isSaved ? 'Recipe removed from saved' : 'Recipe saved!',
        isSaved ? 'info' : 'success'
      );
    } catch (error) {
      showToast('Failed to save recipe', 'error');
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe: ${recipe.title}`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(`${recipe.title} - ${window.location.href}`);
        showToast('Link copied to clipboard!', 'success');
      }
    } catch (error) {
      showToast('Failed to share recipe', 'error');
    }
  };

  if (!recipe) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#23483b] rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#326755]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0b9766] text-white px-2 py-1 rounded-full text-xs">
              <FiZap className="w-3 h-3" />
              <span>AI</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white truncate">{recipe.title}</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleShare}
              className="text-[#91cab6] hover:text-white transition-colors p-1 sm:p-2"
              title="Share recipe"
            >
              <FiShare2 size={16} />
            </button>
            <button 
              onClick={handleSaveRecipe}
              disabled={!user}
              className={`${isSaved ? 'text-[#0b9766]' : 'text-[#91cab6] hover:text-[#0b9766]'} transition-colors p-1 sm:p-2 disabled:opacity-50`}
              title={isSaved ? "Saved" : "Save recipe"}
            >
              <FiSave size={16} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={onClose}
              className="text-[#91cab6] hover:text-white transition-colors p-1 sm:p-2"
              title="Close"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
        
        {/* Content - Responsive Layout */}
        <div className="flex flex-col lg:flex-row h-[calc(90vh-80px)] overflow-hidden">
          {/* Left Side - Image and Info */}
          <div className="w-full lg:w-1/3 p-4 border-b lg:border-b-0 lg:border-r border-[#326755] flex flex-col">
            {/* Image */}
            <div className="w-full aspect-square bg-center bg-no-repeat bg-cover rounded-lg overflow-hidden border border-[#326755] mb-4 relative">
              {imageLoading ? (
                <div className="w-full h-full bg-[#19342a] flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#0b9766] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : recipeImage ? (
                <img
                  src={recipeImage}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => {
                    console.log('Gemini image failed to load:', recipeImage);
                    // If Gemini's image fails, use placeholder
                    setRecipeImage(generateRecipePlaceholder(recipe.title));
                    setImageLoading(false);
                  }}
                />
              ) : (
                <div className="w-full h-full bg-[#19342a] flex items-center justify-center">
                  <FiImage className="w-12 h-12 text-[#91cab6]" />
                </div>
              )}
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-3 sm:gap-4 mb-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1 text-[#91cab6]">
                <FiClock className="w-3 h-3" />
                <span>{recipe.prepTime}</span>
              </div>
              <div className="flex items-center gap-1 text-[#91cab6]">
                <FiUsers className="w-3 h-3" />
                <span>{recipe.servings}</span>
              </div>
              {recipe.difficulty && (
                <div className="flex items-center gap-1 text-[#91cab6]">
                  <FiStar className="w-3 h-3" />
                  <span>{recipe.difficulty}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {recipe.difficulty && (
                <span className="px-2 py-1 bg-[#0b9766] text-white rounded text-xs">
                  {recipe.difficulty}
                </span>
              )}
              {recipe.cuisine && (
                <span className="px-2 py-1 bg-[#326755] text-[#91cab6] rounded text-xs">
                  {recipe.cuisine}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="flex-1">
              <h3 className="text-white text-sm font-bold mb-2">Description</h3>
              <div 
                className="text-[#91cab6] text-xs leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatText(recipe.description) }}
              />
            </div>

            {/* Nutrition (if available) */}
            {recipe.nutrition && (
              <div className="mt-4">
                <h3 className="text-white text-sm font-bold mb-2">Nutrition</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(recipe.nutrition).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="bg-[#19342a] rounded p-2 text-center">
                      <div className="text-[#0b9766] font-bold text-xs">{value}</div>
                      <div className="text-[#91cab6] text-xs capitalize">{key}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Content Tabs */}
          <div className="w-full lg:w-2/3 flex flex-col">
            {/* Compact Tabs */}
            <div className="flex border-b border-[#326755] overflow-x-auto">
              <button
                onClick={() => setActiveTab('ingredients')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'ingredients'
                    ? 'text-[#0b9766] border-b-2 border-[#0b9766]'
                    : 'text-[#91cab6] hover:text-white'
                }`}
              >
                Ingredients
              </button>
              <button
                onClick={() => setActiveTab('instructions')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'instructions'
                    ? 'text-[#0b9766] border-b-2 border-[#0b9766]'
                    : 'text-[#91cab6] hover:text-white'
                }`}
              >
                Instructions
              </button>
              <button
                onClick={() => {
                  setActiveTab('videos');
                  searchYoutubeVideos();
                }}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'videos'
                    ? 'text-[#0b9766] border-b-2 border-[#0b9766]'
                    : 'text-[#91cab6] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1">
                  <FiYoutube className="w-3 h-3" />
                  <span className="hidden sm:inline">Videos</span>
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'ingredients' && (
                <div className="space-y-2">
                  {recipe.ingredients?.map((ingredient, index) => (
                    <div key={index} className="flex items-start gap-2 text-[#91cab6] text-xs sm:text-sm">
                      <div className="w-1.5 h-1.5 bg-[#0b9766] rounded-full flex-shrink-0 mt-1.5"></div>
                      <span dangerouslySetInnerHTML={{ __html: formatText(ingredient) }} />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'instructions' && (
                <div className="space-y-3">
                  {recipe.instructions?.map((step, index) => (
                    <div key={index} className="flex gap-3 text-[#91cab6] text-xs sm:text-sm">
                      <span className="font-bold text-[#0b9766] min-w-[20px] flex-shrink-0">{index + 1}.</span>
                      <span 
                        className="leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatText(step) }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'videos' && (
                <div className="space-y-3">
                  {loadingVideos ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-[#0b9766] border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 text-[#91cab6] text-sm">Loading videos...</span>
                    </div>
                  ) : youtubeVideos.length > 0 ? (
                    <div className="space-y-3">
                      {youtubeVideos.map((video) => (
                        <div key={video.id.videoId} className="bg-[#19342a] rounded-lg overflow-hidden border border-[#326755]">
                          <div className="aspect-video">
                            <iframe
                              src={`https://www.youtube.com/embed/${video.id.videoId}`}
                              title={video.snippet.title}
                              className="w-full h-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                          <div className="p-3">
                            <h4 className="text-white font-medium text-xs line-clamp-2 mb-1">
                              {video.snippet.title}
                            </h4>
                            <p className="text-[#91cab6] text-xs">
                              {video.snippet.channelTitle}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiYoutube className="w-12 h-12 text-[#91cab6] mx-auto mb-3" />
                      <p className="text-[#91cab6] text-sm">No videos found for this recipe</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}