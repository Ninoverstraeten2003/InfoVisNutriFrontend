"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FoodOption, MealItem } from "@/lib/types";

interface FoodSearchProps {
  onAdd: (item: MealItem) => void;
}

export function FoodSearch({ onAdd }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedGrams, setSelectedGrams] = useState<Record<number, number>>(
    {}
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/food-options?q=${encodeURIComponent(q.trim())}`
      );
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getGrams = (id: number) => selectedGrams[id] ?? 100;

  const handleAdd = (food: FoodOption) => {
    onAdd({
      food_id: food.food_id,
      food_name: food.food_name,
      food_category: food.food_category,
      grams: getGrams(food.food_id),
    });
    setSelectedGrams((prev) => {
      const next = { ...prev };
      delete next[food.food_id];
      return next;
    });
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search foods — e.g. Apple, Chicken, Rice..."
          className="pl-9 pr-9 bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          aria-label="Search foods"
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div
          role="listbox"
          aria-label="Food search results"
          className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
        >
          <div className="max-h-80 overflow-y-auto">
            {results.map((food) => (
              <div
                key={food.food_id}
                className="group flex items-center gap-3 px-3 py-2.5 hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border/50 last:border-0"
                role="option"
                aria-selected="false"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-accent-foreground truncate">
                    {food.food_name}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-0.5 text-xs font-normal px-1.5 py-0"
                  >
                    {food.food_category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={9999}
                      value={getGrams(food.food_id)}
                      onChange={(e) =>
                        setSelectedGrams((prev) => ({
                          ...prev,
                          [food.food_id]: Math.max(
                            1,
                            parseInt(e.target.value) || 1
                          ),
                        }))
                      }
                      className="w-16 h-7 text-xs text-center px-1 bg-background text-foreground border-border"
                      aria-label={`Grams for ${food.food_name}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-muted-foreground">g</span>
                  </div>
                  <Button
                    size="sm"
                    className="h-7 w-7 p-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => handleAdd(food)}
                    aria-label={`Add ${food.food_name} to meal`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {open && !loading && query.trim() && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            No foods found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
