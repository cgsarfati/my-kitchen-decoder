import { useState, useCallback, useEffect, useRef } from "react";
import { ChefHat, Search, FlaskConical, UtensilsCrossed, Trash2, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AuthButton from "@/components/AuthButton";
import PantryInput from "@/components/PantryInput";
import PantryList from "@/components/PantryList";
import RecipeResults from "@/components/RecipeResults";
import RecipeDetail from "@/components/RecipeDetail";
import { matchIngredients, summarizeMatch, calculateMaxServings } from "@/lib/unitConversion";
import { MOCK_RECIPES } from "@/lib/mockRecipes";
import { loadPantry, savePantry } from "@/lib/pantryStorage";
import type { PantryItem } from "@/types/pantry";
import type { Recipe } from "@/types/recipe";

const Index = () => {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [pantryId, setPantryId] = useState<string | undefined>();
  const [pantryLoaded, setPantryLoaded] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const { toast } = useToast();
  const { user } = useAuth();

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Load theme preference
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDarkMode(true);
  }, []);

  // Load saved pantry when user signs in
  useEffect(() => {
    if (!user) {
      setPantryId(undefined);
      setPantryLoaded(false);
      return;
    }
    loadPantry(user.id).then((result) => {
      if (result) {
        setItems(result.items);
        setPantryId(result.id);
      }
      setPantryLoaded(true);
    });
  }, [user]);

  // Auto-save pantry on changes (debounced)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!user || !pantryLoaded) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const id = await savePantry(user.id, items, pantryId);
      if (id && !pantryId) setPantryId(id);
    }, 1500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [items, user, pantryId, pantryLoaded]);

  const handleAdd = useCallback((item: Omit<PantryItem, "id">) => {
    setItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleUpdate = useCallback((id: string, quantity: number, unit: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity, unit } : item))
    );
  }, []);

  const handleClearAll = useCallback(() => {
    const previousItems = [...items];
    setItems([]);
    toast({
      title: "Pantry cleared",
      description: "All ingredients have been removed.",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setItems(previousItems)}
          className="text-xs"
        >
          Undo
        </Button>
      ),
    });
  }, [items, toast]);

  const enrichRecipesWithQuantityMatch = (rawRecipes: Recipe[], pantryItems: PantryItem[]): Recipe[] => {
    return rawRecipes.map((recipe) => {
      const matched = matchIngredients(
        pantryItems.map((p) => ({ name: p.name, quantity: p.quantity, unit: p.unit })),
        recipe.extendedIngredients,
        recipe.usedIngredients.map((i) => i.name),
        recipe.missedIngredients.map((i) => i.name)
      );
      const summary = summarizeMatch(matched);
      const pantryMapped = pantryItems.map((p) => ({ name: p.name, quantity: p.quantity, unit: p.unit }));
      const isFullMatch = summary.missingCount === 0 && summary.insufficientCount === 0;
      const maxServings = isFullMatch
        ? calculateMaxServings(pantryMapped, recipe.extendedIngredients, recipe.servings)
        : null;
      return { ...recipe, matchedIngredients: matched, insufficientCount: summary.insufficientCount, maxServings };
    });
  };

  const handleSearch = async () => {
    if (items.length === 0) return;
    setIsLoading(true);
    setHasSearched(true);
    setSelectedRecipe(null);

    if (demoMode) {
      await new Promise((r) => setTimeout(r, 800));
      const pantryNames = items.map((i) => i.name.toLowerCase());
      const filtered = MOCK_RECIPES.map((recipe) => {
        const used = recipe.extendedIngredients.filter((ing) =>
          pantryNames.some((p) => ing.name.toLowerCase().includes(p) || p.includes(ing.name.toLowerCase()))
        );
        const missed = recipe.extendedIngredients.filter((ing) =>
          !pantryNames.some((p) => ing.name.toLowerCase().includes(p) || p.includes(ing.name.toLowerCase()))
        );
        return {
          ...recipe,
          usedIngredientCount: used.length,
          missedIngredientCount: missed.length,
          usedIngredients: used.map((i) => ({ id: i.id, name: i.name, amount: i.amount, unit: i.unit, original: i.original })),
          missedIngredients: missed.map((i) => ({ id: i.id, name: i.name, amount: i.amount, unit: i.unit, original: i.original })),
        };
      }).filter((r) => r.usedIngredientCount > 0);
      const enriched = enrichRecipesWithQuantityMatch(filtered, items);
      setRecipes(enriched);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("search-recipes", {
        body: { ingredients: items.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })) },
      });
      if (error) {
        const errorBody = typeof error === 'object' && error?.context?.body ? await error.context.json?.() : null;
        if (errorBody?.error === "RATE_LIMIT" || error?.message?.includes("429")) throw new Error("RATE_LIMIT");
        throw error;
      }
      if (data?.error === "RATE_LIMIT") throw new Error("RATE_LIMIT");
      if (data?.error) throw new Error(data.error);
      const enriched = enrichRecipesWithQuantityMatch(data.recipes || [], items);
      setRecipes(enriched);
    } catch (err: any) {
      console.error("Search error:", err);
      const isRateLimit = err.message === "RATE_LIMIT" || err.message?.includes("429") || err.message?.includes("daily points limit");
      toast({
        title: isRateLimit ? "API limit reached" : "Search failed",
        description: isRateLimit
          ? "We've hit our daily recipe search limit. Please try again tomorrow!"
          : err.message || "Could not fetch recipes. Please try again.",
        variant: "destructive",
      });
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Shared header component
  const header = (
    <header className="border-b-2 border-kitchen bg-wood-grain sticky top-0 z-10">
      <div className="container max-w-3xl mx-auto flex items-center justify-between py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-kitchen">
            <ChefHat className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl text-foreground hidden sm:block">Pantry Cook</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDarkMode((d) => !d)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {/* Demo toggle - hidden on very small screens, shown on sm+ */}
          <div className="hidden sm:flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="demo-mode" className="text-sm text-muted-foreground cursor-pointer">
              Demo
            </Label>
            <Switch id="demo-mode" checked={demoMode} onCheckedChange={setDemoMode} />
          </div>
          {/* Mobile demo toggle - compact */}
          <div className="flex sm:hidden items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
            <Switch id="demo-mode-mobile" checked={demoMode} onCheckedChange={setDemoMode} />
          </div>
          <div className="w-px h-6 bg-border" />
          <AuthButton />
        </div>
      </div>
    </header>
  );

  if (selectedRecipe) {
    return (
      <div className="min-h-screen bg-kitchen-counter">
        {header}
        <main className="container max-w-3xl mx-auto px-4 py-10">
          <div className="surface-paper-lg rounded-2xl p-6 md:p-8">
            <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kitchen-counter">
      {header}

      <main className="container max-w-3xl mx-auto px-4 py-10 space-y-8">
        {demoMode && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground flex items-center gap-2">
            <FlaskConical className="h-4 w-4 shrink-0 text-primary" />
            <span><strong>Demo mode</strong> — results use sample data, no API calls are made.</span>
          </div>
        )}

        {/* Hero section */}
        <section className="surface-paper-lg rounded-2xl p-8 md:p-10 text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-4 right-6 opacity-[0.06] pointer-events-none">
            <UtensilsCrossed className="h-32 w-32 text-foreground" />
          </div>
          <div className="absolute bottom-4 left-6 opacity-[0.04] pointer-events-none rotate-12">
            <ChefHat className="h-24 w-24 text-foreground" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-4xl text-foreground leading-tight relative z-[1]">
            Unlock recipes hiding in your kitchen
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto relative z-[1]">
            Add the ingredients in your pantry and we'll find recipes you can actually make — even partial matches.
          </p>
          {!user && (
            <p className="text-sm text-primary relative z-[1]">
              Sign in with Google to save your pantry between sessions.
            </p>
          )}
        </section>

        {/* Pantry section */}
        <section className="surface-paper rounded-2xl p-6 md:p-8 space-y-6 relative">
          <div className="absolute -top-px left-8 right-8 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-b-full" />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl text-foreground font-body font-semibold flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  🧺
                </span>
                Your Pantry
              </h3>
              <p className="text-sm text-muted-foreground">
                Add ingredients with quantities to find matching recipes
              </p>
            </div>
          </div>

          <PantryInput onAdd={handleAdd} />

          {items.length > 0 && (
            <div className="pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="h-px flex-1 bg-border" />
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  In Your Pantry ({items.length})
                </h4>
                <span className="h-px flex-1 bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs text-muted-foreground hover:text-destructive gap-1 shrink-0 h-auto py-0.5 px-1.5"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </Button>
              </div>
              <PantryList items={items} onRemove={handleRemove} onUpdate={handleUpdate} />
            </div>
          )}

          {items.length > 0 && (
            <Button
              variant="hero"
              size="lg"
              className="w-full gap-2 shadow-kitchen"
              onClick={handleSearch}
              disabled={isLoading}
            >
              <Search className="h-5 w-5" />
              Find Recipes ({items.length} ingredient{items.length !== 1 ? "s" : ""})
            </Button>
          )}
        </section>

        <RecipeResults
          recipes={recipes}
          isLoading={isLoading}
          hasSearched={hasSearched}
          onRecipeClick={setSelectedRecipe}
          demoMode={demoMode}
        />
      </main>
    </div>
  );
};

export default Index;
