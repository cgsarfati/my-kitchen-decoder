import { useState, useCallback } from "react";
import { ChefHat, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PantryInput from "@/components/PantryInput";
import PantryList from "@/components/PantryList";
import RecipeResults from "@/components/RecipeResults";
import RecipeDetail from "@/components/RecipeDetail";
import type { PantryItem } from "@/types/pantry";
import type { Recipe } from "@/types/recipe";

const Index = () => {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { toast } = useToast();

  const handleAdd = useCallback((item: Omit<PantryItem, "id">) => {
    setItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleSearch = async () => {
    if (items.length === 0) return;
    setIsLoading(true);
    setHasSearched(true);
    setSelectedRecipe(null);

    try {
      const { data, error } = await supabase.functions.invoke("search-recipes", {
        body: {
          ingredients: items.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setRecipes(data.recipes || []);
    } catch (err: any) {
      console.error("Search error:", err);
      toast({
        title: "Search failed",
        description: err.message || "Could not fetch recipes. Please try again.",
        variant: "destructive",
      });
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedRecipe) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
          <div className="container max-w-3xl mx-auto flex items-center gap-3 py-4 px-4">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl text-foreground">Pantry Cook</h1>
          </div>
        </header>
        <main className="container max-w-3xl mx-auto px-4 py-10">
          <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto flex items-center gap-3 py-4 px-4">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <ChefHat className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl text-foreground">Pantry Cook</h1>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-10 space-y-10">
        <section className="text-center space-y-3">
          <h2 className="text-4xl md:text-5xl text-foreground leading-tight">
            Cook with what you have
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Add the ingredients in your pantry and we'll find recipes you can actually make — even partial matches.
          </p>
        </section>

        <section className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl text-foreground font-body font-semibold">Your Pantry</h3>
            <p className="text-sm text-muted-foreground">
              Add ingredients with quantities to find matching recipes
            </p>
          </div>

          <PantryInput onAdd={handleAdd} />
          <PantryList items={items} onRemove={handleRemove} />

          {items.length > 0 && (
            <Button
              variant="hero"
              size="lg"
              className="w-full gap-2"
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
        />
      </main>
    </div>
  );
};

export default Index;
