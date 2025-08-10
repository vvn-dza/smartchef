import { FiX, FiClock, FiBookmark, FiShare2, FiUsers, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useRecipes } from '../context/RecipesContext';
import { useToast } from '../context/ToastContext';
import { useEffect, useState } from 'react';
import RecipeCard from '../components/RecipeCard';
import { ImageService } from '../services/imageService';

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
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [relatedRecipes, setRelatedRecipes] = useState([]);
  const [imageUrl, setImageUrl] = useState('');

  // Token-based image URL generator
  const getImageUrl = (path) => {
    if (!path) return '/placeholder-food.jpg';
    
    // Keep the original filename exactly as stored
    const filename = path.includes('/') 
      ? path.split('/').pop() // Get part after last slash
      : path;
    
  };

  useEffect(() => {
    const loadImage = async () => {
      if (!selectedRecipe?.imagePath) {
        setImageUrl('/placeholder-food.jpg');
        return;
      }
      
      try {
        const optimizedUrl = await ImageService.getFullImageUrl(selectedRecipe.imagePath);
        setImageUrl(optimizedUrl);
      } catch (error) {
        console.error('Error loading image:', error);
        setImageUrl('/placeholder-food.jpg');
      }
    };

    loadImage();
  }, [selectedRecipe]);

  // Related recipes calculation
  useEffect(() => {
    if (!selectedRecipe || !recipes.length) return;

    const currentIngredients = selectedRecipe.ingredients?.map(i => 
      typeof i === 'string' ? i.toLowerCase() : i.name?.toLowerCase()
    ) || [];

    setRelatedRecipes(
      recipes.filter(recipe => {
        if (recipe.id === selectedRecipe.id) return false;
        const recipeIngredients = recipe.ingredients?.map(i => 
          typeof i === 'string' ? i.toLowerCase() : i.name?.toLowerCase()
        ) || [];
        return currentIngredients.some(ing => recipeIngredients.includes(ing));
      }).slice(0, 3)
    );
  }, [selectedRecipe, recipes]);

  useEffect(() => {
    if (selectedRecipe) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = '' };
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
        <div className="mt-4 bg-[#19342a] p-4 rounded-lg border border-[#326755]">
          <p className="text-[#91cab6]">No instructions provided.</p>
        </div>
      );
    }

    return (
      <div className="mt-6">
        <h3 className="font-bold text-lg mb-2 text-white">Instructions</h3>
        <ol className="space-y-3">
          {selectedRecipe.steps.map((step, i) => (
            <li key={i} className="flex text-[#91cab6]">
              <span className="font-bold mr-2 text-white">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  const renderTags = () => {
    // Handle both array and string formats for cuisine
    const cuisineArray = Array.isArray(selectedRecipe.cuisine) 
      ? selectedRecipe.cuisine 
      : selectedRecipe.cuisine 
        ? [selectedRecipe.cuisine] 
        : [];
    
    const dietaryArray = Array.isArray(selectedRecipe.dietaryTags) 
      ? selectedRecipe.dietaryTags 
      : [];
    
    if (cuisineArray.length === 0 && dietaryArray.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h3 className="font-bold text-lg mb-2 text-white">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {cuisineArray.map((tag, index) => (
            <span key={`cuisine-${index}`} className="bg-[#0b9766] text-white text-xs px-2 py-1 rounded">
              {tag}
            </span>
          ))}
          {dietaryArray.map((tag, index) => (
            <span key={`diet-${index}`} className="bg-[#326755] text-[#91cab6] text-xs px-2 py-1 rounded">
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
      <div className="bg-[#23483b] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#326755]">
        <div className="sticky top-0 bg-[#23483b] p-4 border-b border-[#326755] flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{selectedRecipe.title}</h2>
          <div className="flex gap-3">
            <button 
              onClick={handleShare}
              className="text-[#91cab6] hover:text-white"
              title="Share recipe"
            >
              <FiShare2 size={18} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleSavedRecipe(selectedRecipe);
              }}
              className={`${isSaved ? 'text-[#0b9766]' : 'text-[#91cab6] hover:text-[#0b9766]'}`}
              title={isSaved ? "Saved" : "Save recipe"}
            >
              <FiBookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={closeRecipeModal}
              className="text-[#91cab6] hover:text-white"
              title="Close"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Description moved to top */}
          {selectedRecipe.description && (
            <div className="mb-6">
              <p className="text-[#91cab6]">
                {showFullDescription ? selectedRecipe.description : truncatedDescription}
              </p>
              {shouldTruncateDescription && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-[#0b9766] hover:text-[#059669] text-sm mt-1 flex items-center"
                >
                  {showFullDescription ? (
                    <><FiChevronUp className="mr-1" /> Show less</>
                  ) : (
                    <><FiChevronDown className="mr-1" /> Show more</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Image and ingredients grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <img 
                src={imageUrl}
                alt={selectedRecipe.title}
                className="w-full h-auto max-h-64 object-cover rounded-lg shadow-sm"
                loading="eager"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-food.jpg';
                }}
              />
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2 text-white">Ingredients</h3>
              <ul className="space-y-2">
                {selectedRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start text-[#91cab6]">
                    <span className="inline-block w-2 h-2 bg-[#0b9766] rounded-full mt-2 mr-2"></span>
                    <span>
                      {typeof ing === 'string' ? ing : (
                        <>
                          {ing.original || ing.name}
                          {ing.amount && <span className="text-[#91cab6]/70 ml-1">({ing.amount})</span>}
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Prep time and servings */}
          <div className="flex flex-wrap gap-3 mb-6">
            {selectedRecipe.prepTime && (
              <div className="flex items-center text-[#91cab6] bg-[#19342a] px-3 py-1 rounded-full text-sm border border-[#326755]">
                <FiClock className="mr-1" />
                <span>{selectedRecipe.prepTime} min</span>
              </div>
            )}
            {selectedRecipe.servings && (
              <div className="flex items-center text-[#91cab6] bg-[#19342a] px-3 py-1 rounded-full text-sm border border-[#326755]">
                <FiUsers className="mr-1" />
                <span>{selectedRecipe.servings} servings</span>
              </div>
            )}
          </div>

          {/* Instructions and tags */}
          {renderInstructions()}
          {renderTags()}
          
          {/* Related recipes */}
          {relatedRecipes.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 text-white">You Might Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedRecipes.map(recipe => (
                  <div 
                    key={recipe.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecipe(recipe);
                    }}
                    className="cursor-pointer"
                  >
                    <RecipeCard recipe={recipe} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}