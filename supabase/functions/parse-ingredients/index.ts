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
            content: `You are a kitchen ingredient parser. The user will describe what's in their pantry using natural language. Extract each individual ingredient with its quantity and unit. Rules:
- Use standard abbreviated units: g, kg, oz, lb, ml, l, cup, tbsp, tsp, clove, can, slice, bunch
- If no quantity is mentioned, estimate a reasonable default (e.g. "some rice" → 300g, "olive oil" → 60ml)
- If no unit is clear, use "g" for solids or "ml" for liquids
- Normalize ingredient names to their common singular form (e.g. "tomatoes" → "tomato", "eggs" → "egg")
- Be specific: "meat" should stay as-is only if the user didn't specify the type`,
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
