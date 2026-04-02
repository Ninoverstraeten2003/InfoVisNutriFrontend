'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import CosmosHeader from '@/components/viz1/cosmos-header'
import NutrientInfoPanel from '@/components/viz1/nutrient-info-panel'
import NutrientSidebar from '@/components/viz1/nutrient-sidebar'
import { buildViz1CosmosModel } from '@/lib/viz1-cosmos'
import { extractDefaultOption, nonEmptyQuery } from '@/lib/utils'

const CosmosGraph = dynamic(() => import('@/components/viz1/cosmos-graph'), { ssr: false })

async function fetchViz1Data(rpcName: string, query?: Record<string, string | number>) {
  const endpointMap: Record<string, string> = {
    'viz1_option_nutrients': '/api/viz1-option-nutrients',
    'viz1_graph_edges': '/api/viz1-graph-edges',
    'viz1_degree_summary': '/api/viz1-degree-summary',
    'viz1_food_anchors': '/api/viz1-food-anchors',
  }
  
  const url = new URL(endpointMap[rpcName], window.location.origin)
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      url.searchParams.set(k, String(v))
    })
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

type Viz1PageState = {
  edges: unknown
  degree: unknown
  foodAnchors: unknown
}

export default function Page() {
  const [data, setData] = useState<Viz1PageState>({
    edges: null,
    degree: null,
    foodAnchors: null,
  })
  const [selectedNutrientName, setSelectedNutrientName] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [infoPanelOpen, setInfoPanelOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const model = useMemo(
    () =>
      buildViz1CosmosModel({
        edges: data.edges,
        degree: data.degree,
        foodAnchors: data.foodAnchors,
        selectedNutrientName,
      }),
    [data.degree, data.edges, data.foodAnchors, selectedNutrientName]
  )

  useEffect(() => {
    if (!model.selectedId) return
    const nextSelectedId = model.selectedId

    setSelectedId((current) => current || nextSelectedId)
    setHistory((current) => {
      if (current.length > 0) return current
      return [nextSelectedId]
    })
  }, [model.selectedId])

  const loadFoodAnchors = useCallback(async (nutrientName: string) => {
    const foodAnchors = await fetchViz1Data(
      'viz1_food_anchors',
      nonEmptyQuery({
        ...(nutrientName ? { p_selected_nutrient: nutrientName } : {}),
      })
    )

    setData((current) => ({ ...current, foodAnchors }))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const optionData = await fetchViz1Data('viz1_option_nutrients')

        const defaultNutrient =
          extractDefaultOption(optionData, ['selected_nutrient', 'nutrient_name', 'nutrient']) ?? ''

        const [edges, degree, foodAnchors] = await Promise.all([
          fetchViz1Data('viz1_graph_edges'),
          fetchViz1Data('viz1_degree_summary'),
          fetchViz1Data(
            'viz1_food_anchors',
            nonEmptyQuery({
              ...(defaultNutrient ? { p_selected_nutrient: defaultNutrient } : {}),
            })
          ),
        ])

        if (cancelled) return

        setSelectedNutrientName(defaultNutrient)
        setData({ edges, degree, foodAnchors })
      } catch (loadError) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : 'Failed to load Viz 1')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    setHistory((prev) => {
      if (prev[prev.length - 1] === id) return prev
      const next = [...prev, id]
      return next.length > 8 ? next.slice(next.length - 8) : next
    })

    const nutrient = model.nutrients.find((item) => item.id === id)
    if (!nutrient || nutrient.name === selectedNutrientName) return

    setSelectedNutrientName(nutrient.name)
    void loadFoodAnchors(nutrient.name).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Failed to update food anchors')
    })
  }, [loadFoodAnchors, model.nutrients, selectedNutrientName])

  const handleNavigateHistory = useCallback((id: string) => {
    setSelectedId(id)
    setHistory((prev) => {
      const idx = prev.lastIndexOf(id)
      if (idx >= 0) return prev.slice(0, idx + 1)
      return [...prev, id]
    })

    const nutrient = model.nutrients.find((item) => item.id === id)
    if (!nutrient || nutrient.name === selectedNutrientName) return

    setSelectedNutrientName(nutrient.name)
    void loadFoodAnchors(nutrient.name).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Failed to update food anchors')
    })
  }, [loadFoodAnchors, model.nutrients, selectedNutrientName])

  if (isLoading) {
    return (
      <main
        className="flex h-screen w-screen items-center justify-center overflow-hidden"
        style={{ background: 'var(--cosmos-star-bg)', color: 'var(--cosmos-food-dot)' }}
      >
        Loading nutrient cosmos...
      </main>
    )
  }

  if (error || model.nutrients.length === 0 || !selectedId) {
    return (
      <main
        className="flex h-screen w-screen items-center justify-center overflow-hidden p-6 text-center"
        style={{ background: 'var(--cosmos-star-bg)', color: error ? '#fda4af' : 'var(--cosmos-food-dot)' }}
      >
        {error ?? 'No Viz 1 nutrient data available.'}
      </main>
    )
  }

  return (
    <main
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: 'var(--cosmos-star-bg)', color: 'var(--cosmos-food-dot)' }}
    >
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <CosmosHeader nutrients={model.nutrients} history={history} onNavigate={handleNavigateHistory} />

        <div className="flex flex-1 overflow-hidden">
          <button
            className="absolute left-0 top-1/2 z-30 -translate-y-1/2 rounded-r-md p-1 sm:hidden"
            style={{ background: 'var(--sidebar-accent)', border: '1px solid var(--sidebar-border)', borderLeft: 'none' }}
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label="Toggle sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d={sidebarOpen ? 'M9 2L4 7L9 12' : 'M5 2L10 7L5 12'} stroke="var(--sidebar-primary)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <div
            className={`flex-shrink-0 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'w-52' : 'w-0'}`}
          >
            <div className="h-full w-52">
              <NutrientSidebar nutrients={model.nutrients} selectedId={selectedId} onSelect={handleSelect} />
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <CosmosGraph
              nutrients={model.nutrients}
              selectedNutrientId={selectedId}
              onSelectNutrient={handleSelect}
            />

            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
              <button
                onClick={() => setSidebarOpen((value) => !value)}
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-mono transition-all sm:flex"
                style={{
                  background: 'color-mix(in srgb, var(--sidebar) 85%, transparent)',
                  border: '1px solid var(--sidebar-border)',
                  color: 'var(--foreground)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="2" width="4" height="8" rx="1" stroke="var(--sidebar-primary)" strokeWidth="1" />
                  <path d="M8 4h2M8 6h2M8 8h2" stroke="var(--sidebar-primary)" strokeWidth="1" strokeLinecap="round" />
                </svg>
                {sidebarOpen ? 'Hide' : 'Show'} nutrients
              </button>
              <div
                className="rounded-full px-3 py-1.5 text-xs font-mono"
                style={{
                  background: 'color-mix(in srgb, var(--sidebar) 85%, transparent)',
                  border: '1px solid var(--sidebar-border)',
                  color: 'var(--foreground)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Hover to explore · Click to pin · Double-click to navigate
              </div>
              <button
                onClick={() => setInfoPanelOpen((value) => !value)}
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-mono transition-all sm:flex"
                style={{
                  background: 'color-mix(in srgb, var(--sidebar) 85%, transparent)',
                  border: '1px solid var(--sidebar-border)',
                  color: 'var(--foreground)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="var(--sidebar-primary)" strokeWidth="1" />
                  <path d="M6 5v4M6 3.5v.5" stroke="var(--sidebar-primary)" strokeWidth="1" strokeLinecap="round" />
                </svg>
                {infoPanelOpen ? 'Hide' : 'Show'} info
              </button>
            </div>
          </div>

          <div
            className={`flex-shrink-0 overflow-hidden transition-all duration-300 ${infoPanelOpen ? 'w-60' : 'w-0'}`}
          >
            <div className="h-full w-60">
              <NutrientInfoPanel nutrients={model.nutrients} selectedId={selectedId} onSelect={handleSelect} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
