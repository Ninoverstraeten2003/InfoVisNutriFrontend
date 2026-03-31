import { asRows, toText } from "@/lib/utils"

export function CompactTable({ value }: { value: unknown }) {
  const rows = asRows(value).slice(0, 12)
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Run endpoint to render table.</p>

  const keys = Object.keys(rows[0]).slice(0, 5)

  return (
    <div className="overflow-auto rounded-xl border border-border bg-background/70">
      <table className="w-full min-w-[500px] text-left text-xs">
        <thead className="border-b border-border bg-muted/60">
          <tr>
            {keys.map((key) => (
              <th key={key} className="px-3 py-2 font-mono font-semibold">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-border/70">
              {keys.map((key) => (
                <td key={key} className="px-3 py-2">
                  {toText(row[key]) ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}