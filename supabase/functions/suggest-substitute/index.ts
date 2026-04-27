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

interface RequestBody {
  ingredientName: string;
  requiredAmount?: number;
  requiredUnit?: string;
  recipeName: string;
  reason: "missing" | "insufficient";
  /** What the user already has on hand (full pantry) */
  pantryItems: PantryItemPayload[];
  /** For "insufficient": how much the user has of the original ingredient */
  haveAmount?: number;
  haveUnit?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;

    if (!body?.ingredientName || !Array.isArray(body?.pantryItems)) {
      return new Response(
        JSON.stringify({ error: "ingredientName and pantryItems are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const pantryList = body.pantryItems
      .map((p) => `- ${p.name} (${p.quantity} ${p.unit})`)
      .join("\n") || "(empty pantry)";

    const requiredLine = body.requiredAmount && body.requiredUnit
      ? `${body.requiredAmount} ${body.requiredUnit}`
      : "an unspecified amount";

    const haveLine = body.reason === "insufficient" && body.haveAmount != null && body.haveUnit
      ? `The user has ONLY ${body.haveAmount} ${body.haveUnit} of ${body.ingredientName} — that is not enough.`
      : `The user is missing ${body.ingredientName} entirely.`;

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
    const unitKey = (s?: string) => normalize(s ?? "");
    const tablespoonCount = (amount?: number, unit?: string) => {
      if (amount == null) return undefined;
      const key = unitKey(unit);
      if (["tbsp", "tablespoon", "tablespoons"].includes(key)) return amount;
      if (["tsp", "teaspoon", "teaspoons"].includes(key)) return amount / 3;
      if (["cup", "cups"].includes(key)) return amount * 16;
      if (["ml", "milliliter", "milliliters"].includes(key)) return amount / 15;
      if (["l", "liter", "liters", "litre", "litres"].includes(key)) return amount * 1000 / 15;
      return undefined;
    };

    const oliveOilNeeds = normalize(body.ingredientName).includes("olive oil")
      ? tablespoonCount(body.requiredAmount, body.requiredUnit)
      : undefined;

    if (oliveOilNeeds) {
      const butter = body.pantryItems.find((p) => normalize(p.name).includes("butter"));
      if (butter) {
        const needByUnit: Record<string, number> = {
          g: oliveOilNeeds * 14,
          gram: oliveOilNeeds * 14,
          grams: oliveOilNeeds * 14,
          kg: oliveOilNeeds * 0.014,
          oz: oliveOilNeeds * 0.5,
          ounce: oliveOilNeeds * 0.5,
          ounces: oliveOilNeeds * 0.5,
          lb: oliveOilNeeds * 0.03125,
          pound: oliveOilNeeds * 0.03125,
          pounds: oliveOilNeeds * 0.03125,
          tbsp: oliveOilNeeds,
          tablespoon: oliveOilNeeds,
          tablespoons: oliveOilNeeds,
        };
        const needAmount = needByUnit[unitKey(butter.unit)] ?? oliveOilNeeds * 14;
        const roundedNeed = Math.round(needAmount * 10) / 10;
        const sufficient = butter.quantity >= roundedNeed;

        return new Response(JSON.stringify({
          substitute: "Melted butter",
          instruction: `Use ${roundedNeed} ${butter.unit} melted butter in place of ${body.requiredAmount ?? oliveOilNeeds} ${body.requiredUnit ?? "tbsp"} olive oil.${sufficient ? "" : ` You only have ${butter.quantity} ${butter.unit}, so scale the recipe down or combine with another neutral fat.`}`,
          fromPantry: [butter.name],
          sufficientInPantry: sufficient,
          pantryUsage: [{ name: butter.name, needAmount: roundedNeed, needUnit: butter.unit }],
          confidence: "high",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const userPrompt = `Recipe: "${body.recipeName}"
Ingredient needed: ${body.ingredientName} — ${requiredLine}
${haveLine}

User's pantry (with quantities):
${pantryList}

Suggest the best DIFFERENT ingredient to substitute for "${body.ingredientName}". The substitute MUST be a different ingredient — never recommend "${body.ingredientName}" itself as its own substitute.

Strongly prefer something already in their pantry. If you suggest a pantry item, you MUST check whether they have ENOUGH of it (after applying the conversion ratio) to cover the required amount. If they don't have enough, say so explicitly and either suggest combining it with another pantry item, scaling the recipe down, or recommend a non-pantry substitute.

If no reasonable substitute exists, return substitute = "" and explain in the instruction (e.g., "There's no good substitute for kale here — try spinach or chard from the store, or skip this ingredient.").`;

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
            content: `You are a pragmatic kitchen substitutions expert. You help home cooks finish a recipe using what they already have.

ABSOLUTE RULES (do not violate):
1. NEVER suggest the same ingredient as its own substitute. If the user is short on olive oil, do NOT recommend olive oil. Recommend a DIFFERENT fat (butter, avocado oil, etc.).
2. Always reason about quantities and units. Convert between units as needed (e.g. 1 lemon ≈ 3 tbsp juice ≈ 45 ml).
3. Strongly prefer substitutes already in the user's pantry. Only suggest a non-pantry item if nothing in the pantry works.
4. If a pantry-based substitute exists but the user doesn't have enough of it, be honest: state the shortfall and propose a workable plan (combine with another pantry item, halve the recipe, etc.).
5. If you genuinely cannot find a good substitute, return substitute = "" and put a helpful note in the instruction. Never invent a bad substitute just to fill the field.

OUTPUT FIELDS:
- "substitute": short name of the substitute (e.g. "Butter", "Apple cider vinegar", "Milk + lemon juice"). MUST be different from the original ingredient. Empty string if no substitute works.
- "instruction": 1-2 sentences with the exact amount to use. If no substitute works, use this field to explain why and suggest next steps.
- "fromPantry": exact pantry item names this substitute relies on. Empty array if not from pantry.
- "sufficientInPantry": true ONLY when the suggested pantry-based substitute is in the pantry AND there is enough of it. False otherwise (including when the substitute isn't from pantry, or when substitute is empty).
- "pantryUsage": array of objects, one per pantry item used. Each object has { name, needAmount, needUnit } — the EXACT amount of that pantry item required to complete the substitution (after unit conversion). Use the user's pantry units when possible (e.g. if pantry is in "ml", give needUnit "ml"). Empty array if substitute isn't from pantry.
- "confidence": "high" for classic 1:1 swaps, "medium" for reasonable swaps, "low" for last-resort or when no substitute is found.`,
          },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_substitute",
              description: "Return the recommended substitute for the missing/insufficient ingredient. The substitute must be a different ingredient than the original.",
              parameters: {
                type: "object",
                properties: {
                  substitute: {
                    type: "string",
                    description: "Short name of the substitute. MUST be different from the original ingredient. Empty string if no substitute works.",
                  },
                  instruction: {
                    type: "string",
                    description: "1-2 sentence instruction with exact quantity. If no substitute, explain why.",
                  },
                  fromPantry: {
                    type: "array",
                    items: { type: "string" },
                    description: "Exact pantry item names this substitute relies on. Empty array if not from pantry.",
                  },
                  sufficientInPantry: {
                    type: "boolean",
                    description: "True only if the pantry-based substitute exists AND the user has enough of it.",
                  },
                  pantryUsage: {
                    type: "array",
                    description: "Per-item amounts needed from the pantry to complete the substitution. Empty if substitute is not from pantry.",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Exact pantry item name." },
                        needAmount: { type: "number", description: "Amount required from this pantry item." },
                        needUnit: { type: "string", description: "Unit for needAmount, matching the pantry's stored unit when possible." },
                      },
                      required: ["name", "needAmount", "needUnit"],
                      additionalProperties: false,
                    },
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                  },
                },
                required: ["substitute", "instruction", "fromPantry", "sufficientInPantry", "pantryUsage", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_substitute" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "RATE_LIMIT", message: "AI rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "PAYMENT_REQUIRED", message: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
        JSON.stringify({ error: "NO_SUGGESTION", message: "Couldn't generate a substitution." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const itemKey = normalize;

    const shortage = Array.isArray(parsed.pantryUsage)
      ? parsed.pantryUsage.find((usage: { name?: string; needAmount?: number; needUnit?: string }) => {
          const pantryItem = body.pantryItems.find((p) => itemKey(p.name) === itemKey(String(usage.name ?? "")));
          return pantryItem && pantryItem.unit === usage.needUnit && typeof usage.needAmount === "number" && usage.needAmount > pantryItem.quantity;
        })
      : undefined;

    if (shortage) {
      parsed.sufficientInPantry = false;
      const pantryItem = body.pantryItems.find((p) => itemKey(p.name) === itemKey(String(shortage.name ?? "")));
      parsed.instruction = `${parsed.instruction} You only have ${pantryItem?.quantity ?? "some"} ${pantryItem?.unit ?? ""} of ${shortage.name}, so this pantry substitute is short of the ${shortage.needAmount} ${shortage.needUnit} needed.`.trim();
    }

    // Guardrail: reject self-substitutions. The AI sometimes returns the same ingredient
    // back (e.g. "use olive oil for olive oil") which is nonsense — catch it here.
    const norm = normalize;
    const originalNorm = norm(body.ingredientName);
    const subNorm = norm(parsed.substitute ?? "");
    const isSelfSub =
      subNorm.length > 0 &&
      (subNorm === originalNorm ||
        subNorm.includes(originalNorm) ||
        originalNorm.includes(subNorm));

    if (isSelfSub) {
      console.warn("Rejected self-substitution:", body.ingredientName, "->", parsed.substitute);
      const fallback = body.reason === "insufficient"
        ? {
            substitute: "",
            instruction: `No good substitute for ${body.ingredientName} here. Try halving the recipe to fit what you have, or pick up more ${body.ingredientName} before cooking.`,
            fromPantry: [],
            sufficientInPantry: false,
            pantryUsage: [],
            confidence: "low" as const,
          }
        : {
            substitute: "",
            instruction: `No close substitute for ${body.ingredientName} from your pantry. Consider skipping it or adding it to your shopping list.`,
            fromPantry: [],
            sufficientInPantry: false,
            pantryUsage: [],
            confidence: "low" as const,
          };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("suggest-substitute error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
