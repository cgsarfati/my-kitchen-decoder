import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("Spoonacular_API");
    if (!apiKey) {
      throw new Error("Spoonacular API key not configured");
    }

    const { ingredients } = await req.json();
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No ingredients provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build comma-separated ingredient list for Spoonacular
    const ingredientList = ingredients.map((i: { name: string }) => i.name).join(",");

    // Search recipes by ingredients
    const searchUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredientList)}&number=12&ranking=2&ignorePantry=false&apiKey=${apiKey}`;
    
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      const errText = await searchRes.text();
      throw new Error(`Spoonacular search failed [${searchRes.status}]: ${errText}`);
    }
    const recipes = await searchRes.json();

    // Get detailed info (servings, instructions) for all found recipes
    if (recipes.length === 0) {
      return new Response(
        JSON.stringify({ recipes: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ids = recipes.map((r: { id: number }) => r.id).join(",");
    const bulkUrl = `https://api.spoonacular.com/recipes/informationBulk?ids=${ids}&apiKey=${apiKey}`;
    const bulkRes = await fetch(bulkUrl);
    if (!bulkRes.ok) {
      const errText = await bulkRes.text();
      throw new Error(`Spoonacular bulk info failed [${bulkRes.status}]: ${errText}`);
    }
    const details = await bulkRes.json();

    // Merge search results (which have usedIngredients/missedIngredients) with details
    const merged = recipes.map((searchResult: any) => {
      const detail = details.find((d: any) => d.id === searchResult.id);
      return {
        id: searchResult.id,
        title: searchResult.title,
        image: searchResult.image,
        usedIngredientCount: searchResult.usedIngredientCount,
        missedIngredientCount: searchResult.missedIngredientCount,
        usedIngredients: searchResult.usedIngredients?.map((i: any) => ({
          id: i.id,
          name: i.name,
          amount: i.amount,
          unit: i.unit,
          original: i.original,
        })) || [],
        missedIngredients: searchResult.missedIngredients?.map((i: any) => ({
          id: i.id,
          name: i.name,
          amount: i.amount,
          unit: i.unit,
          original: i.original,
        })) || [],
        servings: detail?.servings || 0,
        readyInMinutes: detail?.readyInMinutes || 0,
        instructions: detail?.instructions || "",
        sourceUrl: detail?.sourceUrl || "",
        extendedIngredients: detail?.extendedIngredients?.map((i: any) => ({
          id: i.id,
          name: i.name,
          amount: i.amount,
          unit: i.unit,
          original: i.original,
        })) || [],
      };
    });

    return new Response(
      JSON.stringify({ recipes: merged }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in search-recipes:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
