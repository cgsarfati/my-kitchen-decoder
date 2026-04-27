import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";
import type { PantryItem } from "@/types/pantry";
import type { Recipe } from "@/types/recipe";

interface RecipeAdaptationProps {
  recipe: Recipe;
  pantryItems: PantryItem[];
  demoMode?: boolean;
  placement: "card" | "detail";
}

interface AdaptationResult {
  canAdapt: boolean;
  title: string;
  summary: string;
  changes: string[];
  pantryIngredientsUsed: string[];
  blockers: string[];
  confidence: "high" | "medium" | "low";
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

const pantryHas = (pantryItems: PantryItem[], terms: string[]) =>
  pantryItems.some((item) => terms.some((term) => normalize(item.name).includes(term)));

const buildMockAdaptation = (recipe: Recipe, pantryItems: PantryItem[]): AdaptationResult => {
  const recipeText = normalize(`${recipe.title} ${recipe.extendedIngredients.map((i) => i.name).join(" ")}`);
  const missing = (recipe.matchedIngredients ?? [])
    .filter((item) => item.status === "missing" || item.status === "insufficient")
    .map((item) => item.name);
  const pantryNames = pantryItems.map((item) => item.name);

  if (recipeText.includes("chicken") && pantryHas(pantryItems, ["beef", "ground beef", "steak"])) {
    return {
      canAdapt: true,
      title: "Turn it into a beef version",
      summary: "This recipe can stay in the same lane if beef becomes the main protein and the seasonings are kept savory.",
      changes: [
        "Swap the chicken for beef and brown it first so the finished dish still has depth.",
        "Keep garlic, onion, tomato, rice, pasta, or warm spices as written if they appear in the recipe.",
        "Skip delicate chicken-only steps like poaching; use a shorter sear or simmer instead.",
      ],
      pantryIngredientsUsed: pantryNames.filter((name) => normalize(name).includes("beef")).slice(0, 2),
      blockers: [],
      confidence: "high",
    };
  }

  if (recipeText.includes("olive oil") && pantryHas(pantryItems, ["butter", "avocado oil", "vegetable oil"] )) {
    const fat = pantryNames.find((name) => ["butter", "avocado oil", "vegetable oil"].some((term) => normalize(name).includes(term))) ?? "pantry fat";
    return {
      canAdapt: true,
      title: `Use ${fat} as the cooking fat`,
      summary: "The recipe does not need to change much; the pantry fat can carry the cooking step without changing the dish identity.",
      changes: [
        `Use ${fat} anywhere the recipe asks you to sauté or roast with olive oil.`,
        "If using butter, keep the heat medium so it does not brown before the main ingredients cook.",
        "Finish with a small pinch of salt or acid if the recipe loses brightness without olive oil.",
      ],
      pantryIngredientsUsed: [fat],
      blockers: [],
      confidence: "medium",
    };
  }

  if (recipeText.includes("lemon") && pantryHas(pantryItems, ["vinegar", "lime"] )) {
    const acid = pantryNames.find((name) => ["vinegar", "lime"].some((term) => normalize(name).includes(term))) ?? "pantry acid";
    return {
      canAdapt: true,
      title: `Rebalance the acidity with ${acid}`,
      summary: "The recipe can keep its bright flavor if the missing citrus is treated as acidity rather than a literal ingredient.",
      changes: [
        `Use ${acid} a little at a time where the recipe calls for lemon juice.`,
        "Add it near the end, then taste before adding more.",
        "Skip lemon zest if listed; it is aromatic, but not essential to making the recipe work.",
      ],
      pantryIngredientsUsed: [acid],
      blockers: [],
      confidence: "medium",
    };
  }

  return {
    canAdapt: false,
    title: "Not a good pantry adaptation",
    summary: "I would not force this recipe with the current pantry because the missing ingredients define the dish rather than just seasoning it.",
    changes: [],
    pantryIngredientsUsed: [],
    blockers: missing.length > 0 ? missing.slice(0, 3) : recipe.missedIngredients.map((item) => item.name).slice(0, 3),
    confidence: "low",
  };
};

const RecipeAdaptation = ({ recipe, pantryItems, demoMode = false, placement }: RecipeAdaptationProps) => {
  const [state, setState] = useState<"idle" | "loading" | "shown" | "error">("idle");
  const [isExpanded, setIsExpanded] = useState(true);
  const [adaptation, setAdaptation] = useState<AdaptationResult | null>(null);

  const missingNames = useMemo(
    () => (recipe.matchedIngredients ?? [])
      .filter((item) => item.status === "missing" || item.status === "insufficient")
      .map((item) => item.name),
    [recipe.matchedIngredients],
  );

  const handleAdapt = async (event: React.MouseEvent) => {
    event.stopPropagation();
    setState("loading");
    trackEvent(AnalyticsEvents.AI_ADAPT_REQUESTED, { recipe: recipe.title, demo: demoMode, placement });

    if (demoMode) {
      await new Promise((resolve) => setTimeout(resolve, 750));
      const mock = buildMockAdaptation(recipe, pantryItems);
      setAdaptation(mock);
      setState("shown");
      trackEvent(AnalyticsEvents.AI_ADAPT_SHOWN, { recipe: recipe.title, source: "mock", can_adapt: mock.canAdapt });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("adapt-recipe", {
        body: {
          recipe: {
            title: recipe.title,
            servings: recipe.servings,
            readyInMinutes: recipe.readyInMinutes,
            ingredients: recipe.extendedIngredients.map((item) => ({
              name: item.name,
              amount: item.amount,
              unit: item.unit,
              original: item.original,
            })),
            missingIngredients: missingNames,
            instructions: recipe.instructions,
          },
          pantryItems: pantryItems.map((item) => ({ name: item.name, quantity: item.quantity, unit: item.unit })),
        },
      });

      if (error) {
        const status = (error as unknown as { context?: { status?: number } })?.context?.status;
        toast({
          title: status === 429 ? "AI rate limit" : status === 402 ? "AI usage limit reached" : "Couldn't adapt recipe",
          description: status === 429 ? "Try again in a moment." : status === 402 ? "Add credits to keep going." : error.message,
          variant: "destructive",
        });
        setState("error");
        trackEvent(AnalyticsEvents.AI_ADAPT_FAILED, { recipe: recipe.title, status: status ?? "unknown" });
        return;
      }

      setAdaptation(data as AdaptationResult);
      setState("shown");
      trackEvent(AnalyticsEvents.AI_ADAPT_SHOWN, { recipe: recipe.title, source: "ai", can_adapt: (data as AdaptationResult).canAdapt });
    } catch (error) {
      console.error("adapt-recipe invoke failed:", error);
      toast({ title: "Couldn't adapt recipe", description: "Please try again.", variant: "destructive" });
      setState("error");
      trackEvent(AnalyticsEvents.AI_ADAPT_FAILED, { recipe: recipe.title, error: String(error) });
    }
  };

  const compact = placement === "card";

  if (state === "idle" || state === "error") {
    return (
      <Button
        type="button"
        variant={compact ? "outline" : "secondary"}
        size="sm"
        className={compact ? "w-full gap-2 text-xs" : "gap-2"}
        onClick={handleAdapt}
      >
        <Wand2 className="h-3.5 w-3.5" />
        {state === "error" ? "Try adaptation again" : "Adapt with pantry"}
      </Button>
    );
  }

  if (state === "loading") {
    return (
      <div className={compact ? "flex items-center justify-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground" : "flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Adapting recipe…
      </div>
    );
  }

  if (!adaptation) return null;

  return (
    <div
      className={compact ? "rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-2" : "rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 font-medium text-primary">
            {adaptation.canAdapt ? <Sparkles className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />}
            <span className="truncate">{adaptation.title}</span>
          </div>
          {!compact && (
            <Badge variant="outline" className="text-[11px] capitalize">
              {adaptation.confidence} fit
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); setIsExpanded((value) => !value); }}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label={isExpanded ? "Collapse adaptation" : "Expand adaptation"}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          <p className={compact ? "text-foreground/80 leading-relaxed line-clamp-3" : "text-sm text-foreground/85 leading-relaxed"}>
            {adaptation.summary}
          </p>
          {adaptation.canAdapt ? (
            <ul className={compact ? "space-y-1 text-foreground/75" : "space-y-1.5 text-sm text-foreground/80"}>
              {adaptation.changes.map((change, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-primary font-semibold">{index + 1}.</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          ) : adaptation.blockers.length > 0 ? (
            <p className={compact ? "text-warning" : "text-sm text-warning"}>
              Blockers: {adaptation.blockers.join(", ")}
            </p>
          ) : null}
          {adaptation.pantryIngredientsUsed.length > 0 && (
            <p className={compact ? "text-[11px] text-muted-foreground" : "text-xs text-muted-foreground"}>
              Uses pantry: {adaptation.pantryIngredientsUsed.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RecipeAdaptation;
