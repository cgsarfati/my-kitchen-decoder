import { useState, useRef, useEffect } from "react";
import { Plus, AlertTriangle, SpellCheck, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COMMON_UNITS, type PantryItem } from "@/types/pantry";
import { checkGenericIngredient } from "@/lib/ingredientValidation";
import { getSpellSuggestions, KNOWN_INGREDIENTS } from "@/lib/spellCheck";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

interface PantryInputProps {
  onAdd: (item: Omit<PantryItem, "id">) => void;
}

const PantryInput = ({ onAdd }: PantryInputProps) => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [cost, setCost] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [genericSuggestions, setGenericSuggestions] = useState<string[] | null>(null);
  const [spellSuggestions, setSpellSuggestions] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<{ name?: boolean; qty?: boolean }>({});
  const [autocomplete, setAutocomplete] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Close autocomplete on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    if (genericSuggestions) setGenericSuggestions(null);
    if (spellSuggestions) setSpellSuggestions(null);
    if (error) { setError(null); setErrorFields({}); }

    // Autocomplete
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length >= 2) {
      const matches = KNOWN_INGREDIENTS.filter((ing) => ing.includes(trimmed))
        .sort((a, b) => {
          // Prioritize starts-with matches
          const aStarts = a.startsWith(trimmed) ? 0 : 1;
          const bStarts = b.startsWith(trimmed) ? 0 : 1;
          if (aStarts !== bStarts) return aStarts - bStarts;
          return a.length - b.length;
        })
        .slice(0, 6);
      setAutocomplete(matches);
      setShowAutocomplete(matches.length > 0);
      setActiveIndex(-1);
    } else {
      setAutocomplete([]);
      setShowAutocomplete(false);
    }
  };

  const handleAutocompleteSelect = (suggestion: string) => {
    setName(suggestion);
    setAutocomplete([]);
    setShowAutocomplete(false);
    setActiveIndex(-1);
    // Focus qty field after selection
    setTimeout(() => {
      const qtyInput = document.querySelector<HTMLInputElement>('input[placeholder="Qty"]');
      qtyInput?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete || autocomplete.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < autocomplete.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : autocomplete.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleAutocompleteSelect(autocomplete[activeIndex]);
    } else if (e.key === "Escape") {
      setShowAutocomplete(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAutocomplete(false);
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
      trackEvent(AnalyticsEvents.VALIDATION_ERROR, { type: "missing_qty", ingredient: trimmed });
      return;
    }
    setError(null);
    setErrorFields({});

    // Check for generic ingredients first
    const generic = checkGenericIngredient(trimmed);
    if (generic) {
      setGenericSuggestions(generic);
      setSpellSuggestions(null);
      trackEvent(AnalyticsEvents.GENERIC_INGREDIENT_BLOCKED, { ingredient: trimmed, suggestions: generic.slice(0, 3) });
      return;
    }

    // Check for misspellings
    const spell = getSpellSuggestions(trimmed);
    if (spell) {
      setSpellSuggestions(spell);
      setGenericSuggestions(null);
      trackEvent(AnalyticsEvents.SPELL_SUGGESTION_SHOWN, { input: trimmed, suggestions: spell });
      return;
    }

    onAdd({ name: trimmed, quantity: parseFloat(quantity), unit, cost: cost ? parseFloat(cost) : undefined, expiresAt: expiresAt || undefined });
    setName("");
    setQuantity("");
    setCost("");
    setExpiresAt("");
    setUnit("g");
    setGenericSuggestions(null);
    setSpellSuggestions(null);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (spellSuggestions) {
      trackEvent(AnalyticsEvents.SPELL_SUGGESTION_ACCEPTED, { original: name.trim(), accepted: suggestion });
    }
    setName(suggestion);
    setGenericSuggestions(null);
    setSpellSuggestions(null);
  };

  const handleAddAnyway = () => {
    const trimmed = name.trim();
    if (!trimmed || !quantity) return;
    trackEvent(AnalyticsEvents.SPELL_ADD_ANYWAY, { ingredient: trimmed });
    onAdd({ name: trimmed, quantity: parseFloat(quantity), unit, cost: cost ? parseFloat(cost) : undefined, expiresAt: expiresAt || undefined });
    setName("");
    setQuantity("");
    setCost("");
    setExpiresAt("");
    setUnit("g");
    setSpellSuggestions(null);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder="Ingredient (e.g. chicken breast)"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => { if (autocomplete.length > 0) setShowAutocomplete(true); }}
              onKeyDown={handleKeyDown}
              className={`bg-card ${errorFields.name ? "border-destructive ring-1 ring-destructive" : ""}`}
              autoComplete="off"
            />
            {showAutocomplete && autocomplete.length > 0 && (
            <div
              ref={autocompleteRef}
              className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
            >
              {autocomplete.map((item, i) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleAutocompleteSelect(item)}
                  className={`w-full text-left px-3 py-2 text-sm capitalize transition-colors ${
                    i === activeIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-popover-foreground hover:bg-accent/50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            )}
          </div>
          <div className="flex gap-3">
            <Input type="number" placeholder="Qty" value={quantity} onChange={(e) => { setQuantity(e.target.value); if (error) { setError(null); setErrorFields({}); } }} className={`w-24 bg-card ${errorFields.qty ? "border-destructive ring-1 ring-destructive" : ""}`} min="0" step="any" />
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="h-10 rounded-md border border-input bg-card pl-3 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_6px_center] bg-no-repeat">
              {COMMON_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input type="number" placeholder="Cost" value={cost} onChange={(e) => setCost(e.target.value)} className="bg-card pl-8" min="0" step="0.01" />
          </div>
          <div className="relative flex-1">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              aria-label="Expiration date optional"
              title="Expiration date (optional)"
              className="bg-card pl-8 text-foreground dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0"
            />
            {!expiresAt && (
              <span className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 text-sm text-muted-foreground sm:hidden">
                Expires (optional)
              </span>
            )}
          </div>
          <Button type="submit" variant="hero" size="icon" className="shrink-0 self-stretch sm:self-auto">
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
