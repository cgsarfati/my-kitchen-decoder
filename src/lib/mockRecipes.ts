import type { Recipe } from "@/types/recipe";

/**
 * Mock recipe data for demo mode.
 * Covers various pantry combinations for testing.
 */
export const MOCK_RECIPES: Recipe[] = [
  {
    id: 101,
    title: "Garlic Butter Chicken with Rice",
    image: "https://img.spoonacular.com/recipes/716429-312x231.jpg",
    usedIngredientCount: 4,
    missedIngredientCount: 0,
    usedIngredients: [
      { id: 1, name: "chicken breast", amount: 2, unit: "pieces", original: "2 chicken breasts" },
      { id: 2, name: "garlic", amount: 4, unit: "cloves", original: "4 cloves garlic" },
      { id: 3, name: "olive oil", amount: 2, unit: "tbsp", original: "2 tablespoons olive oil" },
      { id: 4, name: "rice", amount: 1, unit: "cup", original: "1 cup rice" },
    ],
    missedIngredients: [],
    servings: 4,
    readyInMinutes: 35,
    instructions:
      "<ol><li>Season chicken breasts with salt and pepper.</li><li>Heat olive oil in a large skillet over medium-high heat.</li><li>Cook chicken 6-7 minutes per side until golden and cooked through.</li><li>Mince garlic and sauté in the same pan for 1 minute.</li><li>Add a tablespoon of butter and pour over chicken.</li><li>Serve over cooked rice.</li></ol>",
    sourceUrl: "https://example.com/garlic-butter-chicken",
    extendedIngredients: [
      { id: 1, name: "chicken breast", amount: 200, unit: "g", original: "200g chicken breast" },
      { id: 2, name: "garlic", amount: 4, unit: "cloves", original: "4 cloves garlic" },
      { id: 3, name: "olive oil", amount: 2, unit: "tbsp", original: "2 tablespoons olive oil" },
      { id: 4, name: "rice", amount: 1, unit: "cup", original: "1 cup rice" },
      { id: 5, name: "butter", amount: 1, unit: "tbsp", original: "1 tablespoon butter" },
      { id: 6, name: "salt", amount: 1, unit: "tsp", original: "1 tsp salt" },
    ],
  },
  {
    id: 102,
    title: "One-Pot Chicken & Rice",
    image: "https://img.spoonacular.com/recipes/715594-312x231.jpg",
    usedIngredientCount: 4,
    missedIngredientCount: 0,
    usedIngredients: [
      { id: 1, name: "chicken breast", amount: 1, unit: "lb", original: "1 lb chicken breast" },
      { id: 2, name: "garlic", amount: 3, unit: "cloves", original: "3 cloves garlic" },
      { id: 3, name: "olive oil", amount: 1, unit: "tbsp", original: "1 tablespoon olive oil" },
      { id: 4, name: "rice", amount: 1.5, unit: "cups", original: "1.5 cups rice" },
    ],
    missedIngredients: [],
    servings: 4,
    readyInMinutes: 40,
    instructions:
      "<ol><li>Dice chicken breast into 1-inch cubes.</li><li>Heat olive oil in a pot over medium heat.</li><li>Add chicken and cook until browned, about 5 minutes.</li><li>Add minced garlic and sauté for 1 minute.</li><li>Stir in rice and 3 cups of water or broth.</li><li>Bring to a boil, reduce heat to low, cover and cook 20 minutes.</li><li>Fluff with a fork and serve.</li></ol>",
    sourceUrl: "https://example.com/one-pot-chicken-rice",
    extendedIngredients: [
      { id: 1, name: "chicken breast", amount: 450, unit: "g", original: "1 lb chicken breast" },
      { id: 2, name: "garlic", amount: 3, unit: "cloves", original: "3 cloves garlic" },
      { id: 3, name: "olive oil", amount: 1, unit: "tbsp", original: "1 tablespoon olive oil" },
      { id: 4, name: "rice", amount: 1.5, unit: "cups", original: "1.5 cups rice" },
      { id: 5, name: "chicken broth", amount: 3, unit: "cups", original: "3 cups chicken broth" },
    ],
  },
  {
    id: 103,
    title: "Lemon Herb Chicken Thighs",
    image: "https://img.spoonacular.com/recipes/782585-312x231.jpg",
    usedIngredientCount: 3,
    missedIngredientCount: 2,
    usedIngredients: [
      { id: 1, name: "chicken breast", amount: 1, unit: "lb", original: "1 lb chicken" },
      { id: 2, name: "garlic", amount: 2, unit: "cloves", original: "2 cloves garlic" },
      { id: 3, name: "olive oil", amount: 2, unit: "tbsp", original: "2 tablespoons olive oil" },
    ],
    missedIngredients: [
      { id: 7, name: "lemon", amount: 1, unit: "", original: "1 lemon, juiced" },
      { id: 8, name: "fresh thyme", amount: 2, unit: "sprigs", original: "2 sprigs fresh thyme" },
    ],
    servings: 4,
    readyInMinutes: 45,
    instructions:
      "<ol><li>Preheat oven to 400°F.</li><li>Mix olive oil, minced garlic, lemon juice, and thyme.</li><li>Coat chicken in the marinade.</li><li>Place in a baking dish and roast for 35-40 minutes.</li><li>Serve hot with your favourite sides.</li></ol>",
    sourceUrl: "https://example.com/lemon-herb-chicken",
    extendedIngredients: [
      { id: 1, name: "chicken breast", amount: 450, unit: "g", original: "1 lb chicken" },
      { id: 2, name: "garlic", amount: 2, unit: "cloves", original: "2 cloves garlic" },
      { id: 3, name: "olive oil", amount: 2, unit: "tbsp", original: "2 tablespoons olive oil" },
      { id: 7, name: "lemon", amount: 1, unit: "", original: "1 lemon, juiced" },
      { id: 8, name: "fresh thyme", amount: 2, unit: "sprigs", original: "2 sprigs fresh thyme" },
    ],
  },
  {
    id: 104,
    title: "Chicken Stir Fry with Vegetables",
    image: "https://img.spoonacular.com/recipes/663559-312x231.jpg",
    usedIngredientCount: 3,
    missedIngredientCount: 3,
    usedIngredients: [
      { id: 1, name: "chicken breast", amount: 300, unit: "g", original: "300g chicken breast" },
      { id: 2, name: "garlic", amount: 3, unit: "cloves", original: "3 cloves garlic" },
      { id: 3, name: "olive oil", amount: 1, unit: "tbsp", original: "1 tablespoon olive oil" },
    ],
    missedIngredients: [
      { id: 9, name: "soy sauce", amount: 2, unit: "tbsp", original: "2 tablespoons soy sauce" },
      { id: 10, name: "bell pepper", amount: 1, unit: "", original: "1 bell pepper, sliced" },
      { id: 11, name: "broccoli", amount: 1, unit: "cup", original: "1 cup broccoli florets" },
    ],
    servings: 3,
    readyInMinutes: 25,
    instructions:
      "<ol><li>Slice chicken breast into thin strips.</li><li>Heat olive oil in a wok over high heat.</li><li>Stir-fry chicken for 4-5 minutes.</li><li>Add garlic, bell pepper, and broccoli. Cook 3-4 minutes.</li><li>Pour in soy sauce and toss to coat.</li><li>Serve immediately over rice.</li></ol>",
    sourceUrl: "https://example.com/chicken-stir-fry",
    extendedIngredients: [
      { id: 1, name: "chicken breast", amount: 300, unit: "g", original: "300g chicken breast" },
      { id: 2, name: "garlic", amount: 3, unit: "cloves", original: "3 cloves garlic" },
      { id: 3, name: "olive oil", amount: 1, unit: "tbsp", original: "1 tablespoon olive oil" },
      { id: 9, name: "soy sauce", amount: 2, unit: "tbsp", original: "2 tablespoons soy sauce" },
      { id: 10, name: "bell pepper", amount: 1, unit: "", original: "1 bell pepper, sliced" },
      { id: 11, name: "broccoli", amount: 1, unit: "cup", original: "1 cup broccoli florets" },
    ],
  },
];
