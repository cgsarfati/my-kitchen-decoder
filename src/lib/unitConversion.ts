/**
 * Unit conversion system for comparing pantry quantities against recipe requirements.
 * All conversions normalize to a base unit per category:
 *   - Weight → grams
 *   - Volume → milliliters
 *   - Count → pieces
 */

type UnitCategory = "weight" | "volume" | "count";

interface UnitInfo {
  category: UnitCategory;
  toBase: number; // multiplier to convert to base unit
}

export const UNIT_MAP: Record<string, UnitInfo> = {
  // Weight → grams
  g: { category: "weight", toBase: 1 },
  gram: { category: "weight", toBase: 1 },
  grams: { category: "weight", toBase: 1 },
  kg: { category: "weight", toBase: 1000 },
  kilogram: { category: "weight", toBase: 1000 },
  kilograms: { category: "weight", toBase: 1000 },
  oz: { category: "weight", toBase: 28.3495 },
  ounce: { category: "weight", toBase: 28.3495 },
  ounces: { category: "weight", toBase: 28.3495 },
  lb: { category: "weight", toBase: 453.592 },
  lbs: { category: "weight", toBase: 453.592 },
  pound: { category: "weight", toBase: 453.592 },
  pounds: { category: "weight", toBase: 453.592 },

  // Volume → milliliters
  ml: { category: "volume", toBase: 1 },
  milliliter: { category: "volume", toBase: 1 },
  milliliters: { category: "volume", toBase: 1 },
  l: { category: "volume", toBase: 1000 },
  liter: { category: "volume", toBase: 1000 },
  liters: { category: "volume", toBase: 1000 },
  tsp: { category: "volume", toBase: 4.929 },
  teaspoon: { category: "volume", toBase: 4.929 },
  teaspoons: { category: "volume", toBase: 4.929 },
  tbsp: { category: "volume", toBase: 14.787 },
  tablespoon: { category: "volume", toBase: 14.787 },
  tablespoons: { category: "volume", toBase: 14.787 },
  Tbsp: { category: "volume", toBase: 14.787 },
  Tbsps: { category: "volume", toBase: 14.787 },
  cup: { category: "volume", toBase: 236.588 },
  cups: { category: "volume", toBase: 236.588 },
  "fl oz": { category: "volume", toBase: 29.5735 },
  pint: { category: "volume", toBase: 473.176 },
  pints: { category: "volume", toBase: 473.176 },
  quart: { category: "volume", toBase: 946.353 },
  quarts: { category: "volume", toBase: 946.353 },
  gallon: { category: "volume", toBase: 3785.41 },
  gallons: { category: "volume", toBase: 3785.41 },

  // Count → pieces
  piece: { category: "count", toBase: 1 },
  pieces: { category: "count", toBase: 1 },
  clove: { category: "count", toBase: 1 },
  cloves: { category: "count", toBase: 1 },
  slice: { category: "count", toBase: 1 },
  slices: { category: "count", toBase: 1 },
  bunch: { category: "count", toBase: 1 },
  bunches: { category: "count", toBase: 1 },
  can: { category: "count", toBase: 1 },
  cans: { category: "count", toBase: 1 },
  head: { category: "count", toBase: 1 },
  heads: { category: "count", toBase: 1 },
  stalk: { category: "count", toBase: 1 },
  stalks: { category: "count", toBase: 1 },
  large: { category: "count", toBase: 1 },
  medium: { category: "count", toBase: 1 },
  small: { category: "count", toBase: 1 },
  serving: { category: "count", toBase: 1 },
  servings: { category: "count", toBase: 1 },
  "": { category: "count", toBase: 1 }, // unitless = count
};

function lookupUnit(unit: string): UnitInfo | null {
  const normalized = unit.trim().toLowerCase();
  return UNIT_MAP[normalized] ?? null;
}

function toBaseAmount(amount: number, unit: string): { category: UnitCategory; baseAmount: number } | null {
  const info = lookupUnit(unit);
  if (!info) return null;
  return { category: info.category, baseAmount: amount * info.toBase };
}

export type IngredientMatchStatus = "have" | "insufficient" | "missing";

/**
 * Compare a pantry item's quantity against a recipe ingredient's required quantity.
 * Returns the match status.
 */
export function compareQuantity(
  pantryAmount: number,
  pantryUnit: string,
  recipeAmount: number,
  recipeUnit: string
): IngredientMatchStatus {
  // If recipe has no amount specified, assume user has enough
  if (!recipeAmount || recipeAmount <= 0) return "have";

  const pantryBase = toBaseAmount(pantryAmount, pantryUnit);
  const recipeBase = toBaseAmount(recipeAmount, recipeUnit);

  // If we can't convert either unit, we can't compare — mark as insufficient
  if (!pantryBase || !recipeBase) return "insufficient";
  // If they're in different categories (e.g. count vs weight), can't compare — mark insufficient
  if (pantryBase.category !== recipeBase.category) return "insufficient";

  // Allow a small tolerance (95%) for rounding
  return pantryBase.baseAmount >= recipeBase.baseAmount * 0.95 ? "have" : "insufficient";
}

export interface IngredientWithStatus {
  id: number;
  name: string;
  amount: number;
  unit: string;
  original: string;
  status: IngredientMatchStatus;
}

/**
 * Match all recipe ingredients against the user's pantry.
 * For each ingredient, determine if the user has it, has insufficient quantity, or is missing it entirely.
 */
export function matchIngredients(
  pantryItems: { name: string; quantity: number; unit: string }[],
  recipeIngredients: { id: number; name: string; amount: number; unit: string; original: string }[],
  usedIngredientNames: string[],
  missedIngredientNames: string[]
): IngredientWithStatus[] {
  const usedSet = new Set(usedIngredientNames.map((n) => n.toLowerCase()));
  const missedSet = new Set(missedIngredientNames.map((n) => n.toLowerCase()));

  return recipeIngredients.map((ing) => {
    const ingNameLower = ing.name.toLowerCase();

    // If Spoonacular says it's missing, it's missing
    if (missedSet.has(ingNameLower)) {
      return { ...ing, status: "missing" as const };
    }

    // If Spoonacular says we have it, check quantity
    if (usedSet.has(ingNameLower)) {
      // Find matching pantry item
      const pantryItem = pantryItems.find(
        (p) => p.name.toLowerCase() === ingNameLower
      );

      if (!pantryItem) {
        // Name didn't match exactly — try partial match
        const partialMatch = pantryItems.find(
          (p) =>
            ingNameLower.includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(ingNameLower)
        );

        if (partialMatch) {
          const status = compareQuantity(
            partialMatch.quantity,
            partialMatch.unit,
            ing.amount,
            ing.unit
          );
          return { ...ing, status };
        }

        return { ...ing, status: "have" as const };
      }

      const status = compareQuantity(
        pantryItem.quantity,
        pantryItem.unit,
        ing.amount,
        ing.unit
      );
      return { ...ing, status };
    }

    // Not in used or missed — default to missing
    return { ...ing, status: "missing" as const };
  });
}

/**
 * Summarize match results for sorting/display.
 */
export function summarizeMatch(ingredients: IngredientWithStatus[]) {
  const haveCount = ingredients.filter((i) => i.status === "have").length;
  const insufficientCount = ingredients.filter((i) => i.status === "insufficient").length;
  const missingCount = ingredients.filter((i) => i.status === "missing").length;
  return { haveCount, insufficientCount, missingCount };
}

/**
 * Calculate the maximum servings a user can make based on their pantry quantities.
 * Only meaningful for full-match recipes (no missing ingredients).
 * Returns null if calculation isn't possible.
 */
export function calculateMaxServings(
  pantryItems: { name: string; quantity: number; unit: string }[],
  recipeIngredients: { id: number; name: string; amount: number; unit: string; original: string }[],
  recipeServings: number
): number | null {
  if (recipeServings <= 0) return null;

  let minRatio = Infinity;
  let comparableCount = 0;

  for (const ing of recipeIngredients) {
    // Skip ingredients with no amount (seasonings, "to taste", etc.)
    if (!ing.amount || ing.amount <= 0) continue;

    const ingNameLower = ing.name.toLowerCase();

    // Find matching pantry item
    const pantryItem =
      pantryItems.find((p) => p.name.toLowerCase() === ingNameLower) ??
      pantryItems.find(
        (p) =>
          ingNameLower.includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(ingNameLower)
      );

    if (!pantryItem) continue;

    const pantryBase = toBaseAmount(pantryItem.quantity, pantryItem.unit);
    const recipeBase = toBaseAmount(ing.amount, ing.unit);

    // Can't compare if units are incompatible
    if (!pantryBase || !recipeBase) continue;
    if (pantryBase.category !== recipeBase.category) continue;

    comparableCount++;
    const ratio = pantryBase.baseAmount / recipeBase.baseAmount;
    if (ratio < minRatio) minRatio = ratio;
  }

  // Need at least one comparable ingredient to calculate
  if (comparableCount === 0 || minRatio === Infinity) return null;

  // Convert ratio to servings: ratio * recipeServings
  const maxServings = minRatio * recipeServings;

  // Round down to nearest 0.5
  return Math.floor(maxServings * 2) / 2;
}
