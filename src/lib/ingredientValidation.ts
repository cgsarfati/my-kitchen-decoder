/**
 * Generic ingredient terms that are too vague for accurate recipe matching.
 * Maps generic term → suggested specific alternatives.
 */
export const GENERIC_INGREDIENTS: Record<string, string[]> = {
  cheese: ["cheddar cheese", "mozzarella", "parmesan", "cream cheese", "goat cheese", "feta cheese", "swiss cheese", "gruyère"],
  meat: ["chicken breast", "ground beef", "pork chops", "steak", "lamb", "turkey breast"],
  fish: ["salmon", "tuna", "cod", "tilapia", "shrimp", "halibut", "sea bass"],
  pasta: ["spaghetti", "penne", "fettuccine", "rigatoni", "linguine", "macaroni"],
  rice: ["white rice", "brown rice", "jasmine rice", "basmati rice", "arborio rice"],
  bread: ["white bread", "sourdough", "whole wheat bread", "baguette", "pita bread", "ciabatta"],
  lettuce: ["romaine lettuce", "iceberg lettuce", "butter lettuce", "arugula", "mixed greens"],
  beans: ["black beans", "kidney beans", "chickpeas", "pinto beans", "white beans", "lentils"],
  nuts: ["almonds", "walnuts", "pecans", "cashews", "peanuts", "pistachios"],
  oil: ["olive oil", "vegetable oil", "coconut oil", "avocado oil", "sesame oil"],
  vinegar: ["white vinegar", "apple cider vinegar", "balsamic vinegar", "red wine vinegar", "rice vinegar"],
  sauce: ["tomato sauce", "soy sauce", "hot sauce", "worcestershire sauce", "teriyaki sauce"],
  herb: ["basil", "cilantro", "parsley", "rosemary", "thyme", "oregano", "dill"],
  herbs: ["basil", "cilantro", "parsley", "rosemary", "thyme", "oregano", "dill"],
  spice: ["cumin", "paprika", "turmeric", "cinnamon", "chili powder", "cayenne"],
  spices: ["cumin", "paprika", "turmeric", "cinnamon", "chili powder", "cayenne"],
  fruit: ["apple", "banana", "orange", "strawberries", "blueberries", "mango"],
  vegetable: ["broccoli", "carrots", "zucchini", "bell pepper", "spinach", "cauliflower"],
  vegetables: ["broccoli", "carrots", "zucchini", "bell pepper", "spinach", "cauliflower"],
  mushroom: ["button mushrooms", "cremini mushrooms", "shiitake mushrooms", "portobello mushrooms"],
  mushrooms: ["button mushrooms", "cremini mushrooms", "shiitake mushrooms", "portobello mushrooms"],
  pepper: ["bell pepper", "jalapeño", "serrano pepper", "black pepper", "cayenne pepper"],
  flour: ["all-purpose flour", "bread flour", "whole wheat flour", "almond flour", "rice flour"],
  sugar: ["white sugar", "brown sugar", "powdered sugar", "coconut sugar", "honey"],
  milk: ["whole milk", "skim milk", "almond milk", "oat milk", "coconut milk"],
  cream: ["heavy cream", "sour cream", "whipping cream", "cream cheese"],
  wine: ["red wine", "white wine", "cooking wine", "marsala wine"],
  stock: ["chicken stock", "beef stock", "vegetable stock"],
  broth: ["chicken broth", "beef broth", "vegetable broth"],
  onion: ["yellow onion", "red onion", "white onion", "green onion", "shallot"],
};

/**
 * Check if an ingredient name is too generic.
 * Returns suggestions if generic, or null if specific enough.
 */
export function checkGenericIngredient(name: string): string[] | null {
  const normalized = name.trim().toLowerCase();
  return GENERIC_INGREDIENTS[normalized] ?? null;
}
