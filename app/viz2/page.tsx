"use client";

import { useState, useCallback } from "react";
import { Loader2, FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FoodSearch } from "@/components/viz2/food-search";
import { MealTray } from "@/components/viz2/meal-tray";
import { DemographicsForm } from "@/components/viz2/demographics-form";
import { NutritionResults } from "@/components/viz2/nutrition-results";
import type { MealItem, Demographics, NutritionResults as NutritionResultsType } from "@/lib/types";

const DEFAULT_DEMOGRAPHICS: Demographics = {
  age: 30,
  weight_kg: 70,
  sex: "male",
  activity_level: "moderate",
};

export default function MealBuilderPage() {
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [demographics, setDemographics] =
    useState<Demographics>(DEFAULT_DEMOGRAPHICS);
  const [results, setResults] = useState<NutritionResultsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(true);

  const handleAdd = useCallback((item: MealItem) => {
    setMealItems((prev) => {
      const existing = prev.find((i) => i.food_id === item.food_id);
      if (existing) {
        return prev.map((i) =>
          i.food_id === item.food_id
            ? { ...i, grams: i.grams + item.grams }
            : i
        );
      }
      return [...prev, item];
    });
    setResults(null);
  }, []);

  const handleRemove = useCallback((food_id: number) => {
    setMealItems((prev) => prev.filter((i) => i.food_id !== food_id));
    setResults(null);
  }, []);

  const handleUpdateGrams = useCallback((food_id: number, grams: number) => {
    setMealItems((prev) =>
      prev.map((i) => (i.food_id === food_id ? { ...i, grams } : i))
    );
    setResults(null);
  }, []);

  const handleAnalyze = async () => {
    if (mealItems.length === 0) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const payload = {
        meal_items: mealItems.map((item) => ({
          food_id: item.food_id,
          grams: item.grams,
        })),
        ...demographics,
      };

      const res = await fetch("/api/calculate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setResults(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze = mealItems.length > 0 && !loading;

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <FlaskConical className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">
              Meal Builder
            </span>
            <span className="hidden sm:inline text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
              EFSA Reference Values
            </span>
          </div>
          <p className="text-xs text-muted-foreground hidden md:block text-right">
            Add foods · Set portions · Analyze nutrition
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
          {/* Left column: builder panel */}
          <aside className="space-y-5">
            {/* Food Search */}
            <section
              className="rounded-xl border border-border bg-card p-5 space-y-4"
              aria-label="Food search"
            >
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Add Foods
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Search by name and set the gram amount before adding.
                </p>
              </div>
              <FoodSearch onAdd={handleAdd} />
            </section>

            {/* Meal Tray */}
            <section
              className="rounded-xl border border-border bg-card p-5 space-y-3"
              aria-label="Meal tray"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Your Meal Tray
                </h2>
                {mealItems.length > 0 && (
                  <button
                    onClick={() => setMealItems([])}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Clear all meal items"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <MealTray
                items={mealItems}
                onRemove={handleRemove}
                onUpdateGrams={handleUpdateGrams}
              />
            </section>

            {/* Demographics */}
            <section
              className="rounded-xl border border-border bg-card overflow-hidden"
              aria-label="Demographics"
            >
              <button
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-accent/50 transition-colors"
                onClick={() => setDemoOpen((v) => !v)}
                aria-expanded={demoOpen}
                aria-controls="demographics-panel"
              >
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Your Profile
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Used to calculate your personalised EFSA targets
                  </p>
                </div>
                {demoOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {demoOpen && (
                <div id="demographics-panel" className="px-5 pb-5">
                  <Separator className="mb-4" />
                  <DemographicsForm
                    value={demographics}
                    onChange={setDemographics}
                  />
                </div>
              )}
            </section>

            {/* Analyze CTA */}
            <Button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              aria-label="Analyze meal nutrition"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analysing...
                </>
              ) : (
                <>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Analyse Nutrition
                  {mealItems.length > 0 && (
                    <span className="ml-2 opacity-70 text-xs font-normal">
                      ({mealItems.length} food
                      {mealItems.length !== 1 ? "s" : ""})
                    </span>
                  )}
                </>
              )}
            </Button>

            {error && (
              <p
                className="text-xs text-destructive bg-destructive/10 rounded-lg px-4 py-3 border border-destructive/20"
                role="alert"
              >
                {error}
              </p>
            )}
          </aside>

          {/* Right column: results */}
          <section
            className="rounded-xl border border-border bg-card p-5 min-h-64"
            aria-label="Nutrition analysis results"
            aria-live="polite"
          >
            {results ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Nutrition Analysis
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Compared against your personalised EFSA daily reference
                    values
                  </p>
                </div>
                <Separator />
                <NutritionResults results={results} />
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Calculating your nutrition profile...</p>
              </div>
            ) : (
              <EmptyResultsState hasFoods={mealItems.length > 0} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function EmptyResultsState({ hasFoods }: { hasFoods: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <FlaskConical className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {hasFoods ? "Ready to Analyse" : "Start Building Your Meal"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs text-balance">
          {hasFoods
            ? "Click Analyse Nutrition to see your full EFSA nutrient breakdown."
            : "Search for foods on the left, add them to your tray, then click Analyse Nutrition."}
        </p>
      </div>
      {!hasFoods && (
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {["Apple, raw", "Chicken breast", "Brown rice", "Spinach"].map(
            (food) => (
              <span
                key={food}
                className="text-xs bg-accent text-accent-foreground rounded-full px-3 py-1 border border-border"
              >
                {food}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}
