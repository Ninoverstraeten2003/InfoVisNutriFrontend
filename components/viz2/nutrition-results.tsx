"use client";

import { cn } from "@/lib/utils";
import type { NutrientResult } from "@/lib/types";

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

function getBarColor(pct: number): string {
  if (pct >= 120) return "bg-[oklch(0.58_0.22_27)]";
  if (pct >= 90) return "bg-[oklch(0.55_0.16_155)]";
  if (pct >= 50) return "bg-[oklch(0.72_0.17_80)]";
  return "bg-[oklch(0.65_0.18_25)]";
}

function getTextColor(pct: number): string {
  if (pct >= 120) return "text-[oklch(0.58_0.22_27)]";
  if (pct >= 90) return "text-[oklch(0.55_0.16_155)]";
  if (pct >= 50) return "text-[oklch(0.72_0.17_80)]";
  return "text-[oklch(0.65_0.18_25)]";
}

function NutrientRow({ nutrient }: { nutrient: NutrientResult }) {
  const consumed = nutrient.consumed_value ?? 0;
  const hasTarget = nutrient.target_value !== null;
  const target = nutrient.target_value ?? 0;
  const displayPct = nutrient.percentage_met ?? 0;
  const pct = Math.min(displayPct, 150);

  return (
    <div className="space-y-1.5 py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground leading-tight">
          {nutrient.nutrient_name}
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground tabular-nums">
            {consumed.toFixed(1)}{" "}
            {hasTarget ? (
              <span className="text-muted-foreground/70">
                / {target.toFixed(1)} {nutrient.unit}
              </span>
            ) : (
              <span className="text-muted-foreground/70">{nutrient.unit}</span>
            )}
          </span>
          {hasTarget && (
            <span
              className={cn(
                "text-xs font-bold tabular-nums w-12 text-right",
                getTextColor(displayPct)
              )}
            >
              {displayPct.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
      {hasTarget && (
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
              getBarColor(displayPct)
            )}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
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

  // Summary stats (only counting nutrients with a target value)
  const tracked = results.filter((r) => r.target_value !== null);
  const met = tracked.filter((r) => r.percentage_met !== null && r.percentage_met >= 90 && r.percentage_met <= 120).length;
  const over = tracked.filter((r) => r.percentage_met !== null && r.percentage_met > 120).length;
  const under = tracked.filter((r) => r.percentage_met !== null && r.percentage_met < 90).length;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "On Target",
            value: met,
            color: "text-[oklch(0.55_0.16_155)]",
            bg: "bg-[oklch(0.55_0.16_155)]/10",
          },
          {
            label: "Under Target",
            value: under,
            color: "text-[oklch(0.65_0.18_25)]",
            bg: "bg-[oklch(0.65_0.18_25)]/10",
          },
          {
            label: "Over Target",
            value: over,
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
            <div className={cn("text-2xl font-bold tabular-nums", stat.color)}>
              {stat.value}
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
          { dot: "bg-[oklch(0.55_0.16_155)]", label: "90–120% (target)" },
          { dot: "bg-[oklch(0.58_0.22_27)]", label: "> 120%" },
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
