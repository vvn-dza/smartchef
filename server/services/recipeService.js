// server/services/recipeService.js
const getAllRecipes = async () => {
  // In real app, fetch from DB or external API
  return [
    { id: 1, name: "Pasta" },
    { id: 2, name: "Salad" }
  ];
};

module.exports = { getAllRecipes };
