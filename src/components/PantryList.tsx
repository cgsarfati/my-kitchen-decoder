import { useState } from "react";
import { X, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PantryItem } from "@/types/pantry";

/** Map ingredient keywords to emoji icons */
const INGREDIENT_ICONS: Record<string, string> = {
  chicken: "🍗", beef: "🥩", steak: "🥩", pork: "🥩", lamb: "🥩",
  turkey: "🦃", fish: "🐟", salmon: "🐟", tuna: "🐟", shrimp: "🦐",
  prawn: "🦐", crab: "🦀", lobster: "🦞", egg: "🥚", tofu: "🧈",
  sausage: "🌭", bacon: "🥓",
  garlic: "🧄", onion: "🧅", potato: "🥔", carrot: "🥕", broccoli: "🥦",
  lettuce: "🥬", spinach: "🥬", kale: "🥬", corn: "🌽", pepper: "🌶️",
  chili: "🌶️", tomato: "🍅", mushroom: "🍄", cucumber: "🥒", zucchini: "🥒",
  eggplant: "🍆", avocado: "🥑", pea: "🫛", bean: "🫘", ginger: "🫚",
  apple: "🍎", banana: "🍌", orange: "🍊", lemon: "🍋", lime: "🍋",
  strawberry: "🍓", blueberry: "🫐", grape: "🍇", peach: "🍑", pear: "🍐",
  cherry: "🍒", watermelon: "🍉", pineapple: "🍍", coconut: "🥥", mango: "🥭",
  rice: "🍚", bread: "🍞", pasta: "🍝", spaghetti: "🍝", noodle: "🍜",
  flour: "🌾", wheat: "🌾", oat: "🌾", cereal: "🥣", tortilla: "🫓",
  pancake: "🥞", waffle: "🧇",
  milk: "🥛", cheese: "🧀", butter: "🧈", cream: "🥛", yogurt: "🥛",
  oil: "🫒", olive: "🫒", vinegar: "🫗", sauce: "🫗", soy: "🫗",
  honey: "🍯", sugar: "🍬", salt: "🧂", ketchup: "🫗", mustard: "🫗",
  peanut: "🥜", almond: "🥜", walnut: "🥜", cashew: "🥜", seed: "🌰", chestnut: "🌰",
  basil: "🌿", thyme: "🌿", rosemary: "🌿", oregano: "🌿", cilantro: "🌿",
  parsley: "🌿", mint: "🌿", cinnamon: "🫙", cumin: "🫙", paprika: "🫙", turmeric: "🫙",
  water: "💧", wine: "🍷", beer: "🍺", coffee: "☕", tea: "🍵",
  chocolate: "🍫", cocoa: "🍫", ice: "🧊",
};

function getIngredientIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, icon] of Object.entries(INGREDIENT_ICONS)) {
    if (lower.includes(keyword)) return icon;
  }
  return "🥘";
}

interface PantryListProps {
  items: PantryItem[];
  onRemove: (id: string) => void;
  onUpdate?: (id: string, quantity: number, unit: string) => void;
}

const PantryList = ({ items, onRemove, onUpdate }: PantryListProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editUnit, setEditUnit] = useState("");

  const startEdit = (item: PantryItem) => {
    setEditingId(item.id);
    setEditQty(String(item.quantity));
    setEditUnit(item.unit);
  };

  const saveEdit = (id: string) => {
    const qty = parseFloat(editQty);
    if (!isNaN(qty) && qty > 0 && onUpdate) {
      onUpdate(id, qty, editUnit);
    }
    setEditingId(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Your pantry is empty</p>
        <p className="text-sm mt-1">Add ingredients above to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between bg-surface-warm rounded-xl px-4 py-3 border border-border group hover:border-primary/40 hover:shadow-kitchen transition-all"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-lg leading-none">{getIngredientIcon(item.name)}</span>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground capitalize text-sm block truncate">{item.name}</span>
              {editingId === item.id ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <Input
                    type="number"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    className="h-6 w-16 text-xs px-1.5"
                    min="0.01"
                    step="any"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(item.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{item.unit}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-success"
                    onClick={() => saveEdit(item.id)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <span
                  className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors inline-flex items-center gap-1"
                  onClick={() => startEdit(item)}
                >
                  {item.quantity} {item.unit}
                  <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id)}
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default PantryList;
