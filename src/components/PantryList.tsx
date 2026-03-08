import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PantryItem } from "@/types/pantry";

interface PantryListProps {
  items: PantryItem[];
  onRemove: (id: string) => void;
}

const PantryList = ({ items, onRemove }: PantryListProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Your pantry is empty</p>
        <p className="text-sm mt-1">Add ingredients above to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between bg-card rounded-lg px-4 py-3 border border-border group hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-medium text-foreground capitalize">{item.name}</span>
            <span className="text-sm text-muted-foreground">
              {item.quantity} {item.unit}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(item.id)}
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default PantryList;
