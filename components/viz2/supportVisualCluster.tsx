import { asRows, toText, toNumber, findKeyByCandidates, findAnyTextKey } from "@/lib/utils"

export function SupportClusterVisual({ value }: { value: unknown }) {
  const rows = asRows(value)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Run support cluster to render top foods.</p>
  }

  const parsed = rows
    .map((row) => {
      const foodName = toText(row.food_name)
      const nutrientName = toText(row.nutrient_name)
      const drv = toNumber(row.pct_drv_per_100g_capped ?? row.pct_drv_per_100g ?? row.food_value_per_100g)
      const valStr = toNumber(row.food_value_per_100g)?.toFixed(2) ?? "0.00"
      const unit = toText(row.food_unit) ?? ""
      
      if (!foodName || !nutrientName || drv === null) return null
      return { foodName, nutrientName, drv, valStr, unit }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  const grouped = new Map<string, typeof parsed>()
  for (const item of parsed) {
    if (!grouped.has(item.nutrientName)) {
      grouped.set(item.nutrientName, [])
    }
    grouped.get(item.nutrientName)!.push(item)
  }

  const groups = Array.from(grouped.entries())

  if (groups.length === 0) {
    const labelKey = findKeyByCandidates(rows, ["target_nutrient", "nutrient_name", "target", "name"], "text") ?? findAnyTextKey(rows)
    const labels = labelKey ? rows.map(r => toText(r[labelKey])).filter((x): x is string => x !== null).slice(0, 40) : []
    return (
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <span key={label} className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
            {label}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map(([nutrient, items]) => {
        const sorted = [...items].sort((a, b) => b.drv - a.drv).slice(0, 5)
        const max = Math.max(...sorted.map(x => x.drv), 1)

        return (
          <div key={nutrient} className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/5 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-primary/90">{nutrient}</h4>
            <div className="flex flex-col gap-2">
              {sorted.map((item, idx) => (
                <div key={`${item.foodName}-${idx}`} className="grid grid-cols-[minmax(120px,1fr)_3fr_auto] items-center gap-3 text-xs">
                  <div className="flex flex-col">
                    <p className="truncate font-medium">{item.foodName}</p>
                    {item.valStr && <p className="text-[10px] text-muted-foreground">{item.valStr}{item.unit ? ` ${item.unit}` : ""} / 100g</p>}
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{ width: `${Math.max((item.drv / max) * 100, 2)}%` }}
                    />
                  </div>
                  <p className="font-mono text-muted-foreground font-medium text-right">
                    {item.drv.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
