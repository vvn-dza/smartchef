import React from 'react';
import { useRecipes } from '../context/RecipesContext';

const FilterTabs = () => {
  const {
    selectedMealType,
    setSelectedMealType,
    selectedDietaryType,
    setSelectedDietaryType,
    selectedCourseType,
    setSelectedCourseType,
    filterCategories,
    isLoading,
    error
  } = useRecipes();

  if (isLoading) {
    return <div className="text-center py-8">Loading filters...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!filterCategories) {
    return <div className="text-center py-8">No filters available.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Meal Type Filter */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wide">Meal Type</h3>
        <div className="flex gap-2 flex-wrap">
          {(filterCategories?.mealTypes || []).map((mealType) => (
            <button
              key={mealType.value}
              onClick={() => setSelectedMealType(mealType.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedMealType === mealType.value
                  ? 'bg-[#0b9766] text-white'
                  : 'bg-[#19342a] text-[#91cab6] border border-[#326755] hover:bg-[#23483b] hover:text-white'
              }`}
            >
              {mealType.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dietary Type Filter */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wide">Dietary</h3>
        <div className="flex gap-2 flex-wrap">
          {(filterCategories?.dietaryTypes || []).map((dietaryType) => (
            <button
              key={dietaryType.value}
              onClick={() => setSelectedDietaryType(dietaryType.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedDietaryType === dietaryType.value
                  ? 'bg-[#0b9766] text-white'
                  : 'bg-[#19342a] text-[#91cab6] border border-[#326755] hover:bg-[#23483b] hover:text-white'
              }`}
            >
              {dietaryType.name}
            </button>
          ))}
        </div>
      </div>

      {/* Course Type Filter */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wide">Course</h3>
        <div className="flex gap-2 flex-wrap">
          {(filterCategories?.courseTypes || []).map((courseType) => (
            <button
              key={courseType.value}
              onClick={() => setSelectedCourseType(courseType.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCourseType === courseType.value
                  ? 'bg-[#0b9766] text-white'
                  : 'bg-[#19342a] text-[#91cab6] border border-[#326755] hover:bg-[#23483b] hover:text-white'
              }`}
            >
              {courseType.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterTabs;