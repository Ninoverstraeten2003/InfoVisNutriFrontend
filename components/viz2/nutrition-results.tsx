"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { NutrientResult } from "@/lib/types";
import { Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";

interface NutritionResultsProps {
  results: NutrientResult[];
}

const CATEGORY_ORDER = ["energy", "macro", "lipid", "vitamin", "mineral", "other"];
const CATEGORY_LABELS: Record<string, string> = {
  energy: "Energy",
  macro: "Macronutrients",
  lipid: "Lipids & Fatty Acids",
  vitamin: "Vitamins",
  mineral: "Minerals",
  other: "Other Nutrients",
};

// These nutrients have EFSA ULs that apply only to supplements or synthetic fortificants.
// If tracking whole foods, exceeding these targets is biologically safe.
const SUPPLEMENT_ONLY_ULS = [
  'Magnesium', 
  'Folate', 
  'Vitamin B3', 
  'Vitamin E (total)'
];

const showToxicityWarning = (nutrient: NutrientResult) => {
  if (SUPPLEMENT_ONLY_ULS.includes(nutrient.nutrient_name)) {
    return false; // Ignore UL warning
  }
  return nutrient.max_value !== null && (nutrient.consumed_value ?? 0) > nutrient.max_value;
};

function getStatusColor(nutrient: NutrientResult, type: "bg" | "text"): string {
  const consumed = nutrient.consumed_value ?? 0;
  const pct = nutrient.percentage_met ?? 0;

  // OVER target limit
  if (showToxicityWarning(nutrient)) {
    return type === "bg" ? "bg-[oklch(0.58_0.22_27)]" : "text-[oklch(0.58_0.22_27)]";
  }

  // Met target
  if (nutrient.target_value !== null && pct >= 90) {
    return type === "bg" ? "bg-[oklch(0.55_0.16_155)]" : "text-[oklch(0.55_0.16_155)]";
  }

  // Has no target, but has max value and is not over it
  if (nutrient.target_value === null && nutrient.max_value !== null) {
    return type === "bg" ? "bg-[oklch(0.55_0.16_155)]" : "text-[oklch(0.55_0.16_155)]";
  }

  // Partial target
  if (pct >= 50) {
    return type === "bg" ? "bg-[oklch(0.72_0.17_80)]" : "text-[oklch(0.72_0.17_80)]";
  }

  // Under target
  return type === "bg" ? "bg-[oklch(0.65_0.18_25)]" : "text-[oklch(0.65_0.18_25)]";
}

function formatNumber(val: number): string {
  if (val === 0) return "0.0";
  if (val < 0.1) return val.toFixed(2);
  if (val >= 100) return val.toFixed(0);
  return val.toFixed(1);
}

function NutrientRow({ nutrient }: { nutrient: NutrientResult }) {
  const [expanded, setExpanded] = useState(false);

  const consumed = nutrient.consumed_value ?? 0;
  const hasTarget = nutrient.target_value !== null;
  const hasMax = nutrient.max_value !== null && !SUPPLEMENT_ONLY_ULS.includes(nutrient.nutrient_name);
  const target = nutrient.target_value ?? 0;
  const max = nutrient.max_value ?? 0;
  
  let displayPct = nutrient.percentage_met ?? 0;
  if (!hasTarget && hasMax && max > 0) {
    displayPct = (consumed / max) * 100;
  }
  const pct = Math.min(displayPct, 150);

  return (
    <div className="py-2.5 border-b border-border/50 last:border-0">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="h-5 w-5 rounded hover:bg-accent/20 flex items-center justify-center text-muted-foreground transition-colors"
              aria-label={expanded ? "Hide breakdown" : "Show breakdown"}
            >
              {expanded ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </button>
            <span className="text-sm font-medium text-foreground leading-tight">
              {nutrient.nutrient_name}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatNumber(consumed)}{" "}
              {hasTarget && hasMax ? (
                <span className="text-muted-foreground/70">
                  / {formatNumber(target)} (max {formatNumber(max)}) {nutrient.unit}
                </span>
              ) : hasTarget ? (
                <span className="text-muted-foreground/70">
                  / {formatNumber(target)} {nutrient.unit}
                </span>
              ) : hasMax ? (
                <span className="text-muted-foreground/70">
                  (max {formatNumber(max)}) {nutrient.unit}
                </span>
              ) : (
                <span className="text-muted-foreground/70">{nutrient.unit}</span>
              )}
            </span>
            {(hasTarget || hasMax) && (
              <span
                className={cn(
                  "text-xs font-bold tabular-nums w-12 text-right",
                  getStatusColor(nutrient, "text")
                )}
              >
                {displayPct.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        {(hasTarget || hasMax) && (
          <div className="pl-7 mt-1.5">
            <div
              className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(displayPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${nutrient.nutrient_name}: ${displayPct.toFixed(0)}% of daily target`}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  getStatusColor(nutrient, "bg")
                )}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {expanded && (
        <div className="mt-3 ml-7 space-y-2 animate-in slide-in-from-top-1 fade-in duration-200">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Top Sources in Meal
          </div>
          {nutrient.breakdown && nutrient.breakdown.length > 0 ? (
            nutrient.breakdown.map((b, index) => (
              <div key={`${b.food_id}-${index}`} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{b.food_name}</span>
                <span className="font-mono">{formatNumber(b.consumed_value)} {nutrient.unit}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground italic">No significant sources</div>
          )}
          
          <div className="pt-2 mt-2 border-t border-border/50">
            <Link 
              href={`/viz1?nutrient=${encodeURIComponent(nutrient.nutrient_name)}`}
              className="group inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 hover:text-primary"
            >
              Learn more in Cosmos Graph
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function NutritionResults({ results }: NutritionResultsProps) {
  const grouped = CATEGORY_ORDER.reduce<Record<string, NutrientResult[]>>(
    (acc, cat) => {
      const items = results.filter(
        (r) => r.nutrient_category?.toLowerCase() === cat
      );
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {}
  );

  // Catch any uncategorized items
  const known = new Set(CATEGORY_ORDER);
  const uncategorized = results.filter(
    (r) => !known.has(r.nutrient_category?.toLowerCase())
  );
  if (uncategorized.length > 0) grouped["other"] = uncategorized;

  const totalCategories = Object.keys(grouped).length;

  if (totalCategories === 0) return null;

  // Summary stats (counting nutrients with a target value OR a max value)
  const tracked = results.filter((r) => r.target_value !== null || r.max_value !== null);
  const over = tracked.filter((r) => showToxicityWarning(r)).length;
  const under = tracked.filter((r) => r.target_value !== null && (r.percentage_met ?? 0) < 90).length;
  const met = tracked.length - over - under;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "On Target",
            value: met,
            total: tracked.length,
            color: "text-[oklch(0.55_0.16_155)]",
            bg: "bg-[oklch(0.55_0.16_155)]/10",
          },
          {
            label: "Under Target",
            value: under,
            total: tracked.length,
            color: "text-[oklch(0.65_0.18_25)]",
            bg: "bg-[oklch(0.65_0.18_25)]/10",
          },
          {
            label: "Over Target",
            value: over,
            total: tracked.length,
            color: "text-[oklch(0.58_0.22_27)]",
            bg: "bg-[oklch(0.58_0.22_27)]/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "rounded-lg px-3 py-2.5 text-center",
              stat.bg
            )}
          >
            <div className={cn("text-2xl font-bold tabular-nums flex items-baseline justify-center", stat.color)}>
              {stat.value}
              <span className="text-sm font-medium opacity-60 ml-1">
                / {stat.total}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {[
          { dot: "bg-[oklch(0.65_0.18_25)]", label: "< 50%" },
          { dot: "bg-[oklch(0.72_0.17_80)]", label: "50–89%" },
          { dot: "bg-[oklch(0.55_0.16_155)]", label: "≥ 90% (target)" },
          { dot: "bg-[oklch(0.58_0.22_27)]", label: "> Max Limit" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", l.dot)} />
            {l.label}
          </span>
        ))}
      </div>

      {/* Category sections */}
      {Object.entries(grouped).map(([cat, nutrients]) => (
        <section key={cat} aria-label={CATEGORY_LABELS[cat] ?? cat}>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            {CATEGORY_LABELS[cat] ?? cat}
          </h3>
          <div className="rounded-lg border border-border bg-card px-4">
            {nutrients.map((nutrient) => (
              <NutrientRow key={nutrient.nutrient_name} nutrient={nutrient} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
