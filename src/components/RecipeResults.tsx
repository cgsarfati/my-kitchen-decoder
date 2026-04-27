import { useState } from "react";
import { Loader2, ArrowUpDown, Clock, ChefHat, Users, SearchX, FlaskConical, Lightbulb, ListMinus, AlarmClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RecipeCard from "@/components/RecipeCard";
import type { PantryItem } from "@/types/pantry";
import type { Recipe } from "@/types/recipe";

type SortOption = "match" | "expires_soon" | "time" | "servings" | "fewest_missing";

const PAGE_SIZE = 6;

interface RecipeResultsProps {
  recipes: Recipe[];
  isLoading: boolean;
  hasSearched: boolean;
  onRecipeClick: (recipe: Recipe) => void;
  pantryItems?: PantryItem[];
  demoMode?: boolean;
}

const sortRecipes = (recipes: Recipe[], sortBy: SortOption): Recipe[] => {
  return [...recipes].sort((a, b) => {
    if (sortBy === "time") {
      return (a.readyInMinutes || 999) - (b.readyInMinutes || 999);
    }
    if (sortBy === "servings") {
      return (b.servings || 0) - (a.servings || 0);
    }
    if (sortBy === "fewest_missing") {
      const aTotalMissing = a.missedIngredientCount + (a.insufficientCount ?? 0);
      const bTotalMissing = b.missedIngredientCount + (b.insufficientCount ?? 0);
      if (aTotalMissing !== bTotalMissing) return aTotalMissing - bTotalMissing;
      return b.usedIngredientCount - a.usedIngredientCount;
    }
    if (sortBy === "expires_soon") {
      const aCount = a.expiringSoonIngredients?.length ?? 0;
      const bCount = b.expiringSoonIngredients?.length ?? 0;
      if (aCount !== bCount) return bCount - aCount;
      return b.usedIngredientCount - a.usedIngredientCount;
    }
    // Default: match quality
    const aMissing = a.missedIngredientCount;
    const bMissing = b.missedIngredientCount;
    const aInsuff = a.insufficientCount ?? 0;
    const bInsuff = b.insufficientCount ?? 0;
    const aFull = aMissing === 0 && aInsuff === 0;
    const bFull = bMissing === 0 && bInsuff === 0;
    if (aFull !== bFull) return aFull ? -1 : 1;
    if (aMissing !== bMissing) return aMissing - bMissing;
    if (aInsuff !== bInsuff) return aInsuff - bInsuff;
    return b.usedIngredientCount - a.usedIngredientCount;
  });
};

const SORT_LABELS: Record<SortOption, { label: string; icon: React.ReactNode }> = {
  match: { label: "Best Match", icon: <ChefHat className="h-4 w-4" /> },
  expires_soon: { label: "Expires Soon", icon: <AlarmClock className="h-4 w-4" /> },
  fewest_missing: { label: "Fewest Missing", icon: <ListMinus className="h-4 w-4" /> },
  time: { label: "Fastest", icon: <Clock className="h-4 w-4" /> },
  servings: { label: "Most Servings", icon: <Users className="h-4 w-4" /> },
};

const RecipeResults = ({ recipes, isLoading, hasSearched, onRecipeClick, pantryItems = [], demoMode }: RecipeResultsProps) => {
  const [sortBy, setSortBy] = useState<SortOption>("match");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
      <section className="surface-paper rounded-2xl p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <SearchX className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl text-foreground font-body font-semibold">No recipes found</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We couldn't find recipes matching your current ingredients. Here are some things to try:
          </p>
        </div>
        <div className="space-y-2 text-sm max-w-2xl mx-auto">
          <div className="flex items-start justify-center gap-2 text-muted-foreground text-center sm:text-left">
            <Lightbulb className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>Add more common ingredients like <strong>garlic</strong>, <strong>onion</strong>, or <strong>olive oil</strong></span>
          </div>
          <div className="flex items-start justify-center gap-2 text-muted-foreground text-center sm:text-left">
            <Lightbulb className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>Try broader ingredient names (e.g. "chicken" instead of "chicken thigh")</span>
          </div>
          {!demoMode && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <FlaskConical className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <span>Switch to <strong>Demo mode</strong> to test with sample recipes</span>
            </div>
          )}
        </div>
      </section>
    );
  }

  const sorted = sortRecipes(recipes, sortBy);
  const fullMatches = sorted.filter((r) => r.missedIngredientCount === 0 && (r.insufficientCount ?? 0) === 0);
  const partialMatches = sorted.filter((r) => r.missedIngredientCount > 0 || (r.insufficientCount ?? 0) > 0);

  // Show all full matches; paginate only partial matches
  const visiblePartial = partialMatches.slice(0, visibleCount);
  const hasMore = visibleCount < partialMatches.length;

  return (
    <section className="space-y-6">
      {/* Sort controls + result count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} found
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5" />
              {SORT_LABELS[sortBy].label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <DropdownMenuItem
                key={key}
                onClick={() => { setSortBy(key); setVisibleCount(PAGE_SIZE); }}
                className="gap-2"
              >
                {SORT_LABELS[key].icon}
                {SORT_LABELS[key].label}
                {sortBy === key && <span className="ml-auto text-primary">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {fullMatches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl text-foreground font-body font-semibold">
            Ready to Cook ({fullMatches.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fullMatches.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={onRecipeClick} pantryItems={pantryItems} demoMode={demoMode} />
            ))}
          </div>
        </div>
      )}

      {visiblePartial.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl text-foreground font-body font-semibold">
            Almost There ({partialMatches.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visiblePartial.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={onRecipeClick} pantryItems={pantryItems} demoMode={demoMode} />
            ))}
          </div>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="gap-2"
          >
            Show more recipes ({partialMatches.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </section>
  );
};

export default RecipeResults;
