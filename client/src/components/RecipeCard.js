import { useState } from 'react';
import { FiClock, FiUsers, FiBookmark } from 'react-icons/fi';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export default function RecipeCard({ recipe }) {
  const [isSaved, setIsSaved] = useState(false);

  const toggleSave = async () => {
    const userId = auth.currentUser?.uid; // Get current user ID
    if (!userId) return;
  
    await setDoc(doc(db, 'savedRecipes', `${userId}_${recipe.id}`), {
      userId,
      recipeId: recipe.id,
      savedAt: new Date()
    });
    setIsSaved(!isSaved);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all">
      {recipe.imagePath && (
        <img 
          src={`https://storage.googleapis.com/your-bucket-name/${recipe.imagePath}`}
          alt={recipe.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-bold">{recipe.title}</h3>
        <div className="flex items-center mt-2 text-sm text-gray-600">
          {recipe.prepTime && (
            <span className="flex items-center mr-3">
              <FiClock className="mr-1" /> {recipe.prepTime} min
            </span>
          )}
          <button 
            onClick={toggleSave}
            className={`ml-auto ${isSaved ? 'text-red-500' : 'text-gray-400'}`}
          >
            <FiBookmark />
          </button>
        </div>
      </div>
    </div>
  );
}