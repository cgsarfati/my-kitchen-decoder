import { Clock, Users, CheckCircle2, AlertCircle, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Recipe } from "@/types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
}

const RecipeCard = ({ recipe, onClick }: RecipeCardProps) => {
  const isFullMatch = recipe.missedIngredientCount === 0 && (recipe.insufficientCount ?? 0) === 0;

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-kitchen-lg transition-all hover:-translate-y-1 border-border bg-card"
      onClick={() => onClick(recipe)}
    >
      <div className="relative">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        {/* Gradient overlay for better badge contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {isFullMatch ? (
          <Badge className="absolute top-3 left-3 bg-success text-success-foreground gap-1 shadow-sm">
            <CheckCircle2 className="h-3 w-3" />
            Full Match
          </Badge>
        ) : recipe.missedIngredientCount > 0 ? (
          <Badge variant="secondary" className="absolute top-3 left-3 gap-1 shadow-sm">
            <AlertCircle className="h-3 w-3" />
            {recipe.missedIngredientCount} missing
          </Badge>
        ) : (
          <Badge className="absolute top-3 left-3 bg-warning text-warning-foreground gap-1 shadow-sm">
            <AlertTriangle className="h-3 w-3" />
            {recipe.insufficientCount} not enough
          </Badge>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold text-foreground text-lg leading-tight line-clamp-2 font-body">
          {recipe.title}
        </h3>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {isFullMatch && recipe.maxServings != null && recipe.maxServings !== recipe.servings
              ? `${recipe.maxServings} of ${recipe.servings} servings`
              : `${recipe.servings} servings`}
          </span>
          {recipe.readyInMinutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {recipe.readyInMinutes} min
            </span>
          )}
        </div>

        {/* Ingredient summary */}
        <div className="space-y-1 border-t border-dashed border-border pt-3">
          {recipe.matchedIngredients ? (
            <>
              {recipe.matchedIngredients.filter((i) => i.status === "have").length > 0 && (
                <p className="text-xs font-medium text-success flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-px" />
                  <span>You have: {recipe.matchedIngredients.filter((i) => i.status === "have").map((i) => i.name).join(", ")}</span>
                </p>
              )}
              {recipe.matchedIngredients.filter((i) => i.status === "insufficient").length > 0 && (
                <p className="text-xs font-medium text-warning flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
                  <span>Not enough: {recipe.matchedIngredients.filter((i) => i.status === "insufficient").map((i) => i.name).join(", ")}</span>
                </p>
              )}
              {recipe.matchedIngredients.filter((i) => i.status === "missing").length > 0 && (
                <p className="text-xs font-medium text-destructive flex items-start gap-1.5">
                  <XCircle className="h-3.5 w-3.5 shrink-0 mt-px" />
                  <span>Missing: {recipe.matchedIngredients.filter((i) => i.status === "missing").map((i) => i.name).join(", ")}</span>
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-xs font-medium text-success flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-px" />
                <span>You have: {recipe.usedIngredients.map((i) => i.name).join(", ")}</span>
              </p>
              {recipe.missedIngredients.length > 0 && (
                <p className="text-xs font-medium text-destructive flex items-start gap-1.5">
                  <XCircle className="h-3.5 w-3.5 shrink-0 mt-px" />
                  <span>Missing: {recipe.missedIngredients.map((i) => i.name).join(", ")}</span>
                </p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
