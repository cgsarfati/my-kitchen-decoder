import { supabase } from "@/integrations/supabase/client";
import type { PantryItem } from "@/types/pantry";

export async function loadPantry(userId: string): Promise<{ id: string; name: string; items: PantryItem[] } | null> {
  const { data, error } = await supabase
    .from("saved_pantries")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    items: (data.items as unknown as PantryItem[]) || [],
  };
}

export async function savePantry(userId: string, items: PantryItem[], existingId?: string): Promise<string | null> {
  if (existingId) {
    const { error } = await supabase
      .from("saved_pantries")
      .update({ items: items as unknown as any, updated_at: new Date().toISOString() })
      .eq("id", existingId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating pantry:", error);
      return null;
    }
    return existingId;
  } else {
    const { data, error } = await supabase
      .from("saved_pantries")
      .insert({ user_id: userId, items: items as unknown as any })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error saving pantry:", error);
      return null;
    }
    return data.id;
  }
}
