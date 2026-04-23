import { useState } from "react";
import { Package, ChevronDown, ChevronUp, Search, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PantryItem } from "@/types/pantry";

interface MiniPantryPanelProps {
  items: PantryItem[];
  /** Names (lowercased) of pantry items that the AI substitution references — these get highlighted. */
  highlightedNames?: string[];
}

/**
 * Mock-only visual prototype: a sticky, collapsible pantry panel shown next to recipe
 * instructions so users can cross-reference what they have while reading subs.
 *
 * NOTE: this component is purely presentational right now — `highlightedNames` is wired
 * up but not yet driven by real substitution data. We'll connect it once the UX is approved.
 */
const MiniPantryPanel = ({ items, highlightedNames = [] }: MiniPantryPanelProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");

  const highlightSet = new Set(highlightedNames.map((n) => n.toLowerCase()));
  const filtered = query.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  // Sort: highlighted (referenced by current sub) first, then alphabetical
  const sorted = [...filtered].sort((a, b) => {
    const aHi = highlightSet.has(a.name.toLowerCase()) ? 0 : 1;
    const bHi = highlightSet.has(b.name.toLowerCase()) ? 0 : 1;
    if (aHi !== bHi) return aHi - bHi;
    return a.name.localeCompare(b.name);
  });

  return (
    <aside
      className="rounded-xl border border-border bg-card shadow-sm overflow-hidden lg:sticky lg:top-4"
      aria-label="Your pantry"
    >
      <header className="flex items-center justify-between gap-2 px-4 py-3 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <Package className="h-4 w-4 text-primary shrink-0" />
          <h4 className="font-body font-semibold text-sm text-foreground truncate">
            Your pantry
          </h4>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {items.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand pantry" : "Collapse pantry"}
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </header>

      {!collapsed && (
        <div className="p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pantry…"
              className="h-8 text-xs pl-8"
            />
          </div>

          {highlightSet.size > 0 && (
            <p className="text-[11px] text-muted-foreground leading-snug">
              <span className="inline-flex items-center gap-1 text-primary font-medium">
                <CheckCircle2 className="h-3 w-3" /> Highlighted
              </span>{" "}
              items are used by the current substitution.
            </p>
          )}

          <ul className="max-h-[420px] overflow-y-auto pr-1 space-y-1 -mx-1 px-1">
            {sorted.length === 0 && (
              <li className="text-xs text-muted-foreground italic py-2 text-center">
                No matching items.
              </li>
            )}
            {sorted.map((item) => {
              const isHi = highlightSet.has(item.name.toLowerCase());
              return (
                <li
                  key={item.id}
                  className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    isHi
                      ? "bg-primary/10 border border-primary/30 text-foreground"
                      : "hover:bg-muted/60 text-foreground/80"
                  }`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    {isHi && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
                    <span className={`truncate ${isHi ? "font-medium" : ""}`}>{item.name}</span>
                  </span>
                  <span
                    className={`shrink-0 tabular-nums ${
                      isHi ? "text-primary font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {item.quantity} {item.unit}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
};

export default MiniPantryPanel;
