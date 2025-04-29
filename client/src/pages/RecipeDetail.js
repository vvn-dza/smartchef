import { FiX, FiClock, FiBookmark, FiShare2, FiUsers, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useRecipes } from '../context/RecipesContext';
import { useToast } from '../context/ToastContext';
import { useEffect, useState } from 'react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import RecipeCard from '../components/RecipeCard';

export default function RecipeDetail() {
  const { 
    selectedRecipe, 
    closeRecipeModal,
    toggleSavedRecipe,
    savedRecipes,
    recipes,
    setSelectedRecipe
  } = useRecipes();
  
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [relatedRecipes, setRelatedRecipes] = useState([]);

  // Enhanced image loading with cache and error handling
  useEffect(() => {
    if (!selectedRecipe) return;

    let isMounted = true;
    const storage = getStorage();

    const loadImage = async () => {
      if (!selectedRecipe.imagePath) {
        if (isMounted) {
          setImageUrl('/placeholder-food.jpg');
          setIsLoading(false);
        }
        return;
      }

      try {
        const imageRef = ref(storage, selectedRecipe.imagePath);
        const url = await getDownloadURL(imageRef);
        
        // Verify the URL is valid
        const img = new Image();
        img.onload = () => {
          if (isMounted) {
            setImageUrl(url);
            setIsLoading(false);
          }
        };
        img.onerror = () => {
          if (isMounted) {
            setImageUrl('/placeholder-food.jpg');
            setIsLoading(false);
          }
        };
        img.src = url;
      } catch (error) {
        console.error('Image load error:', error);
        if (isMounted) {
          setImageUrl('/placeholder-food.jpg');
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [selectedRecipe]);

  // Get related recipes
  useEffect(() => {
    if (!selectedRecipe || !recipes.length) return;

    const currentIngredients = selectedRecipe.ingredients?.map(i => 
      typeof i === 'string' ? i.toLowerCase() : i.name?.toLowerCase()
    ) || [];

    const related = recipes.filter(recipe => {
      if (recipe.id === selectedRecipe.id) return false;
      const recipeIngredients = recipe.ingredients?.map(i => 
        typeof i === 'string' ? i.toLowerCase() : i.name?.toLowerCase()
      ) || [];
      
      const common = currentIngredients.filter(ing => 
        recipeIngredients.includes(ing)
      );
      return common.length >= 2;
    }).slice(0, 3);

    setRelatedRecipes(related);
  }, [selectedRecipe, recipes]);

  // Body overflow handling
  useEffect(() => {
    if (selectedRecipe) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedRecipe]);

  if (!selectedRecipe) return null;

  const isSaved = savedRecipes.some(r => r.id === selectedRecipe.id);
  const wordCount = selectedRecipe.description?.split(' ').length || 0;
  const shouldTruncateDescription = wordCount > 50;
  const truncatedDescription = shouldTruncateDescription 
    ? selectedRecipe.description.split(' ').slice(0, 50).join(' ') + '...'
    : selectedRecipe.description;

  const handleShare = async () => {
    try {
      const shareData = {
        title: selectedRecipe.title,
        text: `Check out this recipe: ${selectedRecipe.title}`,
        url: `${window.location.origin}/recipe/${selectedRecipe.id}`
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showToast('Recipe link copied to clipboard!', 'success');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('Failed to share recipe', 'error');
      }
    }
  };

  const renderInstructions = () => {
    if (!selectedRecipe.steps || selectedRecipe.steps.length === 0) {
      return (
        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-500">No instructions provided.</p>
        </div>
      );
    }

    return (
      <div className="mt-6">
        <h3 className="font-bold text-lg mb-2">Instructions</h3>
        <ol className="space-y-3">
          {selectedRecipe.steps.map((step, i) => (
            <li key={i} className="flex">
              <span className="font-bold mr-2">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  const renderTags = () => {
    if (!selectedRecipe.cuisine && !selectedRecipe.dietaryTags) return null;
    
    return (
      <div className="mt-4">
        <h3 className="font-bold text-lg mb-2">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {selectedRecipe.cuisine?.map((tag, index) => (
            <span key={`cuisine-${index}`} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {tag}
            </span>
          ))}
          {selectedRecipe.dietaryTags?.map((tag, index) => (
            <span key={`diet-${index}`} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && closeRecipeModal()}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{selectedRecipe.title}</h2>
          <div className="flex gap-3">
            <button 
              onClick={handleShare}
              className="text-gray-600 hover:text-blue-600"
              title="Share recipe"
            >
              <FiShare2 size={18} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleSavedRecipe(selectedRecipe.id);
              }}
              className={`${isSaved ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
              title={isSaved ? "Saved" : "Save recipe"}
            >
              <FiBookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={closeRecipeModal}
              className="text-gray-500 hover:text-gray-700"
              title="Close"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isLoading && (
            <>
              {/* Description */}
              {selectedRecipe.description && (
                <div className="mb-4">
                  <p className="text-gray-600">
                    {showFullDescription ? selectedRecipe.description : truncatedDescription}
                  </p>
                  {shouldTruncateDescription && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-blue-600 hover:text-blue-800 text-sm mt-1 flex items-center"
                    >
                      {showFullDescription ? (
                        <>
                          <FiChevronUp className="mr-1" /> Show less
                        </>
                      ) : (
                        <>
                          <FiChevronDown className="mr-1" /> Show more
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
              
              {/* Meta */}
              <div className="flex flex-wrap gap-3 mb-4">
                {selectedRecipe.prepTime && (
                  <div className="flex items-center text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">
                    <FiClock className="mr-1" />
                    <span>{selectedRecipe.prepTime} min</span>
                  </div>
                )}
                {selectedRecipe.servings && (
                  <div className="flex items-center text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">
                    <FiUsers className="mr-1" />
                    <span>{selectedRecipe.servings} servings</span>
                  </div>
                )}
              </div>
              
              {/* Image + Ingredients */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <img 
                    src={imageUrl}
                    alt={selectedRecipe.title}
                    className="w-full h-auto max-h-64 object-cover rounded-lg shadow-sm"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-food.jpg';
                    }}
                  />
                </div>
                
                <div>
                  <h3 className="font-bold text-lg mb-2">Ingredients</h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-2 mr-2"></span>
                        <span>
                          {typeof ing === 'string' ? ing : (
                            <>
                              {ing.original || ing.name}
                              {ing.amount && <span className="text-gray-500 ml-1">({ing.amount})</span>}
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Instructions */}
              {renderInstructions()}
              
              {/* Tags */}
              {renderTags()}
              
              {/* Related Recipes */}
              {relatedRecipes.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4">You Might Also Like</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedRecipes.map(recipe => (
                      <div 
                        key={recipe.id} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecipe(recipe);
                          setIsLoading(true);
                        }}
                        className="cursor-pointer"
                      >
                        <RecipeCard recipe={recipe} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}