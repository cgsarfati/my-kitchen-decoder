import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubstituteSuggestionProps {
  ingredientName: string;
  recipeName: string;
  pantryItems: string[];
}

// Mock substitution data keyed by ingredient name (lowercase)
const MOCK_SUBSTITUTES: Record<string, { substitute: string; instruction: string; fromPantry: string[] }> = {
  lemon: {
    substitute: "Apple cider vinegar",
    instruction:
      "Use 1½ tbsp apple cider vinegar in place of 1 lemon's juice. It adds a similar tartness and acidity that works well in this marinade.",
    fromPantry: ["apple cider vinegar"],
  },
  "fresh thyme": {
    substitute: "Dried thyme",
    instruction:
      "Use ½ tsp dried thyme instead of 2 sprigs fresh thyme. Dried herbs are more concentrated — crumble it between your fingers first to release the oils.",
    fromPantry: ["dried thyme"],
  },
  buttermilk: {
    substitute: "Milk + lemon juice",
    instruction:
      "Mix 1 cup of milk with 1 tbsp lemon juice or vinegar. Stir and let it sit for 5 minutes to curdle — works perfectly as a buttermilk substitute.",
    fromPantry: ["milk"],
  },
  "soy sauce": {
    substitute: "Worcestershire sauce + salt",
    instruction:
      "Use 1 tbsp Worcestershire sauce + a pinch of salt per 2 tbsp soy sauce needed. It won't be identical but gives a similar umami depth.",
    fromPantry: [],
  },
};

const SubstituteSuggestion = ({ ingredientName, recipeName, pantryItems }: SubstituteSuggestionProps) => {
  const [state, setState] = useState<"idle" | "loading" | "shown">("idle");
  const [isExpanded, setIsExpanded] = useState(true);

  const key = ingredientName.toLowerCase();
  const mock = MOCK_SUBSTITUTES[key];

  // Check if any pantry item overlaps with what the mock uses
  const pantryLower = pantryItems.map((p) => p.toLowerCase());
  const hasPantryMatch =
    mock?.fromPantry.length === 0 ||
    mock?.fromPantry.some((sub) => pantryLower.some((p) => p.includes(sub) || sub.includes(p)));

  const handleSuggest = () => {
    setState("loading");
    // Simulate a short AI call delay
    setTimeout(() => setState("shown"), 1200);
  };

  if (state === "idle") {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-primary hover:bg-primary/10 ml-1"
        onClick={handleSuggest}
      >
        <Sparkles className="h-3 w-3" />
        Suggest sub
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

  // shown state
  if (!mock) {
    return (
      <span className="inline-block mt-1 text-xs text-muted-foreground italic ml-1">
        No substitute found for this ingredient.
      </span>
    );
  }

  return (
    <div className="mt-2 ml-6 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium text-primary">
          <Sparkles className="h-3 w-3 shrink-0" />
          <span>
            Use <strong>{mock.substitute}</strong>
            {hasPantryMatch && mock.fromPantry.length > 0 && (
              <span className="ml-1 text-success font-normal">(you have this ✓)</span>
            )}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded((e) => !e)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>
      {isExpanded && (
        <p className="text-foreground/80 leading-relaxed">{mock.instruction}</p>
      )}
    </div>
  );
};

export default SubstituteSuggestion;
