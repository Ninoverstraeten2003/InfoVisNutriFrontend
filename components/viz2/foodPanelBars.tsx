import { HorizontalBars } from "./bars"
import { RankedItem } from "../../lib/types"
import { asRows, asObject, toNumber, toText, toRankedItems } from "@/lib/utils"

export function FoodPanelBars({ value }: { value: unknown }) {
  const rows = asRows(value)

  if (rows.length > 0) {
    if ("pct_drv_per_100g_capped" in rows[0] || "pct_drv_per_100g" in rows[0]) {
      const sorted = [...rows]
        .sort((a, b) => {
          const vA = toNumber(a.pct_drv_per_100g_capped ?? a.pct_drv_per_100g ?? a.food_value_per_100g) ?? 0
          const vB = toNumber(b.pct_drv_per_100g_capped ?? b.pct_drv_per_100g ?? b.food_value_per_100g) ?? 0
          return vB - vA
        })
        .slice(0, 10)

      const max = Math.max(...sorted.map(x => toNumber(x.pct_drv_per_100g_capped ?? x.pct_drv_per_100g ?? x.food_value_per_100g) ?? 1), 1)

      return (
        <div className="flex flex-col gap-3">
          {sorted.map((item, idx) => {
            const nutrient = toText(item.nutrient_name) ?? "Unknown"
            const valStr = toNumber(item.food_value_per_100g)?.toFixed(2) ?? "0.00"
            const unit = toText(item.food_unit) ?? ""
            const drv = toNumber(item.pct_drv_per_100g_capped ?? item.pct_drv_per_100g ?? item.food_value_per_100g) ?? 0

            return (
              <div key={`${nutrient}-${idx}`} className="grid grid-cols-[minmax(120px,1fr)_3fr_auto] items-center gap-3 text-xs">
                <div className="flex flex-col">
                  <p className="truncate font-medium">{nutrient}</p>
                  <p className="text-[10px] text-muted-foreground">{valStr}{unit ? ` ${unit}` : ""} / 100g</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: `${Math.max((drv / max) * 100, 2)}%` }}
                  />
                </div>
                <p className="font-mono text-muted-foreground font-medium text-right">
                  {drv.toFixed(1)}%
                </p>
              </div>
            )
          })}
        </div>
      )
    }

    const items = toRankedItems(
      rows,
      ["nutrient_name", "nutrient", "name", "target_nutrient"],
      ["food_value_per_100g", "value", "amount", "pct_drv_per_100g"],
      10
    )
    if (items.length > 0) return <HorizontalBars items={items} />
  }

  const object = asObject(value)
  if (!object) return <p className="text-sm text-muted-foreground">Run food panel to render nutrient bars.</p>

  const items = Object.entries(object)
    .map(([key, rawValue]) => {
      const numeric = toNumber(rawValue)
      if (numeric === null) return null
      return { label: key, value: numeric }
    })
    .filter((item): item is RankedItem => item !== null)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

  if (items.length === 0) return <p className="text-sm text-muted-foreground">No numeric food panel values found.</p>
  return <HorizontalBars items={items} />
}
