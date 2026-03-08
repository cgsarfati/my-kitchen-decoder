import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COMMON_UNITS, type PantryItem } from "@/types/pantry";
import { checkGenericIngredient } from "@/lib/ingredientValidation";

interface PantryInputProps {
  onAdd: (item: Omit<PantryItem, "id">) => void;
}

const PantryInput = ({ onAdd }: PantryInputProps) => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("piece");
  const [genericSuggestions, setGenericSuggestions] = useState<string[] | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    // Clear suggestions when user edits
    if (genericSuggestions) {
      setGenericSuggestions(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !quantity) return;

    // Check for generic ingredients
    const suggestions = checkGenericIngredient(trimmed);
    if (suggestions) {
      setGenericSuggestions(suggestions);
      return;
    }

    onAdd({ name: trimmed, quantity: parseFloat(quantity), unit });
    setName("");
    setQuantity("");
    setUnit("piece");
    setGenericSuggestions(null);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setName(suggestion);
    setGenericSuggestions(null);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Ingredient (e.g. chicken breast)"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="flex-1 bg-card"
        />
        <div className="flex gap-3">
          <Input
            type="number"
            placeholder="Qty"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-24 bg-card"
            min="0"
            step="any"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
    </div>
  );
};

export default PantryInput;
