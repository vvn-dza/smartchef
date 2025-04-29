import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../context/RecipesContext';
import RecipeCard from '../components/RecipeCard';
import { FiBookmark, FiTrash2, FiFolder, FiCheck, FiArrowRight } from 'react-icons/fi';
import { Menu, Transition } from '@headlessui/react';
import { useEffect } from 'react';
import { auth } from '../firebaseConfig';

export default function SavedRecipes() {
  const { 
    savedRecipes, 
    isLoading, 
    error, 
    bulkUpdateRecipes,
    folders,
    createFolder
  } = useRecipes();
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
      if (!user) {
        navigate('/login', { state: { from: '/saved' } });
      }
    });
    return unsubscribe;
  }, [navigate]);

  const toggleSelectRecipe = (recipeId) => {
    setSelectedRecipes(prev => 
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const handleBulkDelete = async () => {
    try {
      await bulkUpdateRecipes(selectedRecipes, 'unsave');
      setSelectedRecipes([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkMove = async (folder) => {
    try {
      await bulkUpdateRecipes(selectedRecipes, 'save', folder);
      setSelectedRecipes([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await createFolder(newFolderName);
      setNewFolderName('');
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <FiBookmark className="text-red-500" /> Saved Recipes
        </h1>
        <p className="text-gray-600 mt-1">
          {savedRecipes.length} {savedRecipes.length === 1 ? 'recipe' : 'recipes'} saved
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p>{error}</p>
        </div>
      )}

      {/* Bulk actions toolbar */}
      {selectedRecipes.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 flex flex-wrap items-center gap-4">
          <span className="font-medium">
            {selectedRecipes.length} selected
          </span>
          
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
          >
            <FiTrash2 /> Remove
          </button>
          
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200">
              <FiFolder /> Move to...
            </Menu.Button>
            
            <Transition
              as={Menu.Items}
              className="absolute left-0 mt-1 w-48 bg-white rounded shadow-lg z-10 focus:outline-none"
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <div className="py-1">
                {folders.map(folder => (
                  <Menu.Item key={folder}>
                    {({ active }) => (
                      <button
                        onClick={() => handleBulkMove(folder)}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } block w-full text-left px-4 py-2 text-sm`}
                      >
                        {folder}
                      </button>
                    )}
                  </Menu.Item>
                ))}
                
                <div className="border-t p-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="New folder name"
                    className="w-full p-1 border rounded text-sm mb-1"
                  />
                  <button
                    onClick={handleCreateFolder}
                    className="w-full text-sm bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Create Folder
                  </button>
                </div>
              </div>
            </Transition>
          </Menu>
          
          <button
            onClick={() => setSelectedRecipes([])}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            Clear Selection
          </button>
        </div>
      )}
      
      {/* Recipe grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-white rounded-lg shadow-md h-[22rem] animate-pulse" />
          ))}
        </div>
      ) : savedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedRecipes.map((recipe) => (
            <div key={recipe.id} className="relative">
              {selectedRecipes.includes(recipe.id) && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full z-10">
                  <FiCheck size={14} />
                </div>
              )}
              <div 
                className={`cursor-pointer ${selectedRecipes.includes(recipe.id) ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => toggleSelectRecipe(recipe.id)}
              >
                <RecipeCard recipe={recipe} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-8 text-center max-w-md mx-auto">
          <img
            src="/images/empty-saved.png"
            alt="No saved recipes yet"
            className="mx-auto h-48 w-48 object-contain mb-6"
            loading="lazy"
          />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            Your recipe box is empty
          </h3>
          <p className="text-gray-500 mb-6">
            Save recipes you love by clicking the bookmark icon
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-5 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            Browse Recipes <FiArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}