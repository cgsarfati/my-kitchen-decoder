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
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Please provide ingredient text." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
            content: `You are a kitchen ingredient parser. The user describes what's in their pantry in natural language. Extract each ingredient with a quantity and unit.

UNITS:
- Use standard abbreviated units: g, kg, oz, lb, ml, l, cup, tbsp, tsp, clove, can, slice, bunch.
- Default to "g" for solids and "ml" for liquids when no unit is clear.

NAMES:
- Normalize to the common singular form ("tomatoes" → "tomato", "eggs" → "egg").
- Keep the user's specificity ("meat" only if they didn't specify the type).

QUANTITY ESTIMATION (important):
When the user is vague ("some", "a bit", "a little", "enough for X", "a small bag", "half a jar"), do NOT use a fixed default. Reason about a realistic real-world amount based on the CONTEXT they describe, then return that number. Think about typical container sizes, typical single-meal portions, and the ingredient's density.

Examples of the reasoning you should do (do not parrot these numbers — adapt to the actual input):
- "enough salt to fill a salt shaker" → a typical shaker holds ~50–100 g → return ~75 g salt
- "a small bag of rice" → small retail bags are ~500 g → return 500 g rice
- "some rice" with no other context → enough for ~2 servings of a side → return ~150 g rice
- "a splash of olive oil" → ~1 tbsp → return ~15 ml olive oil
- "half a stick of butter" → US stick is 113 g → return ~56 g butter
- "a handful of spinach" → ~30 g
- "a couple of eggs" → 2 pieces (use unit "slice" since "piece" isn't supported, or just count)

If the user gives no context at all for an ingredient (just names it), estimate a modest single-recipe amount, not a bulk pantry stock.`,
          },
          { role: "user", content: text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_ingredients",
              description: "Return the parsed list of ingredients with quantities and units.",
              parameters: {
                type: "object",
                properties: {
                  ingredients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Ingredient name in singular lowercase form" },
                        quantity: { type: "number", description: "Numeric quantity" },
                        unit: {
                          type: "string",
                          description: "Unit of measurement (g, kg, oz, lb, ml, l, cup, tbsp, tsp, clove, can, slice, bunch)",
                        },
                      },
                      required: ["name", "quantity", "unit"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["ingredients"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_ingredients" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "RATE_LIMIT", message: "AI rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "PAYMENT_REQUIRED", message: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ ingredients: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(
      JSON.stringify({ ingredients: parsed.ingredients || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("parse-ingredients error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
