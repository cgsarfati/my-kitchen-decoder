import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PantryItem } from "@/types/pantry";

/** Map ingredient keywords to emoji icons */
const INGREDIENT_ICONS: Record<string, string> = {
  // Proteins
  chicken: "🍗",
  beef: "🥩",
  steak: "🥩",
  pork: "🥩",
  lamb: "🥩",
  turkey: "🦃",
  fish: "🐟",
  salmon: "🐟",
  tuna: "🐟",
  shrimp: "🦐",
  prawn: "🦐",
  crab: "🦀",
  lobster: "🦞",
  egg: "🥚",
  tofu: "🧈",
  sausage: "🌭",
  bacon: "🥓",

  // Vegetables
  garlic: "🧄",
  onion: "🧅",
  potato: "🥔",
  carrot: "🥕",
  broccoli: "🥦",
  lettuce: "🥬",
  spinach: "🥬",
  kale: "🥬",
  corn: "🌽",
  pepper: "🌶️",
  chili: "🌶️",
  tomato: "🍅",
  mushroom: "🍄",
  cucumber: "🥒",
  zucchini: "🥒",
  eggplant: "🍆",
  avocado: "🥑",
  pea: "🫛",
  bean: "🫘",
  ginger: "🫚",

  // Fruits
  apple: "🍎",
  banana: "🍌",
  orange: "🍊",
  lemon: "🍋",
  lime: "🍋",
  strawberry: "🍓",
  blueberry: "🫐",
  grape: "🍇",
  peach: "🍑",
  pear: "🍐",
  cherry: "🍒",
  watermelon: "🍉",
  pineapple: "🍍",
  coconut: "🥥",
  mango: "🥭",

  // Grains & Carbs
  rice: "🍚",
  bread: "🍞",
  pasta: "🍝",
  spaghetti: "🍝",
  noodle: "🍜",
  flour: "🌾",
  wheat: "🌾",
  oat: "🌾",
  cereal: "🥣",
  tortilla: "🫓",
  pancake: "🥞",
  waffle: "🧇",

  // Dairy
  milk: "🥛",
  cheese: "🧀",
  butter: "🧈",
  cream: "🥛",
  yogurt: "🥛",

  // Oils & Condiments
  oil: "🫒",
  olive: "🫒",
  vinegar: "🫗",
  sauce: "🫗",
  soy: "🫗",
  honey: "🍯",
  sugar: "🍬",
  salt: "🧂",
  ketchup: "🫗",
  mustard: "🫗",

  // Nuts & Seeds
  peanut: "🥜",
  almond: "🥜",
  walnut: "🥜",
  cashew: "🥜",
  seed: "🌰",
  chestnut: "🌰",

  // Herbs & Spices
  basil: "🌿",
  thyme: "🌿",
  rosemary: "🌿",
  oregano: "🌿",
  cilantro: "🌿",
  parsley: "🌿",
  mint: "🌿",
  cinnamon: "🫙",
  cumin: "🫙",
  paprika: "🫙",
  turmeric: "🫙",

  // Beverages & Other
  water: "💧",
  wine: "🍷",
  beer: "🍺",
  coffee: "☕",
  tea: "🍵",
  chocolate: "🍫",
  cocoa: "🍫",
  ice: "🧊",
};

function getIngredientIcon(name: string): string {
  const lower = name.toLowerCase();

  // Direct match first
  for (const [keyword, icon] of Object.entries(INGREDIENT_ICONS)) {
    if (lower.includes(keyword)) {
      return icon;
    }
  }

  // Default
  return "🥘";
}

interface PantryListProps {
  items: PantryItem[];
  onRemove: (id: string) => void;
}

const PantryList = ({ items, onRemove }: PantryListProps) => {
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
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg leading-none">{getIngredientIcon(item.name)}</span>
            <div className="min-w-0">
              <span className="font-medium text-foreground capitalize text-sm block truncate">{item.name}</span>
              <span className="text-xs text-muted-foreground">
                {item.quantity} {item.unit}
              </span>
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
