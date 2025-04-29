import { FiX, FiClock, FiBookmark } from 'react-icons/fi';

export default function RecipeModal({ recipe, onClose }) {
  const formatPrepTime = (minutes) => {
    if (!minutes) return '--';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours} hour${hours > 1 ? 's' : ''}${mins > 0 ? ` ${mins} minute${mins > 1 ? 's' : ''}` : ''}`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">{recipe.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <img 
                src={recipe.imageUrl} 
                alt={recipe.title}
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="mt-4 flex items-center text-gray-600">
                <FiClock className="mr-2" />
                <span>Prep Time: {formatPrepTime(recipe.prepTime)}</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-2">Ingredients</h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-2 mr-2"></span>
                    <span>{ing.original || ing.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {recipe.instructions && (
            <div className="mt-6">
              <h3 className="font-bold text-lg mb-2">Instructions</h3>
              <ol className="space-y-3">
                {recipe.instructions.split('\n').map((step, i) => (
                  <li key={i} className="flex">
                    <span className="font-bold mr-2">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}