/**
 * Lightweight analytics tracker for product telemetry.
 * Fires events to the analytics_events table.
 * Designed to be non-blocking — errors are silently swallowed
 * so tracking never impacts user experience.
 */

import { supabase } from "@/integrations/supabase/client";

// Generate a session ID per browser tab
const SESSION_ID =
  typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2);

/**
 * Track an analytics event.
 * @param eventName - Short snake_case event name (e.g. "search_recipes")
 * @param eventData - Optional key-value payload with event-specific context
 */
export async function trackEvent(
  eventName: string,
  eventData: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await (supabase as any).from("analytics_events").insert({
      event_name: eventName,
      event_data: eventData,
      user_id: user?.id ?? null,
      session_id: SESSION_ID,
    });
  } catch {
    // Silently fail — analytics should never break the app
  }
}

/**
 * Event name constants for consistency.
 */
export const AnalyticsEvents = {
  // Search
  SEARCH_RECIPES: "search_recipes",
  SEARCH_RESULTS: "search_results",

  // Pantry
  ADD_INGREDIENT: "add_ingredient",
  REMOVE_INGREDIENT: "remove_ingredient",
  CLEAR_PANTRY: "clear_pantry",
  MERGE_DUPLICATE: "merge_duplicate",

  // Recipe interaction
  VIEW_RECIPE: "view_recipe",

  // Input validation
  VALIDATION_ERROR: "validation_error",
  GENERIC_INGREDIENT_BLOCKED: "generic_ingredient_blocked",
  SPELL_SUGGESTION_SHOWN: "spell_suggestion_shown",
  SPELL_SUGGESTION_ACCEPTED: "spell_suggestion_accepted",
  SPELL_ADD_ANYWAY: "spell_add_anyway",

  // Auth
  SIGN_IN: "sign_in",
  SIGN_OUT: "sign_out",

  // Mode
  DEMO_MODE_TOGGLE: "demo_mode_toggle",

  // AI Parser
  AI_PARSE_COMPLETE: "ai_parse_complete",
  AI_ITEMS_ADDED: "ai_items_added",
} as const;
