import type { Recipe } from "@/types/recipe";

/**
 * Mock recipe data for demo mode.
 * Covers various pantry combinations for testing:
 * - Full matches (chicken+garlic+oil+rice, pasta+tomato+garlic, eggs+butter+flour)
 * - Partial matches with missing ingredients
 * - Partial matches with insufficient quantities
 * - Recipe with no image (for fallback testing)
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
  {
    id: 105,
    title: "Classic Chicken Parmesan Pasta",
    image: "https://img.spoonacular.com/recipes/654959-312x231.jpg",
    usedIngredientCount: 5,
    missedIngredientCount: 0,
    usedIngredients: [
      { id: 1, name: "chicken breast", amount: 500, unit: "g", original: "500g chicken breast" },
      { id: 2, name: "garlic", amount: 3, unit: "cloves", original: "3 cloves garlic" },
      { id: 3, name: "olive oil", amount: 2, unit: "tbsp", original: "2 tablespoons olive oil" },
      { id: 12, name: "spaghetti", amount: 400, unit: "g", original: "400g spaghetti" },
      { id: 13, name: "parmesan", amount: 80, unit: "g", original: "80g parmesan" },
    ],
    missedIngredients: [],
    servings: 4,
    readyInMinutes: 30,
    instructions:
      "<ol><li>Cook spaghetti according to package directions.</li><li>Season chicken with salt and pepper, coat lightly in flour.</li><li>Heat olive oil and cook chicken 5-6 min per side until golden.</li><li>In same pan, sauté garlic for 1 minute.</li><li>Toss pasta with garlic oil, top with sliced chicken and grated parmesan.</li></ol>",
    sourceUrl: "https://example.com/chicken-parm-pasta",
    extendedIngredients: [
      { id: 1, name: "chicken breast", amount: 500, unit: "g", original: "500g chicken breast" },
      { id: 2, name: "garlic", amount: 3, unit: "cloves", original: "3 cloves garlic" },
      { id: 3, name: "olive oil", amount: 2, unit: "tbsp", original: "2 tablespoons olive oil" },
      { id: 12, name: "spaghetti", amount: 400, unit: "g", original: "400g spaghetti" },
      { id: 13, name: "parmesan", amount: 80, unit: "g", original: "80g parmesan" },
    ],
  },
  {
    id: 106,
    title: "Tomato Garlic Spaghetti",
    image: "https://img.spoonacular.com/recipes/716195-312x231.jpg",
    usedIngredientCount: 4,
    missedIngredientCount: 0,
    usedIngredients: [
      { id: 2, name: "garlic", amount: 4, unit: "cloves", original: "4 cloves garlic" },
      { id: 3, name: "olive oil", amount: 3, unit: "tbsp", original: "3 tablespoons olive oil" },
      { id: 12, name: "spaghetti", amount: 300, unit: "g", original: "300g spaghetti" },
      { id: 14, name: "tomato", amount: 400, unit: "g", original: "400g tomatoes" },
    ],
    missedIngredients: [],
    servings: 3,
    readyInMinutes: 20,
    instructions:
      "<ol><li>Cook spaghetti al dente.</li><li>Dice tomatoes. Heat olive oil, sauté garlic 1 min.</li><li>Add tomatoes, cook 8-10 min until saucy.</li><li>Toss pasta in the sauce, season with salt and pepper.</li></ol>",
    sourceUrl: "https://example.com/tomato-garlic-spaghetti",
    extendedIngredients: [
      { id: 2, name: "garlic", amount: 4, unit: "cloves", original: "4 cloves garlic" },
      { id: 3, name: "olive oil", amount: 3, unit: "tbsp", original: "3 tablespoons olive oil" },
      { id: 12, name: "spaghetti", amount: 300, unit: "g", original: "300g spaghetti" },
      { id: 14, name: "tomato", amount: 400, unit: "g", original: "400g tomatoes" },
    ],
  },
  // --- NEW: Egg-based recipe (full match with eggs, butter, flour, milk) ---
  {
    id: 107,
    title: "Fluffy Buttermilk Pancakes",
    image: "https://img.spoonacular.com/recipes/639468-312x231.jpg",
    usedIngredientCount: 4,
    missedIngredientCount: 0,
    usedIngredients: [
      { id: 20, name: "egg", amount: 2, unit: "", original: "2 eggs" },
      { id: 21, name: "all-purpose flour", amount: 200, unit: "g", original: "200g flour" },
      { id: 22, name: "whole milk", amount: 250, unit: "ml", original: "250ml milk" },
      { id: 23, name: "butter", amount: 30, unit: "g", original: "30g butter" },
    ],
    missedIngredients: [],
    servings: 4,
    readyInMinutes: 20,
    instructions:
      "<ol><li>Whisk flour, a pinch of salt, and 1 tsp baking powder.</li><li>In another bowl, beat eggs, then add milk and melted butter.</li><li>Combine wet and dry ingredients until just mixed.</li><li>Heat a non-stick pan over medium heat, ladle batter to form pancakes.</li><li>Cook 2-3 minutes per side until golden brown.</li><li>Serve with maple syrup or fresh fruit.</li></ol>",
    sourceUrl: "https://example.com/buttermilk-pancakes",
    extendedIngredients: [
      { id: 20, name: "egg", amount: 2, unit: "", original: "2 eggs" },
      { id: 21, name: "all-purpose flour", amount: 200, unit: "g", original: "200g flour" },
      { id: 22, name: "whole milk", amount: 250, unit: "ml", original: "250ml milk" },
      { id: 23, name: "butter", amount: 30, unit: "g", original: "30g butter" },
      { id: 24, name: "baking powder", amount: 1, unit: "tsp", original: "1 tsp baking powder" },
    ],
  },
  // --- NEW: Salmon recipe (partial match — missing dill and lemon) ---
  {
    id: 108,
    title: "Honey Glazed Salmon",
    image: "https://img.spoonacular.com/recipes/644387-312x231.jpg",
    usedIngredientCount: 2,
    missedIngredientCount: 2,
    usedIngredients: [
      { id: 30, name: "salmon", amount: 400, unit: "g", original: "400g salmon fillet" },
      { id: 3, name: "olive oil", amount: 1, unit: "tbsp", original: "1 tablespoon olive oil" },
    ],
    missedIngredients: [
      { id: 31, name: "honey", amount: 3, unit: "tbsp", original: "3 tablespoons honey" },
      { id: 32, name: "lemon", amount: 1, unit: "", original: "1 lemon, juiced" },
    ],
    servings: 2,
    readyInMinutes: 25,
    instructions:
      "<ol><li>Preheat oven to 400°F (200°C).</li><li>Place salmon on a lined baking sheet, drizzle with olive oil.</li><li>Mix honey and lemon juice, brush generously over salmon.</li><li>Bake 12-15 minutes until salmon flakes easily.</li><li>Serve with steamed vegetables or rice.</li></ol>",
    sourceUrl: "https://example.com/honey-glazed-salmon",
    extendedIngredients: [
      { id: 30, name: "salmon", amount: 400, unit: "g", original: "400g salmon fillet" },
      { id: 3, name: "olive oil", amount: 1, unit: "tbsp", original: "1 tablespoon olive oil" },
      { id: 31, name: "honey", amount: 3, unit: "tbsp", original: "3 tablespoons honey" },
      { id: 32, name: "lemon", amount: 1, unit: "", original: "1 lemon, juiced" },
    ],
  },
  // --- NEW: Vegetarian recipe (full match with common pantry staples) ---
  {
    id: 109,
    title: "Creamy Garlic Mushroom Pasta",
    image: "https://img.spoonacular.com/recipes/660290-312x231.jpg",
    usedIngredientCount: 4,
    missedIngredientCount: 0,
    usedIngredients: [
      { id: 2, name: "garlic", amount: 4, unit: "cloves", original: "4 cloves garlic" },
      { id: 3, name: "olive oil", amount: 2, unit: "tbsp", original: "2 tablespoons olive oil" },
      { id: 40, name: "button mushrooms", amount: 250, unit: "g", original: "250g mushrooms" },
      { id: 41, name: "penne", amount: 300, unit: "g", original: "300g penne" },
    ],
    missedIngredients: [],
    servings: 3,
    readyInMinutes: 25,
    instructions:
      "<ol><li>Cook penne according to package directions.</li><li>Slice mushrooms. Heat olive oil, sauté mushrooms 5-6 minutes until golden.</li><li>Add minced garlic, cook 1 minute.</li><li>Pour in heavy cream and simmer 3 minutes.</li><li>Toss cooked pasta into the sauce. Season with salt and pepper.</li></ol>",
    sourceUrl: "https://example.com/creamy-garlic-mushroom-pasta",
    extendedIngredients: [
      { id: 2, name: "garlic", amount: 4, unit: "cloves", original: "4 cloves garlic" },
      { id: 3, name: "olive oil", amount: 2, unit: "tbsp", original: "2 tablespoons olive oil" },
      { id: 40, name: "button mushrooms", amount: 250, unit: "g", original: "250g mushrooms" },
      { id: 41, name: "penne", amount: 300, unit: "g", original: "300g penne" },
      { id: 42, name: "heavy cream", amount: 100, unit: "ml", original: "100ml heavy cream" },
    ],
  },
  // --- NEW: Recipe with NO image (for fallback/placeholder testing) ---
  {
    id: 110,
    title: "Simple Egg Fried Rice",
    image: "",
    usedIngredientCount: 3,
    missedIngredientCount: 1,
    usedIngredients: [
      { id: 20, name: "egg", amount: 3, unit: "", original: "3 eggs" },
      { id: 4, name: "rice", amount: 2, unit: "cups", original: "2 cups cooked rice" },
      { id: 3, name: "olive oil", amount: 1, unit: "tbsp", original: "1 tablespoon oil" },
    ],
    missedIngredients: [
      { id: 9, name: "soy sauce", amount: 2, unit: "tbsp", original: "2 tablespoons soy sauce" },
    ],
    servings: 2,
    readyInMinutes: 15,
    instructions:
      "<ol><li>Heat oil in a wok over high heat.</li><li>Scramble eggs, break into small pieces.</li><li>Add cooked rice, stir-fry 3-4 minutes.</li><li>Drizzle soy sauce and toss to combine.</li><li>Serve immediately.</li></ol>",
    sourceUrl: "https://example.com/egg-fried-rice",
    extendedIngredients: [
      { id: 20, name: "egg", amount: 3, unit: "", original: "3 eggs" },
      { id: 4, name: "rice", amount: 2, unit: "cups", original: "2 cups cooked rice" },
      { id: 3, name: "olive oil", amount: 1, unit: "tbsp", original: "1 tablespoon oil" },
      { id: 9, name: "soy sauce", amount: 2, unit: "tbsp", original: "2 tablespoons soy sauce" },
    ],
  },
  // --- NEW: Beef recipe (partial — needs red wine and rosemary) ---
  {
    id: 111,
    title: "Pan-Seared Steak with Garlic Butter",
    image: "https://img.spoonacular.com/recipes/633876-312x231.jpg",
    usedIngredientCount: 3,
    missedIngredientCount: 1,
    usedIngredients: [
      { id: 50, name: "steak", amount: 400, unit: "g", original: "400g ribeye steak" },
      { id: 2, name: "garlic", amount: 3, unit: "cloves", original: "3 cloves garlic" },
      { id: 23, name: "butter", amount: 30, unit: "g", original: "30g butter" },
    ],
    missedIngredients: [
      { id: 51, name: "rosemary", amount: 2, unit: "sprigs", original: "2 sprigs fresh rosemary" },
    ],
    servings: 2,
    readyInMinutes: 20,
    instructions:
      "<ol><li>Bring steak to room temperature. Season generously with salt and pepper.</li><li>Heat a cast-iron skillet over high heat until smoking.</li><li>Sear steak 3-4 minutes per side for medium-rare.</li><li>Add butter, garlic, and rosemary. Baste steak for 1 minute.</li><li>Rest 5 minutes before slicing.</li></ol>",
    sourceUrl: "https://example.com/garlic-butter-steak",
    extendedIngredients: [
      { id: 50, name: "steak", amount: 400, unit: "g", original: "400g ribeye steak" },
      { id: 2, name: "garlic", amount: 3, unit: "cloves", original: "3 cloves garlic" },
      { id: 23, name: "butter", amount: 30, unit: "g", original: "30g butter" },
      { id: 51, name: "rosemary", amount: 2, unit: "sprigs", original: "2 sprigs fresh rosemary" },
    ],
  },
];
