import { useState, useCallback, useEffect, useRef } from "react";
import { ChefHat, Search, FlaskConical, UtensilsCrossed, Trash2, Moon, Sun, List, Sparkles, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AuthButton from "@/components/AuthButton";
import PantryInput from "@/components/PantryInput";
import PantryAiInput from "@/components/PantryAiInput";
import PantryList from "@/components/PantryList";
import RecipeResults from "@/components/RecipeResults";
import RecipeDetail from "@/components/RecipeDetail";
import { matchIngredients, summarizeMatch, calculateMaxServings } from "@/lib/unitConversion";
import { MOCK_RECIPES } from "@/lib/mockRecipes";
import aiDemoChickenBeanTortillaSkillet from "@/assets/ai-demo-chicken-bean-tortilla-skillet.jpg";
import aiDemoLemonYogurtTacoBowls from "@/assets/ai-demo-lemon-yogurt-taco-bowls.jpg";
import aiDemoCheddarBlackBeanRiceMelt from "@/assets/ai-demo-cheddar-black-bean-rice-melt.jpg";
import aiDemoChickenTortillaSoupBowls from "@/assets/ai-demo-chicken-tortilla-soup-bowls.jpg";
import { loadPantry, savePantry } from "@/lib/pantryStorage";
import type { PantryItem } from "@/types/pantry";
import type { Recipe } from "@/types/recipe";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";
import { daysUntilDate } from "@/lib/dateUtils";

const Index = () => {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [demoMode, setDemoMode] = useState(true);
  const [recipeSource, setRecipeSource] = useState<"ai" | "web">("ai");
  const [pantryId, setPantryId] = useState<string | undefined>();
  const [inputMode, setInputMode] = useState<"manual" | "ai">("ai");
  const [pantryLoaded, setPantryLoaded] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
    }
    return true;
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
    setItems((prev) => {
      trackEvent(AnalyticsEvents.ADD_INGREDIENT, { ingredient: item.name, quantity: item.quantity, unit: item.unit });
      return [...prev, { ...item, id: crypto.randomUUID() }];
    });
  }, []);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) trackEvent(AnalyticsEvents.REMOVE_INGREDIENT, { ingredient: item.name });
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleUpdate = useCallback((id: string, updates: Partial<Omit<PantryItem, "id" | "name">>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const recipeUsesExpiredItem = (recipe: Recipe, pantryItems: PantryItem[]) => {
    const expiredItems = pantryItems.filter((item) => {
      const days = daysUntilDate(item.expiresAt);
      return days !== null && days < 0;
    });
    if (expiredItems.length === 0) return false;
    return recipe.extendedIngredients.some((ing) => {
      const ingName = ing.name.toLowerCase();
      return expiredItems.some((item) => ingName.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(ingName));
    });
  };

  const getRecipeExpiringSoonIngredients = (recipe: Recipe, pantryItems: PantryItem[]) => {
    const expiringItems = pantryItems.filter((item) => {
      const days = daysUntilDate(item.expiresAt);
      return days !== null && days >= 0 && days <= 3;
    });
    if (expiringItems.length === 0) return [];
    const names = recipe.extendedIngredients.flatMap((ing) => {
      const ingName = ing.name.toLowerCase();
      return expiringItems
        .filter((item) => ingName.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(ingName))
        .map((item) => item.name);
    });
    return Array.from(new Set(names));
  };

  const getRecipeExpiringSoonDays = (recipe: Recipe, pantryItems: PantryItem[]) => {
    const days = recipe.extendedIngredients.flatMap((ing) => {
      const ingName = ing.name.toLowerCase();
      return pantryItems
        .filter((item) => ingName.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(ingName))
        .map((item) => daysUntilDate(item.expiresAt))
        .filter((day): day is number => day !== null && day >= 0 && day <= 3);
    });
    return days.length > 0 ? Math.min(...days) : null;
  };

  const handleClearAll = useCallback(() => {
    const previousItems = [...items];
    setItems([]);
    trackEvent(AnalyticsEvents.CLEAR_PANTRY, { item_count: items.length });
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
      return { ...recipe, matchedIngredients: matched, insufficientCount: summary.insufficientCount, maxServings, expiringSoonIngredients: getRecipeExpiringSoonIngredients(recipe, pantryItems), expiringSoonDays: getRecipeExpiringSoonDays(recipe, pantryItems) };
    });
  };

  const buildAiRecipeCards = (aiRecipes: any[] = []): Recipe[] => aiRecipes.slice(0, 4).map((recipe, recipeIndex) => {
    const title = String(recipe.title || "").toLowerCase();
    const image = recipe.imageUrl || (title.includes("lemon") || title.includes("yogurt")
      ? aiDemoLemonYogurtTacoBowls
      : title.includes("rice melt") || title.includes("cheddar")
      ? aiDemoCheddarBlackBeanRiceMelt
      : title.includes("soup")
      ? aiDemoChickenTortillaSoupBowls
      : aiDemoChickenBeanTortillaSkillet);
    const ingredients = (recipe.ingredients || []).map((ingredient: any, ingredientIndex: number) => ({
      id: 9000 + recipeIndex * 100 + ingredientIndex,
      name: ingredient.name,
      amount: Number(ingredient.amount) || 1,
      unit: ingredient.unit || "piece",
      original: ingredient.original || `${ingredient.amount || 1} ${ingredient.unit || ""} ${ingredient.name}`.trim(),
    }));
    const used = ingredients.filter((_, index) => recipe.ingredients?.[index]?.fromPantry !== false);
    const missed = ingredients.filter((_, index) => recipe.ingredients?.[index]?.fromPantry === false);
    return {
      id: 800000 + Date.now() + recipeIndex,
      title: recipe.title || "AI Pantry Recipe",
      image,
      isAiGenerated: true,
      generationNote: recipe.generationNote || "Created from your pantry ingredients.",
      usedIngredientCount: used.length,
      missedIngredientCount: missed.length,
      usedIngredients: used,
      missedIngredients: missed,
      servings: Number(recipe.servings) || 2,
      readyInMinutes: Number(recipe.readyInMinutes) || 30,
      instructions: `<ol>${(recipe.steps || []).map((step: string) => `<li>${step}</li>`).join("")}</ol>`,
      sourceUrl: "",
      extendedIngredients: ingredients,
    };
  });

  const getDemoAiRecipeCards = (): Recipe[] => buildAiRecipeCards([
    {
      title: "AI Chicken, Bean & Tortilla Skillet",
      generationNote: "A quick generated idea using the same pantry staples in a new format.",
      servings: 3,
      readyInMinutes: 25,
      ingredients: [
        { name: "chicken breast", amount: 1, unit: "piece", original: "1 chicken breast, sliced", fromPantry: true },
        { name: "black beans", amount: 1, unit: "cup", original: "1 cup black beans", fromPantry: true },
        { name: "tortillas", amount: 3, unit: "piece", original: "3 tortillas, torn", fromPantry: true },
        { name: "cheddar cheese", amount: 0.5, unit: "cup", original: "1/2 cup cheddar cheese", fromPantry: true },
      ],
      steps: ["Brown sliced chicken in a skillet with salt and pepper.", "Add black beans and torn tortillas until warmed through.", "Top with cheddar and cover until melted."],
    },
    {
      title: "AI Lemon Yogurt Taco Bowls",
      generationNote: "A lighter pantry-created bowl that turns taco ingredients into dinner.",
      servings: 2,
      readyInMinutes: 20,
      ingredients: [
        { name: "rice", amount: 1, unit: "cup", original: "1 cup cooked rice", fromPantry: true },
        { name: "Greek yogurt", amount: 0.5, unit: "cup", original: "1/2 cup Greek yogurt", fromPantry: true },
        { name: "lemon", amount: 1, unit: "piece", original: "1 lemon", fromPantry: true },
        { name: "black beans", amount: 0.75, unit: "cup", original: "3/4 cup black beans", fromPantry: true },
      ],
      steps: ["Warm rice and black beans together with salt and pepper.", "Stir lemon juice into Greek yogurt for a quick sauce.", "Serve beans over rice and spoon the sauce on top."],
    },
    {
      title: "AI Cheddar Black Bean Rice Melt",
      generationNote: "A pantry-first rice dinner with one optional fresh topping.",
      servings: 3,
      readyInMinutes: 22,
      ingredients: [
        { name: "rice", amount: 1.5, unit: "cups", original: "1 1/2 cups cooked rice", fromPantry: true },
        { name: "black beans", amount: 1, unit: "cup", original: "1 cup black beans", fromPantry: true },
        { name: "cheddar cheese", amount: 0.75, unit: "cup", original: "3/4 cup cheddar cheese", fromPantry: true },
        { name: "green onion", amount: 2, unit: "pieces", original: "2 green onions, sliced", fromPantry: false },
      ],
      steps: ["Warm rice and black beans in a skillet with salt and pepper.", "Fold in cheddar until melted and creamy.", "Top with sliced green onion if you have it."],
    },
    {
      title: "AI Chicken Tortilla Soup-ish Bowls",
      generationNote: "A simple generated bowl that uses water instead of assuming broth.",
      servings: 2,
      readyInMinutes: 30,
      ingredients: [
        { name: "chicken breast", amount: 1, unit: "piece", original: "1 chicken breast", fromPantry: true },
        { name: "tortillas", amount: 2, unit: "pieces", original: "2 tortillas, toasted in strips", fromPantry: true },
        { name: "black beans", amount: 0.75, unit: "cup", original: "3/4 cup black beans", fromPantry: true },
        { name: "tomato", amount: 1, unit: "piece", original: "1 tomato, chopped", fromPantry: false },
      ],
      steps: ["Simmer chicken in water with salt and pepper until cooked through.", "Shred the chicken, then warm it with black beans and chopped tomato.", "Serve with crisp tortilla strips on top."],
    },
  ]);

  const fetchAiRecipeCards = async (): Promise<Recipe[]> => {
    trackEvent(AnalyticsEvents.AI_RECIPES_REQUESTED, { ingredient_count: items.length, demo: demoMode });
    if (demoMode) return getDemoAiRecipeCards();
    const { data, error } = await supabase.functions.invoke("generate-ai-recipes", {
      body: { pantryItems: items.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })) },
    });
    if (error || data?.error) throw new Error(data?.error || error?.message || "Could not generate recipes");
    return buildAiRecipeCards(data.recipes || []);
  };

  const fetchWebRecipeCards = async (): Promise<Recipe[]> => {
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 800));
      const pantryNames = items.map((i) => i.name.toLowerCase());
      return MOCK_RECIPES.map((recipe) => {
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
    }

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
    return data.recipes || [];
  };

  const handleSearch = async () => {
    if (items.length === 0) return;
    const ingredientNames = items.map((i) => i.name);
    trackEvent(AnalyticsEvents.SEARCH_RECIPES, { ingredient_count: items.length, ingredients: ingredientNames, demo: demoMode });
    setIsLoading(true);
    setHasSearched(true);
    setSelectedRecipe(null);

    try {
      const rawRecipes = recipeSource === "ai" ? await fetchAiRecipeCards() : await fetchWebRecipeCards();
      const enriched = enrichRecipesWithQuantityMatch(rawRecipes, items).filter((recipe) => !recipeUsesExpiredItem(recipe, items));
      setRecipes(enriched);
      if (recipeSource === "ai") trackEvent(AnalyticsEvents.AI_RECIPES_SHOWN, { count: rawRecipes.length, demo: demoMode });
      trackEvent(AnalyticsEvents.SEARCH_RESULTS, { result_count: enriched.length, full_matches: enriched.filter(r => r.missedIngredientCount === 0).length, demo: demoMode, source: recipeSource });
    } catch (err: any) {
      console.error("Search error:", err);
      const isRateLimit = err.message === "RATE_LIMIT" || err.message?.includes("429") || err.message?.includes("daily points limit");
      if (recipeSource === "ai") trackEvent(AnalyticsEvents.AI_RECIPES_FAILED, { demo: demoMode });
      toast({
        title: isRateLimit ? "Recipe source limit reached" : "Search failed",
        description: isRateLimit
          ? "This recipe source is temporarily limited. Try switching recipe sources or Demo mode."
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
            <Label htmlFor="demo-mode" className="text-sm text-muted-foreground cursor-pointer">
              Demo
            </Label>
            <Switch id="demo-mode" checked={demoMode} onCheckedChange={(v) => { setDemoMode(v); trackEvent(AnalyticsEvents.DEMO_MODE_TOGGLE, { enabled: v }); }} />
          </div>
          {/* Mobile demo toggle - compact */}
          <div className="flex sm:hidden items-center gap-1.5">
            <Label htmlFor="demo-mode-mobile" className="text-xs text-muted-foreground cursor-pointer">
              Demo
            </Label>
            <Switch id="demo-mode-mobile" checked={demoMode} onCheckedChange={(v) => { setDemoMode(v); trackEvent(AnalyticsEvents.DEMO_MODE_TOGGLE, { enabled: v }); }} />
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
            <RecipeDetail
              recipe={selectedRecipe}
              onBack={() => setSelectedRecipe(null)}
              pantryItems={items}
              demoMode={demoMode}
            />
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
                Add ingredients to find matching recipes — quantities required, cost and expiration optional
              </p>
            </div>
          </div>

          <div className="flex rounded-lg border border-border overflow-hidden w-fit">
            <button
              onClick={() => setInputMode("manual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                inputMode === "manual"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Manual
            </button>
            <button
              onClick={() => setInputMode("ai")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                inputMode === "ai"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Describe
            </button>
          </div>

          {inputMode === "manual" ? (
            <PantryInput onAdd={handleAdd} />
          ) : (
            <PantryAiInput onAdd={handleAdd} />
          )}

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
            <div className="space-y-3">
              <div className="grid grid-cols-2 rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setRecipeSource("ai")}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                    recipeSource === "ai"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  AI-generated Recipes
                </button>
                <button
                  type="button"
                  onClick={() => setRecipeSource("web")}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                    recipeSource === "web"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Globe2 className="h-4 w-4" />
                  Web Recipes
                </button>
              </div>
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
            </div>
          )}
        </section>

        <RecipeResults
          recipes={recipes}
          isLoading={isLoading}
          hasSearched={hasSearched}
          onRecipeClick={(recipe) => { trackEvent(AnalyticsEvents.VIEW_RECIPE, { recipe_id: recipe.id, recipe_title: recipe.title }); setSelectedRecipe(recipe); }}
          pantryItems={items}
          demoMode={demoMode}
        />
      </main>
    </div>
  );
};

export default Index;
