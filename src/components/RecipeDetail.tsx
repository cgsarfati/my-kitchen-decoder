import { ArrowLeft, Clock, Users, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Recipe } from "@/types/recipe";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
}

const RecipeDetail = ({ recipe, onBack }: RecipeDetailProps) => {
  const usedNames = new Set(recipe.usedIngredients.map((i) => i.name.toLowerCase()));

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to results
      </Button>

      <div className="rounded-xl overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-64 md:h-80 object-cover"
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl text-foreground">{recipe.title}</h2>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {recipe.servings} servings
          </span>
          {recipe.readyInMinutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {recipe.readyInMinutes} min
            </span>
          )}
          {recipe.missedIngredientCount === 0 ? (
            <Badge className="bg-accent text-accent-foreground gap-1">
              <CheckCircle2 className="h-3 w-3" /> Full Match
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              {recipe.missedIngredientCount} missing
            </Badge>
          )}
        </div>
      </div>

      {/* Ingredients */}
      <div className="space-y-3">
        <h3 className="text-xl text-foreground font-body font-semibold">Ingredients</h3>
        <ul className="space-y-2">
          {recipe.extendedIngredients.map((ing, idx) => {
            const isOwned = usedNames.has(ing.name.toLowerCase());
            return (
              <li
                key={`${ing.id}-${idx}`}
                className={`flex items-start gap-2 text-sm ${
                  isOwned ? "text-foreground" : "text-destructive"
                }`}
              >
                {isOwned ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                )}
                <span>
                  {ing.original}
                  {!isOwned && (
                    <span className="ml-1 text-xs text-destructive font-medium">(missing)</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Instructions */}
      {recipe.instructions && (
        <div className="space-y-3">
          <h3 className="text-xl text-foreground font-body font-semibold">Instructions</h3>
          <div
            className="prose prose-sm max-w-none text-foreground/90"
            dangerouslySetInnerHTML={{ __html: recipe.instructions }}
          />
        </div>
      )}

      {recipe.sourceUrl && (
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
        >
          View original recipe <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
};

export default RecipeDetail;
