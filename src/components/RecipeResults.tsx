import { Loader2 } from "lucide-react";
import RecipeCard from "@/components/RecipeCard";
import type { Recipe } from "@/types/recipe";

interface RecipeResultsProps {
  recipes: Recipe[];
  isLoading: boolean;
  hasSearched: boolean;
  onRecipeClick: (recipe: Recipe) => void;
}

const RecipeResults = ({ recipes, isLoading, hasSearched, onRecipeClick }: RecipeResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Searching for recipes…</p>
      </div>
    );
  }

  if (!hasSearched) return null;

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg">No recipes found</p>
        <p className="text-sm mt-1">Try adding more ingredients to your pantry</p>
      </div>
    );
  }

  // Sort: full matches first (0 missing), then by fewer missing ingredients
  const sorted = [...recipes].sort((a, b) => {
    if (a.missedIngredientCount !== b.missedIngredientCount) {
      return a.missedIngredientCount - b.missedIngredientCount;
    }
    return b.usedIngredientCount - a.usedIngredientCount;
  });

  const fullMatches = sorted.filter((r) => r.missedIngredientCount === 0);
  const partialMatches = sorted.filter((r) => r.missedIngredientCount > 0);

  return (
    <section className="space-y-6">
      {fullMatches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl text-foreground font-body font-semibold">
            Ready to Cook ({fullMatches.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fullMatches.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={onRecipeClick} />
            ))}
          </div>
        </div>
      )}

      {partialMatches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl text-foreground font-body font-semibold">
            Almost There ({partialMatches.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {partialMatches.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={onRecipeClick} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default RecipeResults;
