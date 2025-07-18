import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { fetchIngredientCategories } from '../api/recipeService';

export default function DynamicIngredientFilter({ selected, onChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await fetchIngredientCategories();
        setCategories(categories);
      } catch (err) {
        // Optionally handle error
        setCategories([]);
      }
      setLoading(false);
    };
    fetchCategories();
  }, []);

  // Updated: Use passed 'selected' state directly
  const toggleIngredient = (ingredient) => {
    const newSelection = selected.includes(ingredient)
      ? selected.filter(i => i !== ingredient)
      : [...selected, String(ingredient).trim()];
    
    onChange(newSelection); // Pass the new array directly
  };

  if (loading) return <div className="animate-pulse h-40 bg-gray-100 rounded-lg"></div>;

  return (
    <div className="space-y-6">
      {categories.map(category => (
        <div key={category.id}>
          <h4 className="font-medium mb-2">{category.name}</h4>
          <div className="flex flex-wrap gap-2">
            {category.items.map(item => (
              <button
                key={item}
                onClick={() => toggleIngredient(item)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selected.includes(item)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
