import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChefHat, Plus, X, Calendar, DollarSign, AlertTriangle, Clock, Flame, ArrowLeft, Moon, Sun, List, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMMON_UNITS } from "@/types/pantry";
import RecipeCard from "@/components/RecipeCard";
import RecipeDetail from "@/components/RecipeDetail";
import type { PantryItem } from "@/types/pantry";
import type { Recipe, RecipeIngredientWithStatus } from "@/types/recipe";

/* ============================================================
   MOCKUP-ONLY TYPES (don't touch real PantryItem)
   ============================================================ */
interface MockBatch {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  cost?: number; // total $ paid
  expiresAt?: string; // ISO date (YYYY-MM-DD)
}

interface MockRecipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  /** ingredient names this recipe uses (normalized lowercase) */
  usesIngredients: string[];
  ingredients: Array<{ name: string; amount: number; unit: string }>;
}

const MOCK_RECIPES: MockRecipe[] = [
  {
    id: 1,
    title: "Garlic Butter Chicken with Rice",
    image: "https://img.spoonacular.com/recipes/716429-312x231.jpg",
    readyInMinutes: 35,
    servings: 4,
    sourceUrl: "https://spoonacular.com/recipes/garlic-butter-chicken-with-rice-716429",
    usesIngredients: ["chicken breast", "garlic", "rice", "olive oil"],
    ingredients: [
      { name: "chicken breast", amount: 1, unit: "lb" },
      { name: "garlic", amount: 2, unit: "clove" },
      { name: "rice", amount: 1, unit: "cup" },
      { name: "olive oil", amount: 2, unit: "tbsp" },
    ],
  },
  {
    id: 2,
    title: "Lemon Herb Salmon",
    image: "https://img.spoonacular.com/recipes/659135-312x231.jpg",
    readyInMinutes: 25,
    servings: 2,
    sourceUrl: "https://spoonacular.com/recipes/lemon-herb-salmon-659135",
    usesIngredients: ["salmon", "lemon", "garlic", "olive oil"],
    ingredients: [
      { name: "salmon", amount: 1, unit: "lb" },
      { name: "lemon", amount: 1, unit: "whole" },
      { name: "garlic", amount: 2, unit: "clove" },
      { name: "olive oil", amount: 1, unit: "tbsp" },
    ],
  },
  {
    id: 3,
    title: "Spinach & Mushroom Pasta",
    image: "https://img.spoonacular.com/recipes/715594-312x231.jpg",
    readyInMinutes: 20,
    servings: 3,
    sourceUrl: "https://spoonacular.com/recipes/spinach-mushroom-pasta-715594",
    usesIngredients: ["pasta", "spinach", "mushroom", "garlic"],
    ingredients: [
      { name: "pasta", amount: 200, unit: "g" },
      { name: "spinach", amount: 100, unit: "g" },
      { name: "mushroom", amount: 150, unit: "g" },
      { name: "garlic", amount: 2, unit: "clove" },
    ],
  },
  {
    id: 4,
    title: "Classic Chicken Stir Fry",
    image: "https://img.spoonacular.com/recipes/716627-312x231.jpg",
    readyInMinutes: 30,
    servings: 4,
    sourceUrl: "https://spoonacular.com/recipes/classic-chicken-stir-fry-716627",
    usesIngredients: ["chicken breast", "garlic", "olive oil"],
    ingredients: [
      { name: "chicken breast", amount: 1.5, unit: "lb" },
      { name: "garlic", amount: 3, unit: "clove" },
      { name: "olive oil", amount: 2, unit: "tbsp" },
    ],
  },
  {
    id: 5,
    title: "Mushroom Risotto",
    image: "https://img.spoonacular.com/recipes/715415-312x231.jpg",
    readyInMinutes: 45,
    servings: 4,
    sourceUrl: "https://spoonacular.com/recipes/mushroom-risotto-715415",
    usesIngredients: ["rice", "mushroom", "garlic", "olive oil"],
    ingredients: [
      { name: "rice", amount: 1.5, unit: "cup" },
      { name: "mushroom", amount: 200, unit: "g" },
      { name: "garlic", amount: 2, unit: "clove" },
      { name: "olive oil", amount: 2, unit: "tbsp" },
    ],
  },
];

/* ============================================================
   SEED DATA — pre-populated to demonstrate batches & expiry
   ============================================================ */
const SEED_ITEMS: MockBatch[] = [
  { id: "s1", name: "chicken breast", quantity: 0.5, unit: "lb", cost: 5.0, expiresAt: daysFromNow(2) },
  { id: "s2", name: "chicken breast", quantity: 0.75, unit: "lb", cost: 7.5, expiresAt: daysFromNow(6) },
  { id: "s3", name: "salmon", quantity: 1, unit: "lb", cost: 14.0, expiresAt: daysFromNow(1) },
  { id: "s4", name: "garlic", quantity: 8, unit: "clove", cost: 1.5 },
  { id: "s5", name: "rice", quantity: 2, unit: "cup", cost: 3.0 },
  { id: "s6", name: "spinach", quantity: 200, unit: "g", cost: 4.0, expiresAt: daysFromNow(-1) },
  { id: "s7", name: "olive oil", quantity: 250, unit: "ml" },
];

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/* ============================================================
   EXPIRY HELPERS
   ============================================================ */
type ExpiryStatus = "expired" | "soon" | "fresh" | "unknown";

function getExpiryStatus(expiresAt?: string): ExpiryStatus {
  if (!expiresAt) return "unknown";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiresAt);
  exp.setHours(0, 0, 0, 0);
  const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= 3) return "soon";
  return "fresh";
}

function daysUntilExpiry(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiresAt);
  exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatExpiryLabel(expiresAt?: string): string {
  const days = daysUntilExpiry(expiresAt);
  if (days === null) return "";
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days}d`;
}

/* ============================================================
   INGREDIENT ICONS (mini, mockup-local)
   ============================================================ */
const ICONS: Record<string, string> = {
  chicken: "🍗", salmon: "🐟", garlic: "🧄", rice: "🍚",
  spinach: "🥬", oil: "🫒", mushroom: "🍄", pasta: "🍝",
  lemon: "🍋",
};
function iconFor(name: string): string {
  const l = name.toLowerCase();
  for (const k in ICONS) if (l.includes(k)) return ICONS[k];
  return "🥘";
}

function totalsByIngredient(items: MockBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.name, (totals.get(item.name) ?? 0) + item.quantity);
  }
  return totals;
}

function toRecipe(recipe: MockRecipe, items: MockBatch[]): Recipe {
  const totals = totalsByIngredient(items);
  const matchedIngredients: RecipeIngredientWithStatus[] = recipe.ingredients.map((ing, index) => {
    const pantryName = Array.from(totals.keys()).find((p) => ing.name.includes(p) || p.includes(ing.name));
    const available = pantryName ? totals.get(pantryName) ?? 0 : 0;
    const status = !pantryName ? "missing" : available >= ing.amount ? "have" : "insufficient";
    return {
      id: recipe.id * 100 + index,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      original: `${ing.amount} ${ing.unit} ${ing.name}`,
      status,
    };
  });
  const usedIngredients = matchedIngredients.filter((ing) => ing.status !== "missing");
  const missedIngredients = matchedIngredients.filter((ing) => ing.status === "missing");
  const insufficientCount = matchedIngredients.filter((ing) => ing.status === "insufficient").length;
  return {
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    usedIngredientCount: usedIngredients.length,
    missedIngredientCount: missedIngredients.length,
    usedIngredients,
    missedIngredients,
    servings: recipe.servings,
    readyInMinutes: recipe.readyInMinutes,
    instructions: "Cook ingredients together until done. Season to taste and serve warm.",
    sourceUrl: recipe.sourceUrl,
    extendedIngredients: matchedIngredients,
    matchedIngredients,
    insufficientCount,
  };
}

function parseMockAiItems(text: string): MockBatch[] {
  return text
    .split(/[;\n]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const qtyMatch = chunk.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
      const costMatch = chunk.match(/\$\s*(\d+(?:\.\d+)?)/);
      const lower = chunk.toLowerCase();
      const name = lower
        .replace(/\$\s*\d+(?:\.\d+)?/g, "")
        .replace(/expir(?:es|ing)?\s+[^,;]+/g, "")
        .replace(/\d+(?:\.\d+)?\s*[a-zA-Z]+/g, "")
        .replace(/[,]/g, "")
        .trim();
      return {
        id: crypto.randomUUID(),
        name: name || "ingredient",
        quantity: qtyMatch ? parseFloat(qtyMatch[1]) : 1,
        unit: qtyMatch ? qtyMatch[2] : "unit",
        cost: costMatch ? parseFloat(costMatch[1]) : undefined,
      };
    });
}

/* ============================================================
   MAIN MOCKUP PAGE
   ============================================================ */
type SortKey = "best-match" | "expiring-soon" | "ready-time";
type InputMode = "manual" | "ai";

const PantryVaultMockup = () => {
  const [items, setItems] = useState<MockBatch[]>(SEED_ITEMS);
  const [sortKey, setSortKey] = useState<SortKey>("best-match");
  const [darkPreview, setDarkPreview] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("manual");

  // Form state
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("g");
  const [cost, setCost] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [aiInput, setAiInput] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !qty || parseFloat(qty) <= 0) return;
    const newItem: MockBatch = {
      id: crypto.randomUUID(),
      name: name.trim().toLowerCase(),
      quantity: parseFloat(qty),
      unit,
      cost: cost ? parseFloat(cost) : undefined,
      expiresAt: expiresAt || undefined,
    };
    // NOTE: no dedup — every add creates a new batch row
    setItems((prev) => [...prev, newItem]);
    setName(""); setQty(""); setCost(""); setExpiresAt("");
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAiAdd = () => {
    const parsed = parseMockAiItems(aiInput);
    if (parsed.length === 0) return;
    setItems((prev) => [...prev, ...parsed]);
    setAiInput("");
  };

  // Sort items alphabetically so same-name batches sit adjacent
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  // Show "Expiring soon" sort option only if at least one item has a date
  const hasAnyExpiry = items.some((i) => !!i.expiresAt);

  // Build a map of normalized ingredient name → soonest expiry days (or null)
  const ingredientUrgency = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const item of items) {
      const days = daysUntilExpiry(item.expiresAt);
      const existing = map.get(item.name);
      if (days === null) {
        if (!map.has(item.name)) map.set(item.name, null);
      } else {
        if (existing === undefined || existing === null || days < existing) {
          map.set(item.name, days);
        }
      }
    }
    return map;
  }, [items]);

  const getRecipeUrgencyMeta = (r: Recipe): { days: number | null; ingredient: string | null } => {
    let best: { days: number; ingredient: string } | null = null;
    for (const ing of r.extendedIngredients.map((ingredient) => ingredient.name)) {
      for (const [pname, days] of ingredientUrgency.entries()) {
        if ((ing.includes(pname) || pname.includes(ing)) && days !== null) {
          if (!best || days < best.days) best = { days, ingredient: pname };
        }
      }
    }
    return best ? { days: best.days, ingredient: best.ingredient } : { days: null, ingredient: null };
  };

  // Filter recipes to those that use at least one pantry ingredient
  const matchingRecipes = useMemo(() => {
    const pantryNames = new Set(items.map((i) => i.name));
    return MOCK_RECIPES.filter((r) =>
      r.usesIngredients.some((ing) =>
        Array.from(pantryNames).some((p) => ing.includes(p) || p.includes(ing))
      )
    );
  }, [items]);

  const recipeCards = useMemo(() => matchingRecipes.map((r) => toRecipe(r, items)), [matchingRecipes, items]);
  const pantryItemsForRecipes = useMemo<PantryItem[]>(
    () => items.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, unit: item.unit, addedAt: new Date() })),
    [items]
  );
  const cookableRecipeCards = useMemo(
    () => recipeCards.filter((r) => {
      const days = getRecipeUrgencyMeta(r).days;
      return days === null || days >= 0;
    }),
    [recipeCards, ingredientUrgency]
  );

  // Sort recipes per active sort key
  const sortedRecipes = useMemo(() => {
    const list = [...cookableRecipeCards];
    if (sortKey === "ready-time") {
      return list.sort((a, b) => a.readyInMinutes - b.readyInMinutes);
    }
    if (sortKey === "expiring-soon") {
      // Score each recipe by the soonest-expiring dated ingredient it uses.
      // Recipes using only undated items get pushed to the bottom (Infinity).
      const score = (r: Recipe) => {
        let min: number | null = null;
        for (const ing of r.extendedIngredients.map((ingredient) => ingredient.name)) {
          for (const [pname, days] of ingredientUrgency.entries()) {
            if ((ing.includes(pname) || pname.includes(ing)) && days !== null) {
              if (min === null || days < min) min = days;
            }
          }
        }
        return min === null ? Number.POSITIVE_INFINITY : min;
      };
      return list.sort((a, b) => score(a) - score(b));
    }
    // best-match: by # of pantry ingredients used (desc)
    return list.sort((a, b) => {
      const aFull = a.missedIngredientCount === 0 && (a.insufficientCount ?? 0) === 0;
      const bFull = b.missedIngredientCount === 0 && (b.insufficientCount ?? 0) === 0;
      if (aFull !== bFull) return aFull ? -1 : 1;
      if (a.missedIngredientCount !== b.missedIngredientCount) return a.missedIngredientCount - b.missedIngredientCount;
      if ((a.insufficientCount ?? 0) !== (b.insufficientCount ?? 0)) return (a.insufficientCount ?? 0) - (b.insufficientCount ?? 0);
      return b.usedIngredientCount - a.usedIngredientCount;
    });
  }, [cookableRecipeCards, sortKey, ingredientUrgency]);

  const expiringCount = items.filter((i) => {
    const s = getExpiryStatus(i.expiresAt);
    return s === "expired" || s === "soon";
  }).length;

  return (
    <div className={`min-h-screen bg-kitchen-counter ${darkPreview ? "dark" : ""}`}>
      {/* Header */}
      <header className="border-b-2 border-kitchen bg-wood-grain sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-sm">Back</span>
            </Link>
            <div className="h-px w-px bg-border mx-1" />
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-kitchen">
              <ChefHat className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl text-foreground">Pantry Vault — Mockup</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDarkPreview((prev) => !prev)}
              className="gap-2 text-xs"
            >
              {darkPreview ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {darkPreview ? "Light" : "Dark"}
            </Button>
            <Badge variant="outline" className="text-xs">Demo Mode</Badge>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Mockup banner */}
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground flex items-start gap-2">
          <Flame className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <div>
            <strong>Pantry-first MVP mockup.</strong> Add cost + expiry, see batches, and try the new "Expiring soon" sort. None of this affects your real pantry.
          </div>
        </div>

        {/* SECTION 1 — INTAKE */}
        <section className="surface-paper rounded-2xl p-6 md:p-8 space-y-6 relative">
          <div className="absolute -top-px left-8 right-8 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-b-full" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl text-foreground font-body font-semibold flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">🧺</span>
                Your Pantry
              </h3>
              <p className="text-sm text-muted-foreground">Add ingredients with quantities to find matching recipes</p>
            </div>
          </div>

          <div className="flex rounded-lg border border-border overflow-hidden w-fit">
            <button type="button" onClick={() => setInputMode("manual")} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${inputMode === "manual" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              <List className="h-3.5 w-3.5" />
              Manual
            </button>
            <button type="button" onClick={() => setInputMode("ai")} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${inputMode === "ai" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              <Sparkles className="h-3.5 w-3.5" />
              Describe
            </button>
          </div>

          {inputMode === "manual" ? (
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input placeholder="Ingredient (e.g. chicken breast)" value={name} onChange={(e) => setName(e.target.value)} className="bg-card flex-1" />
                <div className="flex gap-3">
                  <Input type="number" placeholder="Qty" value={qty} onChange={(e) => setQty(e.target.value)} className="w-24 bg-card" min="0" step="any" />
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} className="h-10 rounded-md border border-input bg-card pl-3 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_6px_center] bg-no-repeat">
                    {COMMON_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="number"
                  placeholder="Cost (optional)"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="bg-card pl-8"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="relative flex-1">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  placeholder="Expires (optional)"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="bg-card pl-8"
                />
              </div>
              <Button type="submit" variant="hero" size="icon" className="shrink-0 self-stretch sm:self-auto">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            </form>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder={'Describe what\'s in your pantry, e.g.\n"1 lb chicken breast expiring Friday, $7.50; 2 cups rice"'}
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="min-h-[100px] bg-card resize-none"
              />
              <Button type="button" variant="hero" className="w-full gap-2" onClick={handleAiAdd} disabled={!aiInput.trim()}>
                <Sparkles className="h-4 w-4" />
                Parse Ingredients
              </Button>
            </div>
          )}
        </section>

        {/* SECTION 2 — PANTRY LIST WITH BATCHES & BADGES */}
        <section className="surface-paper rounded-2xl p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">🧺</span>
                Your Pantry ({items.length})
              </h2>
            </div>
            {expiringCount > 0 && (
              <Badge variant="outline" className="border-warning/50 text-warning bg-warning/5 gap-1">
                <AlertTriangle className="h-3 w-3" />
                {expiringCount} item{expiringCount !== 1 ? "s" : ""} need attention
              </Badge>
            )}
          </div>

          {sortedItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Pantry is empty. Add an item above.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sortedItems.map((item) => {
                const status = getExpiryStatus(item.expiresAt);
                return (
                  <div
                    key={item.id}
                    className={`group flex items-start justify-between gap-2 rounded-xl px-3 py-2.5 border transition-all hover:shadow-kitchen ${
                      status === "expired"
                        ? "bg-destructive/10 border-destructive/50"
                        : status === "soon"
                        ? "bg-warning/5 border-warning/30"
                        : "bg-surface-warm border-border"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="text-lg leading-none mt-0.5">{iconFor(item.name)}</span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="font-medium text-foreground capitalize text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.quantity} {item.unit}
                          {item.cost !== undefined && (
                            <span className="ml-1.5">· ${item.cost.toFixed(2)}</span>
                          )}
                        </div>
                        {status === "expired" && (
                          <div className="text-[11px] font-semibold text-destructive flex items-center gap-1 pt-0.5">
                            <AlertTriangle className="h-3 w-3" />
                            {formatExpiryLabel(item.expiresAt)}
                          </div>
                        )}
                        {status === "soon" && (
                          <div className="text-[11px] font-medium text-warning flex items-center gap-1 pt-0.5">
                            <Clock className="h-3 w-3" />
                            {formatExpiryLabel(item.expiresAt)}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(item.id)}
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 3 — RECIPE LIST WITH NEW SORT */}
        <section className="surface-paper rounded-2xl p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">📖</span>
                Recipes ({sortedRecipes.length})
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort:</span>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="w-44 bg-card text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best-match">Best match</SelectItem>
                  <SelectItem value="ready-time">Quickest to make</SelectItem>
                  {hasAnyExpiry && (
                    <SelectItem value="expiring-soon">
                      <span className="flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-warning" />
                        Expiring soon
                      </span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedRecipes.map((r) => {
              const meta = sortKey === "expiring-soon" ? getRecipeUrgencyMeta(r) : { days: null, ingredient: null };
              const urgent = meta.days !== null && meta.days <= 3;
              return (
                <div key={r.id} className="relative h-full">
                  <RecipeCard recipe={r} onClick={setSelectedRecipe} />
                  {sortKey === "expiring-soon" && meta.days !== null && (
                    <Badge
                      variant="outline"
                      className={`absolute top-3 right-3 z-10 shrink-0 text-[11px] gap-1 shadow-kitchen bg-card/95 backdrop-blur-sm ${
                        urgent
                          ? meta.days < 0
                            ? "border-destructive bg-destructive text-destructive-foreground"
                            : "border-warning bg-warning text-warning-foreground"
                          : "border-border bg-card text-muted-foreground"
                      }`}
                    >
                      <Flame className="h-3 w-3" />
                      {meta.days < 0
                        ? `Expired ${Math.abs(meta.days)}d ago`
                        : meta.days === 0
                        ? "Use today"
                        : `Use in ${meta.days}d`}
                    </Badge>
                  )}
                </div>
              );
            })}
            {sortedRecipes.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No matching recipes — add ingredients to your pantry.</p>
            )}
          </div>
        </section>

        {selectedRecipe && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setSelectedRecipe(null)}>
            <div className="mx-auto my-6 max-w-2xl surface-paper rounded-2xl p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
              <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="text-center text-xs text-muted-foreground pb-4">
          This is a visual mockup. No data is saved. <Link to="/" className="underline">Back to live app</Link>
        </div>
      </main>
    </div>
  );
};

export default PantryVaultMockup;
