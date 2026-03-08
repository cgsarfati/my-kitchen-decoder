import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COMMON_UNITS, type PantryItem } from "@/types/pantry";

interface PantryInputProps {
  onAdd: (item: Omit<PantryItem, "id">) => void;
}

const PantryInput = ({ onAdd }: PantryInputProps) => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("piece");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !quantity) return;
    onAdd({ name: trimmed, quantity: parseFloat(quantity), unit });
    setName("");
    setQuantity("");
    setUnit("piece");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <Input
        placeholder="Ingredient (e.g. chicken breast)"
        value={name}
        onChange={(e) => setName(e.target.value)}
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
  );
};

export default PantryInput;
