"use client"

import { useEffect, useMemo, useState } from "react"
import { IconChartBar } from "@tabler/icons-react"
import { type VisualData } from "@/lib/types"
import { buildViz1CosmosModel } from "@/lib/viz1-cosmos"
import CosmosGraph from "./viz1/cosmos-graph"
import CosmosHeader from "./viz1/cosmos-header"
import NutrientInfoPanel from "./viz1/nutrient-info-panel"
import NutrientSidebar from "./viz1/nutrient-sidebar"

export function Viz1Visualizations({
  data,
  selectedNutrientName,
  onSelectNutrient,
  fullPage = false,
}: {
  data: Pick<VisualData, "viz1Edges" | "viz1Degree" | "viz1FoodAnchors">
  selectedNutrientName?: string
  onSelectNutrient?: (name: string) => void
  fullPage?: boolean
}) {
  const model = useMemo(
    () =>
      buildViz1CosmosModel({
        edges: data.viz1Edges,
        degree: data.viz1Degree,
        foodAnchors: data.viz1FoodAnchors,
        selectedNutrientName,
      }),
    [data.viz1Degree, data.viz1Edges, data.viz1FoodAnchors, selectedNutrientName]
  )
  const [selectedId, setSelectedId] = useState<string>("")
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    if (!model.selectedId) {
      setSelectedId("")
      setHistory([])
      return
    }

    const nextSelectedId = model.selectedId
    setSelectedId(nextSelectedId)
    setHistory((current) => {
      if (current[current.length - 1] === nextSelectedId) return current
      return [nextSelectedId]
    })
  }, [model.selectedId])

  const selectedNutrient = model.nutrients.find((nutrient) => nutrient.id === selectedId) ?? null

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setHistory((current) => {
      if (current[current.length - 1] === id) return current
      return [...current, id].slice(-8)
    })

    const nutrient = model.nutrients.find((item) => item.id === id)
    if (nutrient) {
      onSelectNutrient?.(nutrient.name)
    }
  }

  if (model.nutrients.length === 0 || !selectedNutrient) {
    return (
      <section className={fullPage ? "h-screen bg-[#050814] p-0" : "flex flex-col gap-4"}>
        {!fullPage && (
          <div className="flex items-center gap-2">
            <IconChartBar />
            <h2 className="font-mono text-sm font-semibold tracking-wide uppercase">Visual Layer · Viz 1</h2>
          </div>
        )}
        <div className={fullPage ? "flex h-full items-center justify-center text-sm text-slate-400" : "rounded-3xl border border-border bg-card/80 p-8 text-sm text-muted-foreground"}>
          Run the Viz 1 endpoints to render the nutrient cosmos.
        </div>
      </section>
    )
  }

  return (
    <section className={fullPage ? "h-screen bg-[#050814] p-0" : "flex flex-col gap-4"}>
      {!fullPage && (
        <div className="flex items-center gap-2">
          <IconChartBar />
          <h2 className="font-mono text-sm font-semibold tracking-wide uppercase">Visual Layer · Viz 1</h2>
        </div>
      )}

      <div className={fullPage ? "h-full overflow-hidden bg-[#050814]" : "overflow-hidden rounded-[28px] border border-slate-800 bg-[#050814] shadow-2xl shadow-slate-950/30"}>
        <CosmosHeader nutrients={model.nutrients} history={history} onNavigate={handleSelect} />
        <div className={fullPage ? "grid h-[calc(100vh-44px)] grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_300px]" : "grid min-h-[720px] grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_300px]"}>
          <NutrientSidebar nutrients={model.nutrients} selectedId={selectedId} onSelect={handleSelect} />
          <div className="min-h-[520px]">
            <CosmosGraph
              nutrients={model.nutrients}
              selectedNutrientId={selectedId}
              onSelectNutrient={handleSelect}
            />
          </div>
          <NutrientInfoPanel nutrients={model.nutrients} selectedId={selectedId} onSelect={handleSelect} />
        </div>
      </div>
    </section>
  )
}
