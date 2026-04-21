import { useState, useRef } from "react";
import { Sparkles, Loader2, Plus, X, ImageIcon, AlertTriangle, RefreshCw } from "lucide-react";
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
  selected: boolean;
  confidence?: "high" | "medium" | "low";
}

// Mocked vision detection — simulates what an AI image model would return.
// Real vision integration replaces this in the next iteration.
const MOCK_IMAGE_DETECTIONS: ParsedItem[] = [
  { name: "tomato", quantity: 4, unit: "whole", confidence: "high", selected: true },
  { name: "yellow onion", quantity: 2, unit: "whole", confidence: "high", selected: true },
  { name: "garlic", quantity: 1, unit: "whole", confidence: "high", selected: true },
  { name: "milk", quantity: 1, unit: "l", confidence: "high", selected: true },
  { name: "cheddar cheese", quantity: 200, unit: "g", confidence: "medium", selected: true },
  { name: "bell pepper", quantity: 2, unit: "whole", confidence: "medium", selected: true },
  { name: "leafy green (lettuce?)", quantity: 1, unit: "whole", confidence: "low", selected: false },
];

const CONFIDENCE_STYLES: Record<NonNullable<ParsedItem["confidence"]>, { label: string; cls: string }> = {
  high: { label: "High", cls: "bg-primary/10 text-primary border-primary/30" },
  medium: { label: "Medium", cls: "bg-warning/10 text-warning border-warning/40" },
  low: { label: "Low — verify", cls: "bg-destructive/10 text-destructive border-destructive/30" },
};

const MAX_CHARS = 500;

const PantryAiInput = ({ onAdd }: PantryAiInputProps) => {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsed, setParsed] = useState<ParsedItem[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const inputMode: "text" | "image" | "empty" = imageUrl ? "image" : text.trim() ? "text" : "empty";

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Not an image",
        description: "Please upload a JPG, PNG, or HEIC photo.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please use an image under 10 MB.",
        variant: "destructive",
      });
      return;
    }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setText("");
    setParsed(null);
    trackEvent(AnalyticsEvents.AI_IMAGE_UPLOADED, { size_kb: Math.round(file.size / 1024) });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (file) {
      e.preventDefault();
      handleFile(file);
    }
  };

  const handleAnalyzeImage = async () => {
    setIsProcessing(true);
    setParsed(null);
    // Simulate vision latency
    await new Promise((r) => setTimeout(r, 2000));
    setParsed(MOCK_IMAGE_DETECTIONS.map((d) => ({ ...d })));
    setIsProcessing(false);
    trackEvent(AnalyticsEvents.AI_IMAGE_ANALYZED, {
      detected_count: MOCK_IMAGE_DETECTIONS.length,
      mocked: true,
    });
  };

  const handleParseText = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
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
      setParsed(results.map((r: { name: string; quantity: number; unit: string }) => ({ ...r, selected: true })));
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
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    if (inputMode === "image") handleAnalyzeImage();
    else if (inputMode === "text") handleParseText();
  };

  const updateItem = (index: number, field: "quantity" | "unit" | "name", value: string) => {
    setParsed((prev) =>
      prev?.map((item, i) => {
        if (i !== index) return item;
        if (field === "quantity") return { ...item, quantity: parseFloat(value) || 0 };
        if (field === "unit") return { ...item, unit: value };
        return { ...item, name: value };
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
      onAdd({ name: item.name, quantity: item.quantity, unit: item.unit });
    });
    const wasImage = imageUrl !== null;
    if (wasImage) {
      trackEvent(AnalyticsEvents.AI_IMAGE_ITEMS_ADDED, { count: selected.length });
    } else {
      trackEvent(AnalyticsEvents.AI_ITEMS_ADDED, { count: selected.length });
    }
    handleClear();
  };

  const handleClear = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setText("");
    setImageUrl(null);
    setParsed(null);
  };

  const handleRemoveImage = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setParsed(null);
  };

  const selectedCount = parsed?.filter((p) => p.selected).length ?? 0;
  const hasLowConfidence = parsed?.some((p) => p.confidence === "low") ?? false;

  return (
    <div className="space-y-3">
      {/* Unified input: text + image drop zone */}
      {!imageUrl && (
        <div
          className={`relative rounded-md border transition-colors ${
            isDragging ? "border-primary border-2 bg-primary/5" : "border-input"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <Textarea
            placeholder={'Describe what\'s in your pantry, e.g.:\n"500g chicken breast, 3 cloves of garlic, olive oil, and some rice"\n\n…or drop / paste a photo of your fridge here.'}
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) {
                setText(e.target.value);
                if (parsed) setParsed(null);
              }
            }}
            onPaste={handlePaste}
            className="bg-card min-h-[120px] resize-none pr-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isProcessing}
            maxLength={MAX_CHARS}
          />
          <span
            className={`absolute bottom-2 right-2 text-[10px] ${
              text.length > MAX_CHARS * 0.9 ? "text-destructive" : "text-muted-foreground/50"
            }`}
          >
            {text.length}/{MAX_CHARS}
          </span>
          {text && !isProcessing && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-8 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isDragging && (
            <div className="absolute inset-0 rounded-md flex items-center justify-center bg-primary/10 pointer-events-none">
              <p className="text-sm font-medium text-primary flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Drop photo to scan
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image preview when an image is attached */}
      {imageUrl && (
        <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
          <img src={imageUrl} alt="Pantry photo" className="w-full max-h-[280px] object-cover" />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-background transition-colors"
            aria-label="Remove photo"
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </button>
          {isProcessing && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Identifying ingredients…</p>
              <p className="text-xs text-muted-foreground">Scanning shelves, labels, and quantities</p>
            </div>
          )}
        </div>
      )}

      {/* Action row: upload trigger + primary submit */}
      {!parsed && (
        <div className="flex items-center gap-2">
          {!imageUrl && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="gap-2 shrink-0"
              >
                <ImageIcon className="h-4 w-4" />
                Upload image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </>
          )}

          <Button
            onClick={handleSubmit}
            disabled={inputMode === "empty" || isProcessing}
            variant="hero"
            className="flex-1 gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {inputMode === "image" ? "Analyzing photo…" : "Parsing ingredients…"}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {inputMode === "image" ? "Analyze photo" : "Parse ingredients"}
              </>
            )}
          </Button>
        </div>
      )}

      {!imageUrl && !parsed && (
        <p className="text-[11px] text-muted-foreground/70 italic">
          🧪 Image scanning is mocked for now — real AI vision coming next.
        </p>
      )}

      {parsed && parsed.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Couldn't identify any ingredients. Try being more specific{imageUrl ? " or use a clearer photo" : ""}.
        </p>
      )}

      {parsed && parsed.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Found <strong className="text-foreground">{parsed.length}</strong> ingredient
              {parsed.length !== 1 ? "s" : ""}. Review, edit, then add.
            </p>
            {imageUrl && (
              <button
                type="button"
                onClick={handleAnalyzeImage}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="h-3 w-3" />
                Re-scan
              </button>
            )}
          </div>

          {hasLowConfidence && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-foreground">
                Some items couldn't be confidently identified. Deselect or rename them before adding.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {parsed.map((item, i) => {
              const conf = item.confidence ? CONFIDENCE_STYLES[item.confidence] : null;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    item.selected
                      ? "border-primary/50 bg-primary/5 shadow-sm"
                      : "border-border bg-card opacity-50"
                  }`}
                >
                  <button type="button" onClick={() => toggleItem(i)} className="shrink-0">
                    <div
                      className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        item.selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                      }`}
                    >
                      {item.selected && (
                        <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2 6L5 9L10 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {imageUrl ? (
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(i, "name", e.target.value)}
                          className="h-6 text-sm font-medium capitalize px-1.5 flex-1 min-w-[100px]"
                        />
                      ) : (
                        <span className="text-sm font-medium text-foreground capitalize block truncate">
                          {item.name}
                        </span>
                      )}
                      {conf && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${conf.cls}`}
                        >
                          {conf.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
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
                    </div>
                  </div>
                </div>
              );
            })}
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
