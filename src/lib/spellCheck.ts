/**
 * Spell-check for ingredient names using Levenshtein distance.
 * Suggests corrections from a known ingredient dictionary.
 */

const KNOWN_INGREDIENTS = [
  // Proteins
  "chicken breast", "chicken thigh", "ground beef", "steak", "pork chops",
  "salmon", "tuna", "cod", "shrimp", "turkey breast", "lamb", "bacon",
  "sausage", "tofu", "egg",
  // Dairy
  "butter", "whole milk", "heavy cream", "sour cream", "cream cheese",
  "cheddar cheese", "mozzarella", "parmesan", "feta cheese", "goat cheese",
  "yogurt",
  // Grains & pasta
  "white rice", "brown rice", "jasmine rice", "basmati rice", "arborio rice",
  "spaghetti", "penne", "fettuccine", "rigatoni", "linguine", "macaroni",
  "all-purpose flour", "bread flour", "whole wheat flour",
  "white bread", "sourdough", "pita bread",
  // Vegetables
  "garlic", "yellow onion", "red onion", "shallot", "green onion",
  "tomato", "bell pepper", "jalapeño", "broccoli", "cauliflower",
  "spinach", "kale", "carrot", "celery", "zucchini", "cucumber",
  "potato", "sweet potato", "corn", "peas", "green beans",
  "button mushrooms", "cremini mushrooms", "portobello mushrooms",
  "romaine lettuce", "iceberg lettuce", "arugula",
  "avocado", "eggplant", "cabbage", "asparagus",
  // Fruits
  "lemon", "lime", "orange", "apple", "banana",
  "strawberries", "blueberries", "mango",
  // Herbs & spices
  "basil", "cilantro", "parsley", "rosemary", "thyme", "oregano", "dill",
  "cumin", "paprika", "turmeric", "cinnamon", "chili powder", "cayenne",
  "black pepper", "fresh thyme", "fresh basil",
  // Pantry staples
  "olive oil", "vegetable oil", "coconut oil", "sesame oil", "avocado oil",
  "soy sauce", "tomato sauce", "hot sauce", "worcestershire sauce",
  "white vinegar", "apple cider vinegar", "balsamic vinegar",
  "honey", "maple syrup", "sugar", "brown sugar",
  "baking powder", "baking soda",
  "chicken broth", "beef broth", "vegetable broth",
  "black beans", "kidney beans", "chickpeas", "lentils",
  "almonds", "walnuts", "peanuts",
  "coconut milk", "oat milk", "almond milk",
];

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Returns spell-check suggestions for a misspelled ingredient.
 * Returns null if the input looks correct (exact match or close enough).
 */
export function getSpellSuggestions(input: string): string[] | null {
  const normalized = input.trim().toLowerCase();
  if (!normalized || normalized.length < 3) return null;

  // Exact match — no suggestions needed
  if (KNOWN_INGREDIENTS.includes(normalized)) return null;

  // Find close matches
  const maxDistance = normalized.length <= 4 ? 1 : 2;
  const matches: { word: string; distance: number }[] = [];

  for (const known of KNOWN_INGREDIENTS) {
    // Check if the input is a substring of a known ingredient or vice versa
    if (known.includes(normalized) || normalized.includes(known)) {
      return null; // Partial match is fine
    }

    // Compare against each word in multi-word ingredients too
    const knownWords = known.split(" ");
    for (const kw of knownWords) {
      const dist = levenshtein(normalized, kw);
      if (dist <= maxDistance) {
        matches.push({ word: known, distance: dist });
        break;
      }
    }

    // Also compare full string for single-word inputs
    const fullDist = levenshtein(normalized, known);
    if (fullDist <= maxDistance && !matches.some((m) => m.word === known)) {
      matches.push({ word: known, distance: fullDist });
    }
  }

  if (matches.length === 0) return null;

  // Sort by distance, return top 3
  matches.sort((a, b) => a.distance - b.distance);
  const unique = [...new Set(matches.map((m) => m.word))];
  return unique.slice(0, 3);
}
