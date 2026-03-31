import { RankedItem } from "../../lib/types"

export function HorizontalBars({
  items,
  valueSuffix = "",
}: {
  items: RankedItem[]
  valueSuffix?: string
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Run the endpoint to render this chart.</p>
  }

  const max = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[minmax(120px,1fr)_3fr_auto] items-center gap-3 text-xs">
          <p className="truncate font-medium">{item.label}</p>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/80"
              style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
            />
          </div>
          <p className="font-mono text-muted-foreground">
            {item.value.toFixed(1)}
            {valueSuffix}
          </p>
        </div>
      ))}
    </div>
  )
}