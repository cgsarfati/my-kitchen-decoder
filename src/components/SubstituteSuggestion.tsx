import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";
import type { PantryItem } from "@/types/pantry";

interface SubstituteSuggestionProps {
  ingredientName: string;
  recipeName: string;
  pantryItems: PantryItem[];
  requiredAmount?: number;
  requiredUnit?: string;
  reason: "missing" | "insufficient";
  haveAmount?: number;
  haveUnit?: string;
  /** When true, use hardcoded mocks instead of hitting the AI gateway. */
  demoMode?: boolean;
}

/** Demo Mode fallback — keeps cert-class walkthrough deterministic and quota-free. */
const MOCK_SUBSTITUTES: Record<
  string,
  {
    substitute: string;
    instruction: string;
    fromPantry: string[];
    sufficientInPantry: boolean;
    pantryUsage: { name: string; needAmount: number; needUnit: string }[];
  }
> = {
  lemon: {
    substitute: "Apple cider vinegar",
    instruction:
      "Use 1½ tbsp apple cider vinegar in place of 1 lemon's juice. It adds a similar tartness for this marinade.",
    fromPantry: ["apple cider vinegar"],
    sufficientInPantry: true,
    pantryUsage: [{ name: "apple cider vinegar", needAmount: 22, needUnit: "ml" }],
  },
  "fresh thyme": {
    substitute: "Dried thyme",
    instruction:
      "Use ½ tsp dried thyme instead of 2 sprigs fresh thyme. Crumble it between your fingers first to release the oils.",
    fromPantry: ["dried thyme"],
    sufficientInPantry: true,
    pantryUsage: [{ name: "dried thyme", needAmount: 1, needUnit: "g" }],
  },
  buttermilk: {
    substitute: "Milk + lemon juice",
    instruction:
      "Mix 1 cup milk with 1 tbsp lemon juice or vinegar. Let it sit 5 minutes to curdle.",
    fromPantry: ["milk"],
    sufficientInPantry: true,
    pantryUsage: [{ name: "milk", needAmount: 240, needUnit: "ml" }],
  },
  "soy sauce": {
    substitute: "Worcestershire sauce + salt",
    instruction:
      "Use 1 tbsp Worcestershire sauce + a pinch of salt per 2 tbsp soy sauce needed. Similar umami depth.",
    fromPantry: [],
    sufficientInPantry: false,
    pantryUsage: [],
  },
};

interface PantryUsage {
  name: string;
  needAmount: number;
  needUnit: string;
}

interface Suggestion {
  substitute: string;
  instruction: string;
  fromPantry: string[];
  sufficientInPantry: boolean;
  pantryUsage?: PantryUsage[];
  confidence?: "high" | "medium" | "low";
}

const SubstituteSuggestion = ({
  ingredientName,
  recipeName,
  pantryItems,
  requiredAmount,
  requiredUnit,
  reason,
  haveAmount,
  haveUnit,
  demoMode = false,
}: SubstituteSuggestionProps) => {
  const [state, setState] = useState<"idle" | "loading" | "shown" | "error">("idle");
  const [isExpanded, setIsExpanded] = useState(true);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const handleSuggest = async () => {
    setState("loading");
    trackEvent(AnalyticsEvents.AI_SUB_REQUESTED, {
      ingredient: ingredientName,
      recipe: recipeName,
      reason,
      demo: demoMode,
    });

    if (demoMode) {
      await new Promise((r) => setTimeout(r, 900));
      const mock = MOCK_SUBSTITUTES[ingredientName.toLowerCase()] ?? null;
      if (!mock) {
        setSuggestion(null);
        setState("shown");
        return;
      }
      setSuggestion({ ...mock, confidence: "high" });
      setState("shown");
      trackEvent(AnalyticsEvents.AI_SUB_SHOWN, { ingredient: ingredientName, source: "mock" });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("suggest-substitute", {
        body: {
          ingredientName,
          recipeName,
          reason,
          requiredAmount,
          requiredUnit,
          haveAmount,
          haveUnit,
          pantryItems: pantryItems.map((p) => ({
            name: p.name,
            quantity: p.quantity,
            unit: p.unit,
          })),
        },
      });

      if (error) {
        const status = (error as unknown as { context?: { status?: number } })?.context?.status;
        if (status === 429) {
          toast({ title: "AI rate limit", description: "Try again in a moment.", variant: "destructive" });
        } else if (status === 402) {
          toast({ title: "AI usage limit reached", description: "Add credits to keep going.", variant: "destructive" });
        } else {
          toast({ title: "Couldn't get a substitute", description: error.message, variant: "destructive" });
        }
        trackEvent(AnalyticsEvents.AI_SUB_FAILED, { ingredient: ingredientName, status: status ?? "unknown" });
        setState("error");
        return;
      }

      if (!data || data.error) {
        toast({ title: "No substitute found", description: data?.message ?? "Try another ingredient.", variant: "destructive" });
        trackEvent(AnalyticsEvents.AI_SUB_FAILED, { ingredient: ingredientName, reason: data?.error });
        setState("error");
        return;
      }

      setSuggestion(data as Suggestion);
      setState("shown");
      trackEvent(AnalyticsEvents.AI_SUB_SHOWN, {
        ingredient: ingredientName,
        source: "ai",
        from_pantry: (data as Suggestion).fromPantry?.length > 0,
        sufficient: (data as Suggestion).sufficientInPantry,
      });
    } catch (e) {
      console.error("suggest-substitute invoke failed:", e);
      toast({ title: "Couldn't get a substitute", description: "Please try again.", variant: "destructive" });
      trackEvent(AnalyticsEvents.AI_SUB_FAILED, { ingredient: ingredientName, error: String(e) });
      setState("error");
    }
  };

  if (state === "idle" || state === "error") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-primary hover:bg-primary/10 ml-1"
        onClick={handleSuggest}
      >
        <Sparkles className="h-3 w-3" />
        {state === "error" ? "Try again" : "Suggest sub"}
      </Button>
    );
  }

  if (state === "loading") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Finding substitute…
      </span>
    );
  }

  if (!suggestion) {
    return (
      <span className="inline-block mt-1 text-xs text-muted-foreground italic ml-1">
        No substitute found for this ingredient.
      </span>
    );
  }

  const hasPantryMatch = suggestion.fromPantry.length > 0;
  const hasSubstitute = suggestion.substitute.trim().length > 0;

  // Build the "need vs have" rows for each pantry item the substitute uses.
  // Prefer structured pantryUsage from the AI; fall back to fromPantry names if missing.
  const usageRows: { name: string; need?: PantryUsage; have?: PantryItem }[] =
    (suggestion.pantryUsage && suggestion.pantryUsage.length > 0
      ? suggestion.pantryUsage
      : suggestion.fromPantry.map((n) => ({ name: n, needAmount: 0, needUnit: "" }))
    ).map((u) => {
      const nameLower = u.name.toLowerCase();
      const have =
        pantryItems.find((p) => p.name.toLowerCase() === nameLower) ??
        pantryItems.find(
          (p) => p.name.toLowerCase().includes(nameLower) || nameLower.includes(p.name.toLowerCase()),
        );
      return { name: u.name, need: u.needAmount > 0 ? u : undefined, have };
    });

  return (
    <div className="mt-2 ml-6 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium text-primary">
          <Sparkles className="h-3 w-3 shrink-0" />
          <span>
            {hasSubstitute ? (
              <>Use <strong>{suggestion.substitute}</strong></>
            ) : (
              <span className="text-warning inline-flex items-center gap-0.5">
                <AlertTriangle className="h-3 w-3" /> No good substitute
              </span>
            )}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded((e) => !e)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>
      {isExpanded && (
        <>
          <p className="text-foreground/80 leading-relaxed min-h-[2.5rem]">{suggestion.instruction}</p>
          {hasPantryMatch && usageRows.length > 0 && (
            <ul className="space-y-1 pt-1 border-t border-primary/10">
              {usageRows.map((row, i) => {
                const haveLabel = row.have
                  ? `${row.have.quantity}${row.have.unit ? ` ${row.have.unit}` : ""}`
                  : "0";
                const needLabel = row.need
                  ? `${row.need.needAmount}${row.need.needUnit ? ` ${row.need.needUnit}` : ""}`
                  : null;
                const enough = row.have != null && (suggestion.sufficientInPantry || !needLabel);
                return (
                  <li key={i} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-foreground/70 capitalize truncate">{row.name}</span>
                    <span className="flex items-center gap-1.5 shrink-0 font-mono">
                      {needLabel && (
                        <span className="text-muted-foreground">need {needLabel}</span>
                      )}
                      {needLabel && <span className="text-muted-foreground/50">·</span>}
                      <span
                        className={
                          enough
                            ? "text-success font-medium"
                            : row.have
                            ? "text-warning font-medium"
                            : "text-destructive font-medium"
                        }
                      >
                        have {haveLabel} {enough ? "✓" : row.have ? "⚠" : "✗"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default SubstituteSuggestion;
