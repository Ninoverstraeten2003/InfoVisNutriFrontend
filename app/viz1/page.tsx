'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import CosmosHeader from '@/components/viz1/cosmos-header'
import NutrientInfoPanel from '@/components/viz1/nutrient-info-panel'
import NutrientSidebar from '@/components/viz1/nutrient-sidebar'
import { buildViz1CosmosModel } from '@/lib/viz1-cosmos'
import { callRpc, cleanBaseUrl, extractDefaultOption, nonEmptyQuery } from '@/lib/utils'

const CosmosGraph = dynamic(() => import('@/components/viz1/cosmos-graph'), { ssr: false })

const defaultBaseUrl = process.env.NEXT_PUBLIC_POSTGREST_URL ?? 'http://127.0.0.1:3000'

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

  const baseUrl = cleanBaseUrl(defaultBaseUrl)

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
    const foodAnchors = await callRpc({
      baseUrl,
      rpcName: 'viz1_food_anchors',
      method: 'GET',
      query: nonEmptyQuery({
        ...(nutrientName ? { p_selected_nutrient: nutrientName } : {}),
      }),
    })

    setData((current) => ({ ...current, foodAnchors }))
  }, [baseUrl])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const optionData = await callRpc({
          baseUrl,
          rpcName: 'viz1_option_nutrients',
          method: 'GET',
        })

        const defaultNutrient =
          extractDefaultOption(optionData, ['selected_nutrient', 'nutrient_name', 'nutrient']) ?? ''

        const [edges, degree, foodAnchors] = await Promise.all([
          callRpc({
            baseUrl,
            rpcName: 'viz1_graph_edges',
            method: 'GET',
          }),
          callRpc({
            baseUrl,
            rpcName: 'viz1_degree_summary',
            method: 'GET',
          }),
          callRpc({
            baseUrl,
            rpcName: 'viz1_food_anchors',
            method: 'GET',
            query: nonEmptyQuery({
              ...(defaultNutrient ? { p_selected_nutrient: defaultNutrient } : {}),
            }),
          }),
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
  }, [baseUrl])

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
        style={{ background: '#050814', color: '#e8eaf6' }}
      >
        Loading nutrient cosmos...
      </main>
    )
  }

  if (error || model.nutrients.length === 0 || !selectedId) {
    return (
      <main
        className="flex h-screen w-screen items-center justify-center overflow-hidden p-6 text-center"
        style={{ background: '#050814', color: error ? '#fda4af' : '#e8eaf6' }}
      >
        {error ?? 'No Viz 1 nutrient data available.'}
      </main>
    )
  }

  return (
    <main
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: '#050814', color: '#e8eaf6' }}
    >
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <CosmosHeader nutrients={model.nutrients} history={history} onNavigate={handleNavigateHistory} />

        <div className="flex flex-1 overflow-hidden">
          <button
            className="absolute left-0 top-1/2 z-30 -translate-y-1/2 rounded-r-md p-1 sm:hidden"
            style={{ background: '#0d1a3a', border: '1px solid #1a2a5a', borderLeft: 'none' }}
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label="Toggle sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d={sidebarOpen ? 'M9 2L4 7L9 12' : 'M5 2L10 7L5 12'} stroke="#4fc3f7" strokeWidth="1.5" strokeLinecap="round" />
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
                  background: 'rgba(10,15,46,0.85)',
                  border: '1px solid #1a2a5a',
                  color: '#546e7a',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="2" width="4" height="8" rx="1" stroke="#4fc3f7" strokeWidth="1" />
                  <path d="M8 4h2M8 6h2M8 8h2" stroke="#4fc3f7" strokeWidth="1" strokeLinecap="round" />
                </svg>
                {sidebarOpen ? 'Hide' : 'Show'} nutrients
              </button>
              <div
                className="rounded-full px-3 py-1.5 text-xs font-mono"
                style={{
                  background: 'rgba(10,15,46,0.85)',
                  border: '1px solid #1a2a5a',
                  color: '#546e7a',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Hover to explore · Click to pin · Double-click to navigate
              </div>
              <button
                onClick={() => setInfoPanelOpen((value) => !value)}
                className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-mono transition-all sm:flex"
                style={{
                  background: 'rgba(10,15,46,0.85)',
                  border: '1px solid #1a2a5a',
                  color: '#546e7a',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#4fc3f7" strokeWidth="1" />
                  <path d="M6 5v4M6 3.5v.5" stroke="#4fc3f7" strokeWidth="1" strokeLinecap="round" />
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
