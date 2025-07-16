import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import filterCategories from '../data/filterCategories.json';

export default function MealTypeDropdown({ selectedMealType, setSelectedMealType }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mealTypes = filterCategories.mealTypes;
  const selectedOption = mealTypes.find(type => type.value === selectedMealType) || mealTypes[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 bg-[#19342a] border border-[#326755] rounded-lg text-white hover:bg-[#23483b] transition-colors"
      >
        <span className="text-sm">{selectedOption.name}</span>
        <FiChevronDown className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#19342a] border border-[#326755] rounded-lg shadow-lg z-10">
          {mealTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                setSelectedMealType(type.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-[#23483b] transition-colors ${
                selectedMealType === type.value ? 'text-[#0b9766]' : 'text-white'
              }`}
            >
              <span>{type.name}</span>
              {selectedMealType === type.value && <FiCheck className="text-[#0b9766]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}