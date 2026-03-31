"use client"

import { useCallback, useEffect, useState } from "react"
import { IconBolt, IconBrandDatabricks, IconExternalLink, IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Viz1Visualizations } from "./viz1"
import { Viz2Visualizations } from "./viz2"
import { callRpc, cleanBaseUrl } from "@/lib/utils"
import { type RpcCallArgs, type EndpointState } from "@/lib/types"
import { extractStringOptions, extractDefaultOption, resolveSelection, nonEmptyQuery } from "@/lib/utils"
import { penaltyWeightOptions, limitOptions } from "@/lib/constants"

const defaultBaseUrl = process.env.NEXT_PUBLIC_POSTGREST_URL ?? "http://127.0.0.1:3000"

export function NutriVersePostgrestExplorer({ viz = "all" }: { viz?: 1 | 2 | "all" }) {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl)
  const [stateByKey, setStateByKey] = useState<Record<string, EndpointState>>({})
  const [isLoadingVisualPreset, setIsLoadingVisualPreset] = useState(false)
  const [isLoadingViz1Options, setIsLoadingViz1Options] = useState(false)
  const [viz1OptionsError, setViz1OptionsError] = useState<string | null>(null)
  const [isLoadingViz2Options, setIsLoadingViz2Options] = useState(false)
  const [viz2OptionsError, setViz2OptionsError] = useState<string | null>(null)

  const [viz1AnchorNutrient, setViz1AnchorNutrient] = useState("")
  const [viz1AnchorTopN, setViz1AnchorTopN] = useState<number | "">("")
  const [viz1NutrientOptions, setViz1NutrientOptions] = useState<string[]>([])
  const [viz2NutrientOptions, setViz2NutrientOptions] = useState<string[]>([])
  const [viz2FoodOptions, setViz2FoodOptions] = useState<string[]>([])
  const [viz2DrvSexOptions, setViz2DrvSexOptions] = useState<string[]>([])
  const [viz2RefTypeOptions, setViz2RefTypeOptions] = useState<string[]>([])
  const [viz2RelationshipOptions, setViz2RelationshipOptions] = useState<string[]>([])
  const [viz2SourceOptions, setViz2SourceOptions] = useState<string[]>([])
  const [viz2TargetOptions, setViz2TargetOptions] = useState<string[]>([])

  const [viz2TopFoodsNutrient, setViz2TopFoodsNutrient] = useState("")
  const [viz2TopFoodsDrvSex, setViz2TopFoodsDrvSex] = useState("")
  const [viz2TopFoodsRefType, setViz2TopFoodsRefType] = useState("")
  const [viz2TopFoodsLimit, setViz2TopFoodsLimit] = useState<number | "">("")

  const [viz2FoodName, setViz2FoodName] = useState("")

  const [viz2SourceNutrient, setViz2SourceNutrient] = useState("")
  const [viz2RelationshipType, setViz2RelationshipType] = useState("")
  const [viz2CuratedOnly, setViz2CuratedOnly] = useState<"" | "true" | "false">("")
  const [viz2RequiresAntagonists, setViz2RequiresAntagonists] = useState<"" | "true" | "false">("")

  const [viz2ConflictTarget, setViz2ConflictTarget] = useState("")
  const [viz2ConflictPenaltyWeight, setViz2ConflictPenaltyWeight] = useState<number | "">("")

  async function runEndpoint(key: string, call: RpcCallArgs) {
    const nextBaseUrl = cleanBaseUrl(baseUrl)
    if (nextBaseUrl.length === 0) {
      setStateByKey((prev) => ({
        ...prev,
        [key]: {
          data: null,
          error: "Base URL is required.",
          loading: false,
        },
      }))
      return
    }

    setStateByKey((prev) => ({
      ...prev,
      [key]: { data: prev[key]?.data ?? null, error: null, loading: true },
    }))

    try {
      const data = await callRpc({ ...call, baseUrl: nextBaseUrl })
      setStateByKey((prev) => ({
        ...prev,
        [key]: { data, error: null, loading: false },
      }))
    } catch (error) {
      setStateByKey((prev) => ({
        ...prev,
        [key]: {
          data: prev[key]?.data ?? null,
          error: error instanceof Error ? error.message : "Request failed",
          loading: false,
        },
      }))
    }
  }

  const loadViz1NutrientOptions = useCallback(async (nextBaseUrl?: string) => {
    const resolvedBaseUrl = cleanBaseUrl(nextBaseUrl ?? baseUrl)
    if (!resolvedBaseUrl) {
      setViz1OptionsError("Base URL is required.")
      return
    }

    setIsLoadingViz1Options(true)
    setViz1OptionsError(null)

    try {
      const data = await callRpc({
        baseUrl: resolvedBaseUrl,
        rpcName: "viz1_option_nutrients",
        method: "GET",
      })
      const options = extractStringOptions(data, ["selected_nutrient", "nutrient_name", "nutrient"])
      const defaultOption = extractDefaultOption(data, ["selected_nutrient", "nutrient_name", "nutrient"])
      setViz1NutrientOptions(options)
      setViz1AnchorNutrient((current) => resolveSelection(current, options, defaultOption))
    } catch (error) {
      setViz1OptionsError(error instanceof Error ? error.message : "Failed to load options")
      setViz1NutrientOptions([])
      setViz1AnchorNutrient("")
    } finally {
      setIsLoadingViz1Options(false)
    }
  }, [baseUrl])

  const loadViz2Options = useCallback(async (nextBaseUrl?: string) => {
    const resolvedBaseUrl = cleanBaseUrl(nextBaseUrl ?? baseUrl)
    if (!resolvedBaseUrl) {
      setViz2OptionsError("Base URL is required.")
      return
    }

    setIsLoadingViz2Options(true)
    setViz2OptionsError(null)

    try {
      const [
        nutrientsResult,
        foodsResult,
        drvSexResult,
        refTypeResult,
        relationshipResult,
        sourceResult,
        targetResult,
      ] = await Promise.allSettled([
        callRpc({
          baseUrl: resolvedBaseUrl,
          rpcName: "viz2_option_nutrients",
          method: "GET",
          query: nonEmptyQuery({
            ...(viz2TopFoodsDrvSex ? { p_drv_sex: viz2TopFoodsDrvSex } : {}),
            ...(viz2TopFoodsRefType ? { p_ref_type: viz2TopFoodsRefType } : {}),
            ...(viz2CuratedOnly ? { p_curated_only: viz2CuratedOnly } : {}),
          }),
        }),
        callRpc({
          baseUrl: resolvedBaseUrl,
          rpcName: "viz2_option_foods",
          method: "GET",
          query: nonEmptyQuery({
            ...(viz2TopFoodsNutrient ? { p_nutrient: viz2TopFoodsNutrient } : {}),
            ...(viz2TopFoodsDrvSex ? { p_drv_sex: viz2TopFoodsDrvSex } : {}),
            ...(viz2TopFoodsRefType ? { p_ref_type: viz2TopFoodsRefType } : {}),
            ...(viz2CuratedOnly ? { p_curated_only: viz2CuratedOnly } : {}),
          }),
        }),
        callRpc({
          baseUrl: resolvedBaseUrl,
          rpcName: "viz2_option_drv_sexes",
          method: "GET",
          query: nonEmptyQuery({
            ...(viz2TopFoodsNutrient ? { p_nutrient: viz2TopFoodsNutrient } : {}),
          }),
        }),
        callRpc({
          baseUrl: resolvedBaseUrl,
          rpcName: "viz2_option_ref_types",
          method: "GET",
          query: nonEmptyQuery({
            ...(viz2TopFoodsNutrient ? { p_nutrient: viz2TopFoodsNutrient } : {}),
            ...(viz2TopFoodsDrvSex ? { p_drv_sex: viz2TopFoodsDrvSex } : {}),
          }),
        }),
        callRpc({
          baseUrl: resolvedBaseUrl,
          rpcName: "viz2_option_relationship_types",
          method: "GET",
        }),
        callRpc({
          baseUrl: resolvedBaseUrl,
          rpcName: "viz2_option_source_nutrients",
          method: "GET",
          query: nonEmptyQuery({
            ...(viz2RelationshipType ? { p_relationship_type: viz2RelationshipType } : {}),
          }),
        }),
        callRpc({
          baseUrl: resolvedBaseUrl,
          rpcName: "viz2_option_target_nutrients",
          method: "GET",
          query: nonEmptyQuery({
            ...(viz2RequiresAntagonists ? { p_requires_antagonists: viz2RequiresAntagonists } : {}),
          }),
        }),
      ])

      const endpointErrors: string[] = []
      const nextNutrients =
        nutrientsResult.status === "fulfilled"
          ? extractStringOptions(nutrientsResult.value, ["nutrient_name", "p_nutrient", "nutrient"])
          : []
      if (nutrientsResult.status === "rejected") endpointErrors.push("nutrients")

      const nextFoods =
        foodsResult.status === "fulfilled"
          ? extractStringOptions(foodsResult.value, ["food_name", "p_food_name"])
          : []
      if (foodsResult.status === "rejected") endpointErrors.push("foods")

      const nextDrvSexes =
        drvSexResult.status === "fulfilled"
          ? extractStringOptions(drvSexResult.value, ["drv_sex", "p_drv_sex"])
          : []
      if (drvSexResult.status === "rejected") endpointErrors.push("DRV sexes")

      const nextRefTypes =
        refTypeResult.status === "fulfilled"
          ? extractStringOptions(refTypeResult.value, ["ref_type", "p_ref_type"])
          : []
      if (refTypeResult.status === "rejected") endpointErrors.push("reference types")

      const nextRelationships =
        relationshipResult.status === "fulfilled"
          ? extractStringOptions(relationshipResult.value, ["relationship_type", "p_relationship_type"])
          : []
      if (relationshipResult.status === "rejected") endpointErrors.push("relationship types")

      const nextSourceNutrients =
        sourceResult.status === "fulfilled"
          ? extractStringOptions(sourceResult.value, ["source_nutrient", "nutrient_name"])
          : []
      if (sourceResult.status === "rejected") endpointErrors.push("source nutrients")

      const nextTargetNutrients =
        targetResult.status === "fulfilled"
          ? extractStringOptions(targetResult.value, ["target_nutrient", "nutrient_name"])
          : []
      if (targetResult.status === "rejected") endpointErrors.push("target nutrients")

      setViz2NutrientOptions(nextNutrients)
      setViz2FoodOptions(nextFoods)
      setViz2DrvSexOptions(nextDrvSexes)
      setViz2RefTypeOptions(nextRefTypes)
      setViz2RelationshipOptions(nextRelationships)
      setViz2SourceOptions(nextSourceNutrients)
      setViz2TargetOptions(nextTargetNutrients)

      const nutrientDefault =
        nutrientsResult.status === "fulfilled"
          ? extractDefaultOption(nutrientsResult.value, ["nutrient_name", "p_nutrient", "nutrient"])
          : null
      const foodDefault =
        foodsResult.status === "fulfilled"
          ? extractDefaultOption(foodsResult.value, ["food_name", "p_food_name"])
          : null
      const drvSexDefault =
        drvSexResult.status === "fulfilled"
          ? extractDefaultOption(drvSexResult.value, ["drv_sex", "p_drv_sex"])
          : null
      const refTypeDefault =
        refTypeResult.status === "fulfilled"
          ? extractDefaultOption(refTypeResult.value, ["ref_type", "p_ref_type"])
          : null
      const relationshipDefault =
        relationshipResult.status === "fulfilled"
          ? extractDefaultOption(relationshipResult.value, ["relationship_type", "p_relationship_type"])
          : null
      const sourceDefault =
        sourceResult.status === "fulfilled"
          ? extractDefaultOption(sourceResult.value, ["source_nutrient", "nutrient_name"])
          : null
      const targetDefault =
        targetResult.status === "fulfilled"
          ? extractDefaultOption(targetResult.value, ["target_nutrient", "nutrient_name"])
          : null

      setViz2TopFoodsNutrient((current) => resolveSelection(current, nextNutrients, nutrientDefault))
      setViz2FoodName((current) => resolveSelection(current, nextFoods, foodDefault))
      setViz2TopFoodsDrvSex((current) => resolveSelection(current, nextDrvSexes, drvSexDefault))
      setViz2TopFoodsRefType((current) => resolveSelection(current, nextRefTypes, refTypeDefault))
      setViz2RelationshipType((current) => resolveSelection(current, nextRelationships, relationshipDefault))
      setViz2SourceNutrient((current) => resolveSelection(current, nextSourceNutrients, sourceDefault))
      setViz2ConflictTarget((current) => resolveSelection(current, nextTargetNutrients, targetDefault))

      if (endpointErrors.length > 0) {
        setViz2OptionsError(`Some option endpoints failed: ${endpointErrors.join(", ")}.`)
      }
    } finally {
      setIsLoadingViz2Options(false)
    }
  }, [
    baseUrl,
    viz2CuratedOnly,
    viz2RelationshipType,
    viz2RequiresAntagonists,
    viz2TopFoodsDrvSex,
    viz2TopFoodsNutrient,
    viz2TopFoodsRefType,
  ])

  useEffect(() => {
    const normalizedBaseUrl = cleanBaseUrl(baseUrl)
    if (!normalizedBaseUrl) {
      setViz1OptionsError("Base URL is required.")
      setViz1NutrientOptions([])
      setViz1AnchorNutrient("")
      return
    }

    const timeout = window.setTimeout(() => {
      void loadViz1NutrientOptions(normalizedBaseUrl)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [baseUrl, loadViz1NutrientOptions])

  useEffect(() => {
    const normalizedBaseUrl = cleanBaseUrl(baseUrl)
    if (!normalizedBaseUrl) {
      setViz2OptionsError("Base URL is required.")
      setViz2NutrientOptions([])
      setViz2FoodOptions([])
      setViz2DrvSexOptions([])
      setViz2RefTypeOptions([])
      setViz2RelationshipOptions([])
      setViz2SourceOptions([])
      setViz2TargetOptions([])
      setViz2TopFoodsNutrient("")
      setViz2FoodName("")
      setViz2TopFoodsDrvSex("")
      setViz2TopFoodsRefType("")
      setViz2RelationshipType("")
      setViz2SourceNutrient("")
      setViz2ConflictTarget("")
      return
    }

    const timeout = window.setTimeout(() => {
      void loadViz2Options(normalizedBaseUrl)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [baseUrl, loadViz2Options])

  async function runViz2Endpoints() {
    const topFoodsQuery = nonEmptyQuery({
      ...(viz2TopFoodsNutrient ? { p_nutrient: viz2TopFoodsNutrient } : {}),
      ...(viz2TopFoodsDrvSex ? { p_drv_sex: viz2TopFoodsDrvSex } : {}),
      ...(viz2TopFoodsRefType ? { p_ref_type: viz2TopFoodsRefType } : {}),
      ...(viz2TopFoodsLimit !== "" ? { p_limit: viz2TopFoodsLimit } : {}),
    })

    const supportClusterQuery = nonEmptyQuery({
      ...(viz2SourceNutrient ? { p_source_nutrient: viz2SourceNutrient } : {}),
      ...(viz2RelationshipType ? { p_relationship_type: viz2RelationshipType } : {}),
    })

    const conflictAwareQuery = nonEmptyQuery({
      ...(viz2ConflictTarget ? { p_target_nutrient: viz2ConflictTarget } : {}),
      ...(viz2ConflictPenaltyWeight !== "" ? { p_penalty_weight: viz2ConflictPenaltyWeight } : {}),
      ...(viz2TopFoodsDrvSex ? { p_drv_sex: viz2TopFoodsDrvSex } : {}),
      ...(viz2TopFoodsRefType ? { p_ref_type: viz2TopFoodsRefType } : {}),
      ...(viz2TopFoodsLimit !== "" ? { p_limit: viz2TopFoodsLimit } : {}),
    })

    const curatedRankQuery = nonEmptyQuery({
      ...(viz2TopFoodsNutrient ? { p_nutrient: viz2TopFoodsNutrient } : {}),
      ...(viz2TopFoodsDrvSex ? { p_drv_sex: viz2TopFoodsDrvSex } : {}),
      ...(viz2TopFoodsRefType ? { p_ref_type: viz2TopFoodsRefType } : {}),
      ...(viz2TopFoodsLimit !== "" ? { p_limit: viz2TopFoodsLimit } : {}),
    })

    const foodPanelBody: Record<string, unknown> = {
      ...(viz2FoodName ? { p_food_name: viz2FoodName } : {}),
      ...(viz2TopFoodsDrvSex ? { p_drv_sex: viz2TopFoodsDrvSex } : {}),
    }

    await Promise.all([
      runEndpoint("viz2TopFoods", {
        baseUrl,
        rpcName: "viz2_top_foods",
        method: "GET",
        query: topFoodsQuery,
      }),
      runEndpoint("viz2FoodPanel", {
        baseUrl,
        rpcName: "viz2_food_panel",
        method: "POST",
        body: foodPanelBody,
      }),
      runEndpoint("viz2SupportCluster", {
        baseUrl,
        rpcName: "viz2_support_cluster",
        method: "GET",
        query: supportClusterQuery,
      }),
      runEndpoint("viz2ConflictAware", {
        baseUrl,
        rpcName: "viz2_conflict_aware",
        method: "GET",
        query: conflictAwareQuery,
      }),
      runEndpoint("viz2CuratedRank", {
        baseUrl,
        rpcName: "viz2_curated_rank",
        method: "GET",
        query: curatedRankQuery,
      }),
    ])
  }

  function updateViz1SelectedNutrient(nextNutrient: string) {
    setViz1AnchorNutrient(nextNutrient)
    void runEndpoint("viz1FoodAnchors", {
      baseUrl,
      rpcName: "viz1_food_anchors",
      method: "GET",
      query: nonEmptyQuery({
        ...(nextNutrient ? { p_selected_nutrient: nextNutrient } : {}),
        ...(viz1AnchorTopN !== "" ? { p_top_n: viz1AnchorTopN } : {}),
      }),
    })
  }

  async function loadVisualPreset() {
    setIsLoadingVisualPreset(true)
    try {
      await Promise.all([
        loadViz1NutrientOptions(cleanBaseUrl(baseUrl)),
        loadViz2Options(cleanBaseUrl(baseUrl)),
        runEndpoint("viz1Edges", {
          baseUrl,
          rpcName: "viz1_graph_edges",
          method: "GET",
        }),
        runEndpoint("viz1Degree", {
          baseUrl,
          rpcName: "viz1_degree_summary",
          method: "GET",
        }),
        runEndpoint("viz1FoodAnchors", {
          baseUrl,
          rpcName: "viz1_food_anchors",
          method: "GET",
          query: nonEmptyQuery({
            ...(viz1AnchorNutrient ? { p_selected_nutrient: viz1AnchorNutrient } : {}),
            ...(viz1AnchorTopN !== "" ? { p_top_n: viz1AnchorTopN } : {}),
          }),
        }),
        runViz2Endpoints(),
      ])
    } finally {
      setIsLoadingVisualPreset(false)
    }
  }

  const viz1Edges = stateByKey.viz1Edges ?? { data: null, error: null, loading: false }
  const viz1Degree = stateByKey.viz1Degree ?? { data: null, error: null, loading: false }
  const viz1FoodAnchors = stateByKey.viz1FoodAnchors ?? { data: null, error: null, loading: false }
  const viz2TopFoods = stateByKey.viz2TopFoods ?? { data: null, error: null, loading: false }
  const viz2FoodPanel = stateByKey.viz2FoodPanel ?? { data: null, error: null, loading: false }
  const viz2SupportCluster = stateByKey.viz2SupportCluster ?? { data: null, error: null, loading: false }
  const viz2ConflictAware = stateByKey.viz2ConflictAware ?? { data: null, error: null, loading: false }
  const viz2CuratedRank = stateByKey.viz2CuratedRank ?? { data: null, error: null, loading: false }
  const isUpdatingViz2 =
    viz2TopFoods.loading ||
    viz2FoodPanel.loading ||
    viz2SupportCluster.loading ||
    viz2ConflictAware.loading ||
    viz2CuratedRank.loading
  const viz2QueryErrors = [
    viz2TopFoods.error,
    viz2FoodPanel.error,
    viz2SupportCluster.error,
    viz2ConflictAware.error,
    viz2CuratedRank.error,
  ].filter((error): error is string => Boolean(error))

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,oklch(0.93_0.03_150/0.5),transparent_55%),linear-gradient(to_bottom,oklch(1_0_0),oklch(0.98_0.01_140))] px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card/90 p-6 backdrop-blur">
          {viz !== "all" && (
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground qhover:underline">
              <IconArrowLeft size={16} />
              Back to Dashboard
            </Link>
          )}
        </section>

        {(viz === "all" || viz === 1) && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              runEndpoint("viz1Edges", { baseUrl, rpcName: "viz1_graph_edges", method: "GET" })
              runEndpoint("viz1Degree", { baseUrl, rpcName: "viz1_degree_summary", method: "GET" })
              runEndpoint("viz1FoodAnchors", {
                baseUrl,
                rpcName: "viz1_food_anchors",
                method: "GET",
                query: nonEmptyQuery({
                  ...(viz1AnchorNutrient ? { p_selected_nutrient: viz1AnchorNutrient } : {}),
                  ...(viz1AnchorTopN !== "" ? { p_top_n: viz1AnchorTopN } : {}),
                }),
              })
            }}
            className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur text-sm"
          >
            <div className="flex items-center gap-2 mr-2">
              <IconBrandDatabricks className="text-primary" size={20} />
              <h2 className="font-mono font-semibold tracking-wide uppercase">Viz 1 Menu</h2>
            </div>
            <span className="font-medium text-muted-foreground ml-2 mr-1">Explore relationships and find the top</span>
            <select
              value={viz1AnchorTopN}
              onChange={(e) => setViz1AnchorTopN(e.target.value === "" ? "" : Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs w-20 outline-none transition-colors focus:border-primary"
            >
              <option value="">API</option>
              {limitOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="font-medium text-muted-foreground mx-1">food anchors for</span>
            <select
              value={viz1AnchorNutrient}
              onChange={(e) => setViz1AnchorNutrient(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs w-36 outline-none transition-colors focus:border-primary"
            >
              <option value="">API default</option>
              {viz1NutrientOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <Button
              type="button"
              variant="outline"
              className="h-9"
              size="sm"
              onClick={() => void loadViz1NutrientOptions()}
              disabled={isLoadingViz1Options}
            >
              {isLoadingViz1Options ? "Loading nutrients..." : "Refresh nutrients"}
            </Button>
            {viz1OptionsError ? <span className="text-xs text-destructive">{viz1OptionsError}</span> : null}
            <Button 
               type="submit" 
               className="ml-auto h-9" 
               size="sm"
               disabled={viz1Edges.loading || viz1Degree.loading || viz1FoodAnchors.loading}
            >
              <IconBolt size={16} /> 
              {viz1Edges.loading || viz1Degree.loading || viz1FoodAnchors.loading ? "Updating..." : "Update Viz 1"}
            </Button>
          </form>
        )}

        {(viz === "all" || viz === 1) && (
          <Viz1Visualizations
            data={{
              viz1Edges: viz1Edges.data,
              viz1Degree: viz1Degree.data,
              viz1FoodAnchors: viz1FoodAnchors.data,
            }}
            selectedNutrientName={viz1AnchorNutrient}
            onSelectNutrient={updateViz1SelectedNutrient}
          />
        )}
        {(viz === "all" || viz === 2) && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void runViz2Endpoints()
            }}
            className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur text-sm"
          >
            <div className="flex items-center gap-2 mr-2">
              <IconBrandDatabricks className="text-primary" size={20} />
              <h2 className="font-mono font-semibold tracking-wide uppercase">Viz 2 Menu</h2>
            </div>
            <span className="font-medium text-muted-foreground">Which nutrient should we optimize for</span>
            <select
              value={viz2TopFoodsNutrient}
              onChange={(event) => setViz2TopFoodsNutrient(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs max-w-44 outline-none transition-colors focus:border-primary"
            >
              <option value="">API default</option>
              {viz2NutrientOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="font-medium text-muted-foreground">for</span>
            <select
              value={viz2TopFoodsDrvSex}
              onChange={(event) => setViz2TopFoodsDrvSex(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs outline-none transition-colors focus:border-primary"
            >
              <option value="">API default</option>
              {viz2DrvSexOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="font-medium text-muted-foreground">using</span>
            <select
              value={viz2TopFoodsRefType}
              onChange={(event) => setViz2TopFoodsRefType(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs outline-none transition-colors focus:border-primary"
            >
              <option value="">API default</option>
              {viz2RefTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="font-medium text-muted-foreground">scope</span>
            <select
              value={viz2CuratedOnly}
              onChange={(event) => setViz2CuratedOnly(event.target.value as "" | "true" | "false")}
              className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs outline-none transition-colors focus:border-primary"
            >
              <option value="">API default</option>
              <option value="false">all</option>
              <option value="true">curated only</option>
            </select>
            <span className="font-medium text-muted-foreground">with top</span>
            <select
              value={viz2TopFoodsLimit}
              onChange={(event) => setViz2TopFoodsLimit(event.target.value === "" ? "" : Number(event.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs w-20 outline-none transition-colors focus:border-primary"
            >
              <option value="">API</option>
              {limitOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="font-medium text-muted-foreground">foods. Compare food</span>
            <select
              value={viz2FoodName}
              onChange={(event) => setViz2FoodName(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs max-w-56 outline-none transition-colors focus:border-primary"
            >
              <option value="">API default</option>
              {viz2FoodOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="font-medium text-muted-foreground">with source</span>
            <select
              value={viz2SourceNutrient}
              onChange={(event) => setViz2SourceNutrient(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs max-w-44 outline-none transition-colors focus:border-primary"
            >
              <option value="">API default</option>
              {viz2SourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={viz2RelationshipType}
              onChange={(event) => setViz2RelationshipType(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs outline-none transition-colors focus:border-primary"
            >
              <option value="">API default</option>
              {viz2RelationshipOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="font-medium text-muted-foreground">links, penalize target</span>
            <select
              value={viz2ConflictTarget}
              onChange={(event) => setViz2ConflictTarget(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs max-w-44 outline-none transition-colors focus:border-primary"
            >
              <option value="">API default</option>
              {viz2TargetOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span className="font-medium text-muted-foreground">from</span>
            <select
              value={viz2RequiresAntagonists}
              onChange={(event) => setViz2RequiresAntagonists(event.target.value as "" | "true" | "false")}
              className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs outline-none transition-colors focus:border-primary"
            >
              <option value="">API default</option>
              <option value="true">antagonists only</option>
              <option value="false">all targets</option>
            </select>
            <span className="font-medium text-muted-foreground">at weight</span>
            <select
              value={viz2ConflictPenaltyWeight}
              onChange={(event) => setViz2ConflictPenaltyWeight(event.target.value === "" ? "" : Number(event.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs w-20 outline-none transition-colors focus:border-primary"
            >
              <option value="">API</option>
              {penaltyWeightOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              className="h-9"
              size="sm"
              onClick={() => void loadViz2Options()}
              disabled={isLoadingViz2Options}
            >
              {isLoadingViz2Options ? "Loading options..." : "Refresh options"}
            </Button>
            {viz2OptionsError ? <span className="text-xs text-destructive">{viz2OptionsError}</span> : null}
            {viz2QueryErrors.length > 0 ? (
              <span className="text-xs text-destructive">Query errors: {viz2QueryErrors.join(" · ")}</span>
            ) : null}
            <Button
              type="submit"
              className="ml-auto h-9"
              size="sm"
              disabled={isUpdatingViz2}
            >
              <IconBolt size={16} />
              {isUpdatingViz2 ? "Updating..." : "Update Viz 2"}
            </Button>
          </form>
        )}

        {(viz === "all" || viz === 2) && (
          <Viz2Visualizations
            data={{
              viz2TopFoods: viz2TopFoods.data,
              viz2FoodPanel: viz2FoodPanel.data,
              viz2SupportCluster: viz2SupportCluster.data,
              viz2ConflictAware: viz2ConflictAware.data,
              viz2CuratedRank: viz2CuratedRank.data,
            }}
          />
        )}
      </div>
    </main>
  )
}
