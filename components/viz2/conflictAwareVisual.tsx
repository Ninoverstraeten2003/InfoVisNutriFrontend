import { CompactTable } from "./compactTable"
import { asRows, toNumber, toText } from "@/lib/utils"

export function ConflictAwareVisual({ value }: { value: unknown }) {
  const rows = asRows(value)
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Run conflict-aware to render tradeoff rankings.</p>
  }

  if (!("tradeoff_score" in rows[0])) {
    return <CompactTable value={value} />
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.slice(0, 10).map((row, idx) => {
        const foodName = toText(row.food_name) ?? "Unknown Food"
        const tradeoffScore = toNumber(row.tradeoff_score) ?? 0
        const targetDrv = toNumber(row.target_pct_drv_per_100g) ?? 0
        const antagPenalty = toNumber(row.antagonist_pct_drv_penalty) ?? 0
        const antagonists = Array.isArray(row.antagonist_nutrients) ? row.antagonist_nutrients.join(", ") : ""

        return (
          <div key={`${foodName}-${idx}`} className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-sm font-semibold truncate" title={foodName}>{foodName}</h4>
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
                Score: {tradeoffScore.toFixed(1)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Target DRV</span>
                <span className="font-mono">{targetDrv.toFixed(1)}%</span>
              </div>
              <div className="flex justify-end items-center gap-1.5 text-xs text-right">
                <span className="text-muted-foreground truncate" title={antagonists}>
                  Penalty {antagonists ? `(${antagonists})` : ""}
                </span>
                <span className="font-mono text-destructive shrink-0">-{antagPenalty.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}