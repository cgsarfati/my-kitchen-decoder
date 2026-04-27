import type { IngredientMatchStatus } from "@/lib/unitConversion";

export interface RecipeIngredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  original: string;
}

export interface RecipeIngredientWithStatus extends RecipeIngredient {
  status: IngredientMatchStatus;
}

export interface Recipe {
  id: number;
  title: string;
  image: string;
  isAiGenerated?: boolean;
  generationNote?: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  usedIngredients: RecipeIngredient[];
  missedIngredients: RecipeIngredient[];
  servings: number;
  readyInMinutes: number;
  instructions: string;
  sourceUrl: string;
  extendedIngredients: RecipeIngredient[];
  /** Populated client-side after quantity matching */
  matchedIngredients?: RecipeIngredientWithStatus[];
  insufficientCount?: number;
  /** Max servings user can make based on pantry quantities (full matches only) */
  maxServings?: number | null;
  /** Pantry ingredients in this recipe that expire soon */
  expiringSoonIngredients?: string[];
  expiringSoonDays?: number | null;
}
