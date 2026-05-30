import { useState, useEffect } from "react";
import { Trash2, UtensilsCrossed, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { MealItem } from "@/lib/types";

interface MealTrayProps {
  items: MealItem[];
  onRemove: (food_id: number, meal_type?: string) => void;
  onUpdateGrams: (food_id: number, grams: number, meal_type?: string) => void;
}

function MealTrayItem({ item, onRemove, onUpdateGrams }: { item: MealItem; onRemove: (id: number, mt?: string) => void; onUpdateGrams: (id: number, g: number, mt?: string) => void }) {
  const [localGrams, setLocalGrams] = useState(item.grams.toString());

  useEffect(() => {
    setLocalGrams(item.grams.toString());
  }, [item.grams]);

  const handleChange = (val: string) => {
    setLocalGrams(val);
    const parsed = parseInt(val);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateGrams(item.food_id, parsed, item.meal_type);
    }
  };

  const stepGrams = (step: number) => {
    const next = Math.max(1, item.grams + step);
    onUpdateGrams(item.food_id, next, item.meal_type);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 group transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-tight">
            {item.food_name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {item.meal_type && (
              <Badge
                variant="outline"
                className="text-[10px] font-medium px-1.5 py-0 border-primary/30 text-primary bg-primary/5"
              >
                {item.meal_type}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="text-[10px] font-normal px-1.5 py-0"
            >
              {item.food_category}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(item.food_id, item.meal_type)}
            aria-label={`Remove ${item.food_name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/50 pt-2.5 mt-1">
        <span className="text-xs text-muted-foreground">Portion size</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => stepGrams(-10)}>
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <div className="relative">
            <Input
              type="number"
              min={1}
              max={9999}
              value={localGrams}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={() => setLocalGrams(item.grams.toString())}
              className="w-20 h-8 text-sm text-center pr-5 bg-background border-border focus-visible:ring-primary"
              aria-label={`Grams of ${item.food_name}`}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              g
            </span>
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => stepGrams(10)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MealTray({ items, onRemove, onUpdateGrams }: MealTrayProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
        <UtensilsCrossed className="h-10 w-10 opacity-30" />
        <p className="text-sm text-balance text-center">
          Your meal tray is empty. Search for foods above to add them.
        </p>
      </div>
    );
  }

  const totalGrams = items.reduce((sum, item) => sum + item.grams, 0);

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <MealTrayItem key={`${item.food_id}-${item.meal_type || "none"}`} item={item} onRemove={onRemove} onUpdateGrams={onUpdateGrams} />
      ))}

      <div className="flex items-center justify-between pt-1 px-1">
        <span className="text-xs text-muted-foreground">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
        <span className="text-xs font-medium text-foreground">
          {totalGrams}g total
        </span>
      </div>
    </div>
  );
}
