/**
 * Mock AI ingredient parser — returns realistic structured data
 * from free-text input without consuming any AI credits.
 * Swap this for the real edge function call when ready.
 */

import type { PantryItem } from "@/types/pantry";

interface ParsedIngredient {
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
  expiresAt?: string;
}

// Pattern-based mock parser that handles common natural language formats
const UNIT_PATTERN = "g|kg|oz|lb|lbs|ml|l|cup|cups|tbsp|tsp|teaspoon|teaspoons|tablespoon|tablespoons|piece|pieces|clove|cloves|can|cans|slice|slices|bunch|gram|grams|kilogram|kilograms|ounce|ounces|pound|pounds|liter|liters|litre|litres|milliliter|milliliters";

const MOCK_PATTERNS: { pattern: RegExp; extract: (m: RegExpMatchArray) => ParsedIngredient | null }[] = [
  // "a teaspoon of paprika" or "an oz of butter"
  {
    pattern: new RegExp(`^(?:a|an)\\s+(${UNIT_PATTERN})\\s+(?:of\\s+)?(.+)`, "i"),
    extract: (m) => ({ quantity: 1, unit: normalizeUnit(m[1]), name: m[2].trim() }),
  },
  // "500g chicken breast" or "500 grams of chicken"
  {
    pattern: new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${UNIT_PATTERN})\\s+(?:of\\s+)?(.+)`, "i"),
    extract: (m) => ({ quantity: parseFloat(m[1]), unit: normalizeUnit(m[2]), name: m[3].trim() }),
  },
  // "2 chicken breasts"
  {
    pattern: /(\d+(?:\.\d+)?)\s+(.+)/i,
    extract: (m) => ({ quantity: parseFloat(m[1]), unit: guessUnit(m[2]), name: cleanName(m[2]) }),
  },
  // "chicken breast" (no quantity)
  {
    pattern: /^([a-zA-Z].+)$/i,
    extract: (m) => ({ quantity: 1, unit: guessUnit(m[1]), name: cleanName(m[1]) }),
  },
];

function normalizeUnit(unit: string): string {
  const map: Record<string, string> = {
    cups: "cup", pieces: "piece", cloves: "clove", cans: "can", slices: "slice",
    gram: "g", grams: "g", kilogram: "kg", kilograms: "kg",
    ounce: "oz", ounces: "oz", pound: "lb", pounds: "lb", lbs: "lb",
    liter: "l", liters: "l", litre: "l", litres: "l",
    milliliter: "ml", milliliters: "ml",
    tablespoon: "tbsp", tablespoons: "tbsp",
    teaspoon: "tsp", teaspoons: "tsp",
  };
  return map[unit.toLowerCase()] ?? unit.toLowerCase();
}

function guessUnit(text: string): string {
  const lower = text.toLowerCase();
  if (/cloves?\s+(?:of\s+)?garlic/i.test(lower)) return "clove";
  if (/cans?\s+/i.test(lower)) return "can";
  if (/slices?\s+/i.test(lower)) return "slice";
  if (/\b(eggs?|chicken breasts?|tomatoes?|lemons?|potatoes?|apples?|bananas?|onions?)\b/i.test(lower)) return "piece";
  if (/bunch/i.test(lower)) return "bunch";
  // Default: grams for meats/veggies, "g" as general default
  return "g";
}

function cleanName(text: string): string {
  return text
    .replace(/\b(?:worth|for)\s+\$?\d+(?:\.\d{1,2})?\b/gi, "")
    .replace(/\$\d+(?:\.\d{1,2})?/g, "")
    .replace(/\bexpires?\s+(?:on\s+)?\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/gi, "")
    .replace(/\bexpires?\s+in\s+\d+\s+(?:day|days|week|weeks)\b/gi, "")
    .replace(/^(cloves?\s+of|cans?\s+of|slices?\s+of|bunch\s+of)\s+/i, "")
    .replace(/\b(cloves?|cans?|slices?|bunch(es)?)\b/gi, "")
    .trim()
    .replace(/\s+/g, " ");
}

function parseLine(line: string): ParsedIngredient | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return null;
  const costMatch = trimmed.match(/(?:\$|\bworth\s+\$?|\bfor\s+\$?)(\d+(?:\.\d{1,2})?)/i);
  const cost = costMatch ? parseFloat(costMatch[1]) : undefined;

  for (const { pattern, extract } of MOCK_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const result = extract(match);
      if (result && result.name.length > 0) return { ...result, cost };
    }
  }
  return null;
}

// Pre-built responses for common free-text descriptions
const CANNED_RESPONSES: Record<string, ParsedIngredient[]> = {
  "i have some chicken and rice": [
    { name: "chicken breast", quantity: 500, unit: "g" },
    { name: "rice", quantity: 300, unit: "g" },
  ],
  "eggs milk butter flour sugar": [
    { name: "egg", quantity: 6, unit: "piece" },
    { name: "milk", quantity: 500, unit: "ml" },
    { name: "butter", quantity: 100, unit: "g" },
    { name: "flour", quantity: 500, unit: "g" },
    { name: "sugar", quantity: 200, unit: "g" },
  ],
  "garlic olive oil pasta tomatoes": [
    { name: "garlic", quantity: 4, unit: "clove" },
    { name: "olive oil", quantity: 60, unit: "ml" },
    { name: "pasta", quantity: 400, unit: "g" },
    { name: "tomato", quantity: 4, unit: "piece" },
  ],
};

/**
 * Mock AI parser. Simulates a 1-2s delay, then returns parsed ingredients.
 * First checks canned responses, then falls back to pattern-based parsing.
 */
export async function mockParseIngredients(text: string): Promise<ParsedIngredient[]> {
  // Simulate network/AI latency
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));

  const lower = text.trim().toLowerCase();

  // Check canned responses
  for (const [key, value] of Object.entries(CANNED_RESPONSES)) {
    if (lower.includes(key) || key.includes(lower)) {
      return value;
    }
  }

  // Split by newlines, commas, or "and"
  const lines = text
    .split(/[\n,]|(?:\band\b)/gi)
    .map((l) => l.trim())
    .filter(Boolean);

  const results: ParsedIngredient[] = [];
  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed) results.push(parsed);
  }

  // If nothing parsed, try the whole thing as one ingredient
  if (results.length === 0) {
    const fallback = parseLine(text.trim());
    if (fallback) results.push(fallback);
  }

  return results;
}
