import { useState } from "react";
import { Plus, AlertTriangle, SpellCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COMMON_UNITS, type PantryItem } from "@/types/pantry";
import { checkGenericIngredient } from "@/lib/ingredientValidation";
import { getSpellSuggestions } from "@/lib/spellCheck";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

interface PantryInputProps {
  onAdd: (item: Omit<PantryItem, "id">) => void;
}

const PantryInput = ({ onAdd }: PantryInputProps) => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [genericSuggestions, setGenericSuggestions] = useState<string[] | null>(null);
  const [spellSuggestions, setSpellSuggestions] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<{ name?: boolean; qty?: boolean }>({});

  const handleNameChange = (value: string) => {
    setName(value);
    if (genericSuggestions) setGenericSuggestions(null);
    if (spellSuggestions) setSpellSuggestions(null);
    if (error) { setError(null); setErrorFields({}); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed && (!quantity || parseFloat(quantity) <= 0)) {
      setError("Please enter an ingredient and quantity.");
      setErrorFields({ name: true, qty: true });
      trackEvent(AnalyticsEvents.VALIDATION_ERROR, { type: "missing_both" });
      return;
    }
    if (!trimmed) {
      setError("Please enter an ingredient name.");
      setErrorFields({ name: true });
      trackEvent(AnalyticsEvents.VALIDATION_ERROR, { type: "missing_name" });
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      setError("Please enter a quantity.");
      setErrorFields({ qty: true });
      return;
    }
    setError(null);
    setErrorFields({});

    // Check for generic ingredients first
    const generic = checkGenericIngredient(trimmed);
    if (generic) {
      setGenericSuggestions(generic);
      setSpellSuggestions(null);
      return;
    }

    // Check for misspellings
    const spell = getSpellSuggestions(trimmed);
    if (spell) {
      setSpellSuggestions(spell);
      setGenericSuggestions(null);
      return;
    }

    onAdd({ name: trimmed, quantity: parseFloat(quantity), unit });
    setName("");
    setQuantity("");
    setUnit("g");
    setGenericSuggestions(null);
    setSpellSuggestions(null);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setName(suggestion);
    setGenericSuggestions(null);
    setSpellSuggestions(null);
  };

  const handleAddAnyway = () => {
    const trimmed = name.trim();
    if (!trimmed || !quantity) return;
    onAdd({ name: trimmed, quantity: parseFloat(quantity), unit });
    setName("");
    setQuantity("");
    setUnit("g");
    setSpellSuggestions(null);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Ingredient (e.g. chicken breast)"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className={`flex-1 bg-card ${errorFields.name ? "border-destructive ring-1 ring-destructive" : ""}`}
        />
        <div className="flex gap-3">
          <Input
            type="number"
            placeholder="Qty"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              if (error) { setError(null); setErrorFields({}); }
            }}
            className={`w-24 bg-card ${errorFields.qty ? "border-destructive ring-1 ring-destructive" : ""}`}
            min="0"
            step="any"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="h-10 rounded-md border border-input bg-card pl-3 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_6px_center] bg-no-repeat"
          >
            {COMMON_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <Button type="submit" variant="hero" size="icon" className="shrink-0">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </form>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {genericSuggestions && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold capitalize">"{name.trim()}"</span> is too generic for accurate matching. Pick a specific type:
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {genericSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 text-sm rounded-full border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors capitalize"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {spellSuggestions && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <SpellCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              Did you mean one of these instead of <span className="font-semibold">"{name.trim()}"</span>?
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {spellSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 text-sm rounded-full border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors capitalize"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddAnyway}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Add "{name.trim()}" anyway
          </button>
        </div>
      )}
    </div>
  );
};

export default PantryInput;
