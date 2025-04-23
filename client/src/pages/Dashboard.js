import { useRecipes } from '../context/RecipesContext';
import RecipeCard from '../components/RecipeCard';
import IngredientFilter from '../components/IngredientFilter';

export default function Dashboard() {
  const { recipes, selectedIngredients, setSelectedIngredients } = useRecipes();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <div className="lg:col-span-1">
          <IngredientFilter 
            selected={selectedIngredients}
            onChange={setSelectedIngredients}
          />
        </div>
        
        {/* Recipe Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}