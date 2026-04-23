import { ArrowLeft, Clock, Users, ExternalLink, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SubstituteSuggestion from "@/components/SubstituteSuggestion";
import type { Recipe } from "@/types/recipe";


/** Parse raw HTML/text instructions into clean numbered steps */
function parseSteps(raw: string): string[] {
  // Strip HTML tags, then split on common patterns
  const text = raw
    .replace(/<li[^>]*>/gi, "|||")
    .replace(/<\/li>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, "");

  let steps: string[];

  if (text.includes("|||")) {
    steps = text.split("|||");
  } else {
    // Split on numbered patterns like "1." or "1)" or newlines
    steps = text.split(/(?:\r?\n)+|(?<=\.)\s+(?=\d+[.)]\s)/).flatMap((s) =>
      s.split(/\d+[.)]\s+/)
    );
  }

  return steps
    .map((s) => s.trim())
    .filter((s) => s.length > 5); // filter out empty/tiny fragments
}

const InstructionSteps = ({ raw }: { raw: string }) => {
  const steps = parseSteps(raw);

  if (steps.length <= 1) {
    // Couldn't parse into steps — render as prose
    return (
      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
        {steps[0] || raw.replace(/<[^>]+>/g, "").trim()}
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-xs">
            {i + 1}
          </span>
          <span className="text-foreground/90 leading-relaxed pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
};

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  pantryItems?: import("@/types/pantry").PantryItem[];
  demoMode?: boolean;
}

const RecipeDetail = ({ recipe, onBack, pantryItems = [], demoMode = false }: RecipeDetailProps) => {
  const isFullMatch = recipe.missedIngredientCount === 0 && (recipe.insufficientCount ?? 0) === 0;

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
        <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {isFullMatch && recipe.maxServings != null && recipe.maxServings !== recipe.servings ? (
              <span>
                <strong className="text-foreground">{recipe.maxServings}</strong> of {recipe.servings} servings
              </span>
            ) : (
              <span>{recipe.servings} servings</span>
            )}
          </span>
          {recipe.readyInMinutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {recipe.readyInMinutes} min
            </span>
          )}
          {isFullMatch ? (
            <Badge className="bg-success text-success-foreground gap-1">
              <CheckCircle2 className="h-3 w-3" /> Full Match
            </Badge>
          ) : (recipe.insufficientCount ?? 0) > 0 && recipe.missedIngredientCount === 0 ? (
            <Badge className="bg-warning text-warning-foreground gap-1">
              <AlertTriangle className="h-3 w-3" /> {recipe.insufficientCount} not enough
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              {recipe.missedIngredientCount} missing
            </Badge>
          )}
        </div>
      </div>

      {/* Two-column layout: recipe content + sticky mini-pantry panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 lg:gap-8 items-start">
        <div className="space-y-6 min-w-0">
          {/* Ingredients */}
          <div className="space-y-3">
            <h3 className="text-xl text-foreground font-body font-semibold">Ingredients</h3>
            <ul className="space-y-2">
              {(recipe.matchedIngredients ?? recipe.extendedIngredients.map((i) => ({ ...i, status: "have" as const }))).map((ing, idx) => (
                <li
                  key={`${ing.id}-${idx}`}
                  className="text-sm"
                >
                  <div className={`flex items-start gap-2 ${
                    ing.status === "have"
                      ? "text-foreground"
                      : ing.status === "insufficient"
                      ? "text-warning"
                      : "text-destructive"
                  }`}>
                    {ing.status === "have" ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
                    ) : ing.status === "insufficient" ? (
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                    )}
                    <span className="flex items-center flex-wrap gap-x-1">
                      {ing.original}
                      {ing.status === "insufficient" && (
                        <span className="text-xs text-warning font-medium">(not enough)</span>
                      )}
                      {ing.status === "missing" && (
                        <span className="text-xs text-destructive font-medium">(missing)</span>
                      )}
                      {(ing.status === "missing" || ing.status === "insufficient") && (() => {
                        const ingNameLower = ing.name.toLowerCase();
                        const matched =
                          ing.status === "insufficient"
                            ? pantryItems.find((p) => p.name.toLowerCase() === ingNameLower) ??
                              pantryItems.find(
                                (p) =>
                                  ingNameLower.includes(p.name.toLowerCase()) ||
                                  p.name.toLowerCase().includes(ingNameLower),
                              )
                            : undefined;
                        return (
                          <SubstituteSuggestion
                            ingredientName={ing.name}
                            recipeName={recipe.title}
                            pantryItems={pantryItems}
                            requiredAmount={ing.amount}
                            requiredUnit={ing.unit}
                            reason={ing.status}
                            haveAmount={matched?.quantity}
                            haveUnit={matched?.unit}
                            demoMode={demoMode}
                          />
                        );
                      })()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          {recipe.instructions && (
            <div className="space-y-3">
              <h3 className="text-xl text-foreground font-body font-semibold">Instructions</h3>
              <InstructionSteps raw={recipe.instructions} />
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

        {/* MOCK: pantry panel — wired to mock highlights for now */}
        <MiniPantryPanel items={panelItems} highlightedNames={MOCK_HIGHLIGHTED} />
      </div>
    </div>
  );
};

export default RecipeDetail;
