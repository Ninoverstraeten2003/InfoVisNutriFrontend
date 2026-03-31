import Link from "next/link"
import { IconChartBar, IconHierarchy3 } from "@tabler/icons-react"

export default function Page() {
  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,oklch(0.93_0.03_150/0.5),transparent_55%),linear-gradient(to_bottom,oklch(1_0_0),oklch(0.98_0.01_140))] px-4 py-8 flex items-center justify-center">
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card/90 p-6 backdrop-blur text-center">
          <h1 className="font-heading text-3xl font-semibold">NutriVerse API Explorer</h1>
          <p className="text-sm text-muted-foreground mx-auto max-w-lg">
            Select a visualization dashboard to explore the API.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 mt-4 text-left">
            <Link 
              href="/viz1" 
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50 outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-2">
                <IconHierarchy3 className="text-primary" />
                <h2 className="font-mono text-sm font-semibold tracking-wide uppercase">Viz 1 · Nutrient Cosmos</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Explore the network graph of nutrient relationships, find top anchors and degree leaders.
              </p>
            </Link>

            <Link 
              href="/viz2" 
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/50 outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-2">
                <IconChartBar className="text-primary" />
                <h2 className="font-mono text-sm font-semibold tracking-wide uppercase">Viz 2 · Perfect Plate</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Rank top foods, analyze nutrient composition, and explore conflict-aware dietary choices.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
