import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Plus, X, Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { COMMON_UNITS, type PantryItem } from "@/types/pantry";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

interface PantryImageInputProps {
  onAdd: (item: Omit<PantryItem, "id">) => void;
}

interface DetectedItem {
  name: string;
  quantity: number;
  unit: string;
  confidence: "high" | "medium" | "low";
  selected: boolean;
}

// Mock detection result — simulates what an AI vision model would return
// for a typical "fridge shelf / pantry counter" photo.
const MOCK_DETECTIONS: DetectedItem[] = [
  { name: "tomato", quantity: 4, unit: "whole", confidence: "high", selected: true },
  { name: "yellow onion", quantity: 2, unit: "whole", confidence: "high", selected: true },
  { name: "garlic", quantity: 1, unit: "whole", confidence: "high", selected: true },
  { name: "milk", quantity: 1, unit: "l", confidence: "high", selected: true },
  { name: "cheddar cheese", quantity: 200, unit: "g", confidence: "medium", selected: true },
  { name: "bell pepper", quantity: 2, unit: "whole", confidence: "medium", selected: true },
  { name: "leafy green (lettuce?)", quantity: 1, unit: "whole", confidence: "low", selected: false },
];

const CONFIDENCE_STYLES: Record<DetectedItem["confidence"], { label: string; cls: string }> = {
  high: { label: "High confidence", cls: "bg-primary/10 text-primary border-primary/30" },
  medium: { label: "Medium", cls: "bg-warning/10 text-warning border-warning/40" },
  low: { label: "Low — please verify", cls: "bg-destructive/10 text-destructive border-destructive/30" },
};

const PantryImageInput = ({ onAdd }: PantryImageInputProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detected, setDetected] = useState<DetectedItem[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setDetected(null);
    trackEvent(AnalyticsEvents.AI_IMAGE_UPLOADED, { size_kb: Math.round(file.size / 1024) });
  };

  const handleAnalyze = async () => {
    if (!imageUrl) return;
    setIsAnalyzing(true);
    setDetected(null);

    // Simulate AI vision call latency (~2s)
    await new Promise((r) => setTimeout(r, 2000));

    // Mocked result — in real implementation this is where we'd call
    // the edge function with the image and get back structured JSON.
    setDetected(MOCK_DETECTIONS.map((d) => ({ ...d })));
    setIsAnalyzing(false);
    trackEvent(AnalyticsEvents.AI_IMAGE_ANALYZED, {
      detected_count: MOCK_DETECTIONS.length,
      mocked: true,
    });
  };

  const updateItem = (index: number, field: "quantity" | "unit" | "name", value: string) => {
    setDetected((prev) =>
      prev?.map((item, i) => {
        if (i !== index) return item;
        if (field === "quantity") return { ...item, quantity: parseFloat(value) || 0 };
        if (field === "unit") return { ...item, unit: value };
        return { ...item, name: value };
      }) ?? null
    );
  };

  const toggleItem = (index: number) => {
    setDetected((prev) =>
      prev?.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item)) ?? null
    );
  };

  const handleAddSelected = () => {
    if (!detected) return;
    const selected = detected.filter((d) => d.selected);
    selected.forEach((item) => {
      onAdd({ name: item.name, quantity: item.quantity, unit: item.unit });
    });
    trackEvent(AnalyticsEvents.AI_IMAGE_ITEMS_ADDED, { count: selected.length });
    handleReset();
  };

  const handleReset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setDetected(null);
  };

  const selectedCount = detected?.filter((d) => d.selected).length ?? 0;

  return (
    <div className="space-y-4">
      {!imageUrl && (
        <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-6 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Snap a photo of your fridge or pantry
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We'll identify ingredients and quantities automatically.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              type="button"
              variant="hero"
              onClick={() => cameraInputRef.current?.click()}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Take photo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload image
            </Button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <p className="text-[11px] text-muted-foreground/70 italic pt-1">
            🧪 Mock preview — actual AI vision integration coming next.
          </p>
        </div>
      )}

      {imageUrl && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
            <img
              src={imageUrl}
              alt="Pantry photo"
              className="w-full max-h-[280px] object-cover"
            />
            <button
              type="button"
              onClick={handleReset}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-background transition-colors"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">Identifying ingredients…</p>
                <p className="text-xs text-muted-foreground">Scanning shelves, labels, and quantities</p>
              </div>
            )}
          </div>

          {!detected && !isAnalyzing && (
            <Button
              onClick={handleAnalyze}
              variant="hero"
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Analyze photo
            </Button>
          )}
        </div>
      )}

      {detected && detected.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Detected <strong className="text-foreground">{detected.length}</strong> item{detected.length !== 1 ? "s" : ""}.
              Review, edit quantities, then add.
            </p>
            <button
              type="button"
              onClick={handleAnalyze}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
            >
              <RefreshCw className="h-3 w-3" />
              Re-scan
            </button>
          </div>

          {detected.some((d) => d.confidence === "low") && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-foreground">
                Some items couldn't be confidently identified. Deselect or rename them before adding.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {detected.map((item, i) => {
              const conf = CONFIDENCE_STYLES[item.confidence];
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    item.selected
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card opacity-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(i)}
                    className="shrink-0"
                    aria-label={item.selected ? "Deselect" : "Select"}
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

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(i, "name", e.target.value)}
                        className="h-7 text-sm font-medium capitalize px-2 flex-1 min-w-[120px]"
                      />
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${conf.cls}`}>
                        {conf.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", e.target.value)}
                        className="h-7 w-20 text-xs px-2"
                        min="0.01"
                        step="any"
                      />
                      <Select value={item.unit} onValueChange={(v) => updateItem(i, "unit", v)}>
                        <SelectTrigger className="h-7 w-[80px] text-xs px-2">
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

      {detected && detected.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Couldn't identify any ingredients in this photo. Try a clearer shot with items spread out.
        </p>
      )}
    </div>
  );
};

export default PantryImageInput;
