export interface RecipeIngredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  original: string;
}

export interface Recipe {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  usedIngredients: RecipeIngredient[];
  missedIngredients: RecipeIngredient[];
  servings: number;
  readyInMinutes: number;
  instructions: string;
  sourceUrl: string;
  extendedIngredients: RecipeIngredient[];
}
