import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type PantryItemPayload = { name: string; quantity: number; unit: string };

type GeneratedRecipe = {
  title: string;
  generationNote: string;
  servings: number;
  readyInMinutes: number;
  ingredients: Array<{ name: string; amount: number; unit: string; original: string; fromPantry: boolean }>;
  steps: string[];
  imageUrl?: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const generateRecipeImage = async (recipe: GeneratedRecipe, apiKey: string): Promise<string | undefined> => {
  const ingredientList = recipe.ingredients.map((ingredient) => ingredient.name).join(", ");
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: `Realistic overhead food photography of ${recipe.title}. Main visible ingredients: ${ingredientList}. Warm natural kitchen light, simple home-cooked weeknight meal, appetizing and accurate to the recipe, no text, no hands.`,
        },
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    console.error("AI image generation error:", response.status, await response.text());
    return undefined;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pantryItems } = (await req.json()) as { pantryItems?: PantryItemPayload[] };
    if (!Array.isArray(pantryItems) || pantryItems.length === 0) {
      return jsonResponse({ error: "pantryItems are required." }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const pantryList = pantryItems.map((item) => `- ${item.name} (${item.quantity} ${item.unit})`).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a practical home-cooking recipe creator. Generate exactly 4 simple recipes that mostly use the user's pantry.

Rules:
- Keep recipes realistic, weeknight-friendly, and tasty.
- Prefer using 3-6 pantry ingredients per recipe.
- Pantry basics are limited to water, salt, and pepper; do not assume oil, butter, broth, spices, or dairy unless listed.
- If a small missing ingredient would materially improve the recipe, include it as a missing ingredient, but keep missing ingredients to 0-2 total.
- Respect listed quantities as much as possible. Do not intentionally require much more of a pantry ingredient than the user has.
- Keep instructions concise and safe.
- No dietary or medical claims.`, 
          },
          { role: "user", content: `User pantry:\n${pantryList}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_generated_recipes",
                  description: "Return four pantry-aware generated recipe cards.",
              parameters: {
                type: "object",
                properties: {
                  recipes: {
                    type: "array",
                    minItems: 4,
                    maxItems: 4,
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        generationNote: { type: "string" },
                        servings: { type: "number" },
                        readyInMinutes: { type: "number" },
                        ingredients: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              amount: { type: "number" },
                              unit: { type: "string" },
                              original: { type: "string" },
                              fromPantry: { type: "boolean" },
                            },
                            required: ["name", "amount", "unit", "original", "fromPantry"],
                            additionalProperties: false,
                          },
                        },
                        steps: { type: "array", items: { type: "string" } },
                      },
                      required: ["title", "generationNote", "servings", "readyInMinutes", "ingredients", "steps"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["recipes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_generated_recipes" } },
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
    if (!toolCall?.function?.arguments) return jsonResponse({ error: "NO_RECIPES" }, 502);

    const parsed = JSON.parse(toolCall.function.arguments) as { recipes?: GeneratedRecipe[] };
    const recipesWithImages = await Promise.all(
      (parsed.recipes || []).map(async (recipe) => ({
        ...recipe,
        imageUrl: await generateRecipeImage(recipe, LOVABLE_API_KEY).catch((error) => {
          console.error("Recipe image generation failed:", error);
          return undefined;
        }),
      }))
    );

    return jsonResponse({ recipes: recipesWithImages });
  } catch (error) {
    console.error("generate-ai-recipes error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});