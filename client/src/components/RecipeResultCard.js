// src/components/RecipeResultCard.js
import { FiBookmark, FiClock, FiUsers } from 'react-icons/fi';

export default function RecipeResultCard({ recipe, videos, onSave, isSaved }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Recipe Header */}
      <div className="relative">
        <img 
          src={recipe.image} 
          alt={recipe.title}
          className="w-full h-64 object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-food.jpg';
          }}
        />
        <button
          onClick={onSave}
          className={`absolute top-4 right-4 p-2 rounded-full ${isSaved ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-white'}`}
        >
          <FiBookmark className={isSaved ? 'fill-current' : ''} />
        </button>
      </div>

      {/* Recipe Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">{recipe.title}</h2>
        </div>

        {/* Metadata */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center text-gray-600">
            <FiClock className="mr-2" />
            <span>{recipe.readyInMinutes} mins</span>
          </div>
          <div className="flex items-center text-gray-600">
            <FiUsers className="mr-2" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>

        {/* Ingredients */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Ingredients</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recipe.ingredients.map((ingredient, i) => (
              <li key={i} className="flex items-start">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2"></span>
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        {recipe.instructions && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Instructions</h3>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: recipe.instructions }} />
          </div>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-3">Video Guides</h3>
            <div className="grid gap-4">
              {videos.map(video => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0 relative">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-32 h-20 object-cover rounded"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-red-500 text-white p-2 rounded-full">
                        <FiYoutube className="text-lg" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium line-clamp-2">{video.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">Watch on YouTube</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}