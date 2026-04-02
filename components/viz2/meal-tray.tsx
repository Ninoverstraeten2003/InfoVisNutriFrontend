"use client";

import { Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { MealItem } from "@/lib/types";

interface MealTrayProps {
  items: MealItem[];
  onRemove: (food_id: number) => void;
  onUpdateGrams: (food_id: number, grams: number) => void;
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
        <div
          key={item.food_id}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 group transition-colors hover:border-primary/30"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate leading-tight">
              {item.food_name}
            </p>
            <Badge
              variant="secondary"
              className="mt-0.5 text-xs font-normal px-1.5 py-0"
            >
              {item.food_category}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Input
              type="number"
              min={1}
              max={9999}
              value={item.grams}
              onChange={(e) =>
                onUpdateGrams(
                  item.food_id,
                  Math.max(1, parseInt(e.target.value) || 1)
                )
              }
              className="w-16 h-7 text-xs text-center px-1 bg-background border-border focus-visible:ring-primary"
              aria-label={`Grams of ${item.food_name}`}
            />
            <span className="text-xs text-muted-foreground w-3">g</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(item.food_id)}
            aria-label={`Remove ${item.food_name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
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
