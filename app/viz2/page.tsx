"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, ChevronDown, ChevronUp, Home, FlaskConical, Wand2 } from "lucide-react";
import { IconChartBar } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredFoodId, setHoveredFoodId] = useState<number | null>(null);
  const [templateMode, setTemplateMode] = useState<string>('default');
  const [demoOpen, setDemoOpen] = useState(true);
  const [countryOptions, setCountryOptions] = useState<{iso3: string, name: string}[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("AFG");

  useEffect(() => {
    if (hoveredFoodId !== null) {
      const stillExists = mealItems.some(item => item.food_id === hoveredFoodId);
      if (!stillExists) {
        setHoveredFoodId(null);
      }
    }
  }, [mealItems, hoveredFoodId]);

  useEffect(() => {
    fetch("https://nutriverse-api.ninoverstraeten.com/rpc/viz3_all_country_deficiencies?p_indicator=anaemia")
      .then(res => res.json())
      .then(data => {
        const options: {iso3: string, name: string}[] = []
        data.forEach((row: any) => {
          if (!options.find(o => o.iso3 === row.iso3)) {
            options.push({ iso3: row.iso3, name: row.country_name })
          }
        })
        options.sort((a, b) => a.name.localeCompare(b.name))
        setCountryOptions(options)
      })
      .catch(err => console.error(err))
  }, [])

  const handleAdd = useCallback((item: MealItem) => {
    setMealItems((prev) => {
      // Find exact match including meal_type (or lack thereof)
      const existing = prev.find((i) => i.food_id === item.food_id && i.meal_type === item.meal_type);
      if (existing) {
        return prev.map((i) =>
          i.food_id === item.food_id && i.meal_type === item.meal_type
            ? { ...i, grams: i.grams + item.grams }
            : i
        );
      }
      return [...prev, item];
    });
    setResults(null);
  }, []);

  const handleRemove = useCallback((food_id: number, meal_type?: string) => {
    setMealItems((prev) => prev.filter((i) => !(i.food_id === food_id && i.meal_type === meal_type)));
    setResults(null);
  }, []);

  const handleUpdateGrams = useCallback((food_id: number, grams: number, meal_type?: string) => {
    setMealItems((prev) =>
      prev.map((i) => (i.food_id === food_id && i.meal_type === meal_type ? { ...i, grams } : i))
    );
  }, []);

  const handleUpdateMealType = useCallback((food_id: number, oldMealType: string | undefined, newMealType: string) => {
    setMealItems((prev) => {
      const itemToMove = prev.find(i => i.food_id === food_id && i.meal_type === oldMealType);
      if (!itemToMove) return prev;

      const existingInDest = prev.find(i => i.food_id === food_id && i.meal_type === newMealType);
      
      if (existingInDest) {
        return prev
          .filter(i => !(i.food_id === food_id && i.meal_type === oldMealType))
          .map(i => i.food_id === food_id && i.meal_type === newMealType 
            ? { ...i, grams: i.grams + itemToMove.grams } 
            : i
          );
      } else {
        return prev.map(i => 
          i.food_id === food_id && i.meal_type === oldMealType
            ? { ...i, meal_type: newMealType }
            : i
        );
      }
    });
    setResults(null);
  }, []);

  const handleToggleLock = useCallback((food_id: number, meal_type?: string) => {
    setMealItems((prev) =>
      prev.map((i) => (i.food_id === food_id && i.meal_type === meal_type ? { ...i, is_locked: !i.is_locked } : i))
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const lockedItems = mealItems.filter(i => i.is_locked).map(i => ({
        id: i.food_id,
        name: i.food_name,
        ranking_category: i.food_category,
        serving_size_g: i.grams,
        meal_type: i.meal_type
      }));
      let mealTemplatePayload = undefined;
      if (templateMode === 'breakfast_only') {
        mealTemplatePayload = [
          { meal: "Breakfast", category: "breakfast_carb" },
          { meal: "Breakfast", category: "breakfast_protein" },
          { meal: "Breakfast", category: "beverage" }
        ];
      } else if (templateMode === 'lunch_only') {
        mealTemplatePayload = [
          { meal: "Lunch", category: "main" },
          { meal: "Lunch", category: "side" },
          { meal: "Lunch", category: "beverage" }
        ];
      } else if (templateMode === 'dinner_only') {
        mealTemplatePayload = [
          { meal: "Dinner", category: "main" },
          { meal: "Dinner", category: "carb_base" },
          { meal: "Dinner", category: "side" }
        ];
      } else if (templateMode === 'soup_and_salad') {
        mealTemplatePayload = [
          { meal: "Lunch", category: "soup" },
          { meal: "Lunch", category: "side" },
          { meal: "Lunch", category: "beverage" }
        ];
      } else if (templateMode === 'snacker') {
        mealTemplatePayload = [
          { meal: "Breakfast", category: "snack" },
          { meal: "Lunch", category: "fruit" },
          { meal: "Dinner", category: "snack" },
          { meal: "Dinner", category: "dairy_side" }
        ];
      } else if (templateMode === 'quick_composite') {
        mealTemplatePayload = [
          { meal: "Breakfast", category: "composite_meal" },
          { meal: "Lunch", category: "composite_meal" },
          { meal: "Dinner", category: "composite_meal" }
        ];
      } else if (templateMode === 'bodybuilder') {
        mealTemplatePayload = [
          { meal: "Breakfast", category: "breakfast_protein" },
          { meal: "Breakfast", category: "dairy_side" },
          { meal: "Lunch", category: "main" },
          { meal: "Lunch", category: "carb_base" },
          { meal: "Dinner", category: "main" },
          { meal: "Dinner", category: "main" }
        ];
      }

      const res = await fetch("/api/generate-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...demographics, 
          locked_items: lockedItems,
          meal_template: mealTemplatePayload 
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      if (data.items) {
        setMealItems(data.items);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to generate meal plan");
    } finally {
      setGenerating(false);
    }
  }, [demographics, mealItems, templateMode]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (mealItems.length === 0) {
      setResults(null);
      return;
    }
    setLoading(true);
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const payload = {
        meal_items: mealItems.map((item) => ({
          food_id: item.food_id,
          food_name: item.food_name,
          grams: item.grams,
        })),
        ...demographics,
      };

      const res = await fetch("/api/calculate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setResults(Array.isArray(data) ? data : data.results ?? []);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [mealItems, demographics]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleAnalyze();
    }, 500);
    return () => clearTimeout(timer);
  }, [handleAnalyze]);

  const canAnalyze = mealItems.length > 0 && !loading;

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent hover:border-border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
              <Home className="h-4 w-4" />
            </Link>
            <div className="h-4 w-[1px] bg-border" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/20 text-primary">
                <IconChartBar className="h-4 w-4" />
              </div>
              <span className="font-semibold text-foreground tracking-tight text-sm">
                Viz 2 · Perfect Plate
              </span>
            </div>
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
              className="rounded-xl border border-border bg-card p-5 space-y-4"
              aria-label="Meal tray"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground whitespace-nowrap">
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

              <div className="flex items-center gap-2.5">
                <Select value={templateMode} onValueChange={setTemplateMode}>
                  <SelectTrigger className="flex-1 h-9 bg-background transition-all focus:ring-primary/20">
                    <SelectValue placeholder="Select meal plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Full Day (7 Items)</SelectItem>
                    <SelectItem value="breakfast_only">Breakfast Only</SelectItem>
                    <SelectItem value="lunch_only">Lunch Only</SelectItem>
                    <SelectItem value="dinner_only">Dinner Only</SelectItem>
                    <SelectItem value="soup_and_salad">Soup & Salad</SelectItem>
                    <SelectItem value="quick_composite">All-in-One Meals</SelectItem>
                    <SelectItem value="snacker">The Snacker</SelectItem>
                    <SelectItem value="bodybuilder">Bodybuilder</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="h-9 shrink-0"
                  aria-label="Auto-generate an optimal meal plan"
                >
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Generate
                </Button>
              </div>
              <MealTray
                items={mealItems}
                onRemove={handleRemove}
                onUpdateGrams={handleUpdateGrams}
                onUpdateMealType={handleUpdateMealType}
                onToggleLock={handleToggleLock}
                onHover={setHoveredFoodId}
                hoveredFoodId={hoveredFoodId}
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

            {/* Global Context */}
            <section
              className="rounded-xl border border-border bg-card p-5 space-y-4"
              aria-label="Global context"
            >
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Global Context
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Explore the real-world public health impacts of malnutrition in your country.
                </p>
              </div>
              
              <div className="space-y-3">
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-full bg-background border-border">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map(c => (
                      <SelectItem key={c.iso3} value={c.iso3}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Link 
                  href={`/viz3?country=${selectedCountry}`}
                  className="inline-flex w-full items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  See your country...
                </Link>
              </div>
            </section>

            {/* Analyze CTA removed as it is now live */}

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
                <NutritionResults results={results} hoveredFoodId={hoveredFoodId} />
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
              ? "Loading your personalised EFSA nutrient breakdown..."
              : "Search for foods on the left and add them to your tray."}
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
