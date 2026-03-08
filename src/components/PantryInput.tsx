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
  const [unit, setUnit] = useState("g");
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
