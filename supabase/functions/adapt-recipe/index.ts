import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PantryItemPayload {
  name: string;
  quantity: number;
  unit: string;
}

interface RecipeIngredientPayload {
  name: string;
  amount?: number;
  unit?: string;
  original?: string;
}

interface RequestBody {
  recipe: {
    title: string;
    servings?: number;
    readyInMinutes?: number;
    ingredients: RecipeIngredientPayload[];
    missingIngredients?: string[];
    instructions?: string;
  };
  pantryItems: PantryItemPayload[];
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;

    if (!body?.recipe?.title || !Array.isArray(body.recipe.ingredients) || !Array.isArray(body.pantryItems)) {
      return jsonResponse({ error: "recipe.title, recipe.ingredients, and pantryItems are required." }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const pantryList = body.pantryItems.map((item) => `- ${item.name} (${item.quantity} ${item.unit})`).join("\n") || "(empty pantry)";
    const ingredientList = body.recipe.ingredients.map((item) => `- ${item.original || `${item.amount ?? ""} ${item.unit ?? ""} ${item.name}`.trim()}`).join("\n");
    const missingList = body.recipe.missingIngredients?.length ? body.recipe.missingIngredients.join(", ") : "none listed";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a practical recipe adaptation chef for home cooks. Your job is to decide whether a selected recipe can be adapted into one tasty version using the user's pantry.

Keep this low-risk and honest:
- Return exactly one adaptation.
- Do not force strange pairings. If the pantry does not support a tasty recipe, set canAdapt=false.
- Prefer broad recipe-level changes over tiny 1:1 substitutions.
- Focus on taste compatibility, cooking method, and whether the dish still makes sense.
- Keep instructions concise and demo-friendly.

Return fields:
- canAdapt: boolean.
- title: short headline. If no fit, use an honest no-fit headline.
- summary: 1 sentence explaining why it works or does not.
- changes: 2-3 concrete recipe-level changes. Empty if canAdapt=false.
- pantryIngredientsUsed: exact pantry item names used in the adaptation.
- blockers: missing or incompatible ingredients that make adaptation unsafe. Empty if canAdapt=true.
- confidence: high, medium, or low.`, 
          },
          {
            role: "user",
            content: `Recipe: ${body.recipe.title}
Servings: ${body.recipe.servings ?? "unknown"}
Ready in: ${body.recipe.readyInMinutes ?? "unknown"} minutes

Recipe ingredients:
${ingredientList}

Missing or insufficient ingredients:
${missingList}

User pantry:
${pantryList}

Recipe instructions:
${body.recipe.instructions?.replace(/<[^>]+>/g, " ").slice(0, 1500) || "(not provided)"}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_recipe_adaptation",
              description: "Return one honest recipe adaptation using the pantry, or a no-fit result.",
              parameters: {
                type: "object",
                properties: {
                  canAdapt: { type: "boolean" },
                  title: { type: "string" },
                  summary: { type: "string" },
                  changes: { type: "array", items: { type: "string" } },
                  pantryIngredientsUsed: { type: "array", items: { type: "string" } },
                  blockers: { type: "array", items: { type: "string" } },
                  confidence: { type: "string", enum: ["high", "medium", "low"] },
                },
                required: ["canAdapt", "title", "summary", "changes", "pantryIngredientsUsed", "blockers", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_recipe_adaptation" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Rate limits exceeded, please try again later." }, 429);
      if (response.status === 402) return jsonResponse({ error: "Payment required, please add credits to keep going." }, 402);
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return jsonResponse({ error: "AI gateway error" }, 500);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No adaptation tool call in response:", JSON.stringify(data));
      return jsonResponse({ error: "NO_ADAPTATION", message: "Couldn't generate a recipe adaptation." }, 502);
    }

    return jsonResponse(JSON.parse(toolCall.function.arguments));
  } catch (error) {
    console.error("adapt-recipe error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
