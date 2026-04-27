import { useState } from "react";
import { Sparkles, Loader2, Plus, X, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { COMMON_UNITS, type PantryItem } from "@/types/pantry";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

interface PantryAiInputProps {
  onAdd: (item: Omit<PantryItem, "id">) => void;
}

interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  cost?: number;
  expiresAt?: string;
  selected: boolean;
}

const PantryAiInput = ({ onAdd }: PantryAiInputProps) => {
  const [text, setText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedItem[] | null>(null);
  const { toast } = useToast();

  const handleParse = async () => {
    if (!text.trim()) return;
    setIsParsing(true);
    setParsed(null);

    try {
      const { data, error } = await supabase.functions.invoke("parse-ingredients", {
        body: { text: text.trim() },
      });

      if (error) {
        console.error("Parse error:", error);
        throw error;
      }

      if (data?.error === "RATE_LIMIT" || data?.error === "PAYMENT_REQUIRED") {
        toast({
          title: data.error === "RATE_LIMIT" ? "AI rate limit" : "AI credits needed",
          description: data.message,
          variant: "destructive",
        });
        setParsed([]);
        return;
      }

      if (data?.error) throw new Error(data.error);

      const results = data?.ingredients || [];
      setParsed(results.map((r: { name: string; quantity: number; unit: string; cost?: number; expiresAt?: string }) => ({ ...r, selected: true })));
      trackEvent(AnalyticsEvents.AI_PARSE_COMPLETE, {
        input_length: text.length,
        parsed_count: results.length,
      });
    } catch {
      toast({
        title: "Parsing failed",
        description: "Could not parse ingredients. Please try again.",
        variant: "destructive",
      });
      setParsed([]);
    } finally {
      setIsParsing(false);
    }
  };

  const updateItem = (index: number, field: "quantity" | "unit" | "cost" | "expiresAt", value: string) => {
    setParsed((prev) =>
      prev?.map((item, i) => {
        if (i !== index) return item;
        if (field === "quantity") return { ...item, quantity: parseFloat(value) || 0 };
        if (field === "cost") return { ...item, cost: value ? parseFloat(value) : undefined };
        if (field === "expiresAt") return { ...item, expiresAt: value || undefined };
        return { ...item, unit: value };
      }) ?? null
    );
  };

  const toggleItem = (index: number) => {
    setParsed((prev) =>
      prev?.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item)) ?? null
    );
  };

  const handleAddSelected = () => {
    if (!parsed) return;
    const selected = parsed.filter((p) => p.selected);
    selected.forEach((item) => {
      onAdd({ name: item.name, quantity: item.quantity, unit: item.unit, cost: item.cost, expiresAt: item.expiresAt });
    });
    trackEvent(AnalyticsEvents.AI_ITEMS_ADDED, { count: selected.length });
    setText("");
    setParsed(null);
  };

  const handleClear = () => {
    setText("");
    setParsed(null);
  };

  const MAX_CHARS = 500;
  const selectedCount = parsed?.filter((p) => p.selected).length ?? 0;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          placeholder={'Describe what\'s in your pantry, e.g.:\n"500g chicken breast for $8 expires 05/12/2026, 3 cloves garlic, and 2 cups rice"'}
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              setText(e.target.value);
              if (parsed) setParsed(null);
            }
          }}
          className="bg-card min-h-[100px] resize-none pr-10"
          disabled={isParsing}
          maxLength={MAX_CHARS}
        />
        <span className={`absolute bottom-2 right-2 text-[10px] ${text.length > MAX_CHARS * 0.9 ? "text-destructive" : "text-muted-foreground/50"}`}>
          {text.length}/{MAX_CHARS}
        </span>
        {text && !isParsing && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-8 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!parsed && (
        <Button
          onClick={handleParse}
          disabled={!text.trim() || isParsing}
          variant="hero"
          className="w-full gap-2"
        >
          {isParsing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Parsing ingredients…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Parse Ingredients
            </>
          )}
        </Button>
      )}

      {parsed && parsed.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Couldn't identify any ingredients. Try being more specific.
        </p>
      )}

      {parsed && parsed.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Found <strong>{parsed.length}</strong> ingredient{parsed.length !== 1 ? "s" : ""}. Deselect any you don't want to add:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {parsed.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  item.selected
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border bg-card opacity-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(i)}
                  className="shrink-0"
                >
                  <div
                    className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      item.selected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {item.selected && (
                      <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground capitalize block truncate">
                    {item.name}
                  </span>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", e.target.value)}
                      className="h-6 w-16 text-xs px-1.5"
                      min="0.01"
                      step="any"
                    />
                    <Select value={item.unit} onValueChange={(v) => updateItem(i, "unit", v)}>
                      <SelectTrigger className="h-6 w-[70px] text-xs px-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_UNITS.map((u) => (
                          <SelectItem key={u} value={u} className="text-xs">
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <DollarSign className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      <Input
                        type="number"
                        value={item.cost ?? ""}
                        onChange={(e) => updateItem(i, "cost", e.target.value)}
                        placeholder="Cost"
                        className="h-6 w-20 text-xs pl-5 pr-1.5"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                      <Input
                        type="date"
                        value={item.expiresAt ?? ""}
                        onChange={(e) => updateItem(i, "expiresAt", e.target.value)}
                        aria-label={`${item.name} expiration date optional`}
                        title="Expiration date (optional)"
                        className="h-6 w-32 text-xs pl-5 pr-1.5 dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleAddSelected}
            disabled={selectedCount === 0}
            variant="hero"
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Add {selectedCount} ingredient{selectedCount !== 1 ? "s" : ""} to Pantry
          </Button>
        </div>
      )}
    </div>
  );
};

export default PantryAiInput;
