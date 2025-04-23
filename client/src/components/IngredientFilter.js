import { useState } from 'react';

const categories = {
  'Vegetables': ['Tomato', 'Onion', 'Potato'],
  'Proteins': ['Chicken', 'Fish', 'Eggs'],
  'Spices': ['Turmeric', 'Cumin', 'Coriander']
};

export default function IngredientFilter({ selected, onChange }) {
  const toggleIngredient = (ingredient) => {
    if (selected.includes(ingredient)) {
      onChange(selected.filter(i => i !== ingredient));
    } else {
      onChange([...selected, ingredient]);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-bold text-lg mb-4">Filter Ingredients</h3>
      {Object.entries(categories).map(([category, items]) => (
        <div key={category} className="mb-4">
          <h4 className="font-medium mb-2">{category}</h4>
          <div className="flex flex-wrap gap-2">
            {items.map(item => (
              <button
                key={item}
                onClick={() => toggleIngredient(item)}
                className={`px-3 py-1 rounded-full text-sm ${
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