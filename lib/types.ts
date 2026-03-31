type Row = Record<string, unknown>

type VisualData = {
  viz1Edges: unknown
  viz1Degree: unknown
  viz1FoodAnchors: unknown
  viz2TopFoods: unknown
  viz2FoodPanel: unknown
  viz2SupportCluster: unknown
  viz2ConflictAware: unknown
  viz2CuratedRank: unknown
}

type RankedItem = {
  label: string
  value: number
}

type GraphModel = {
  nodes: { id: string; x: number; y: number; degree: number }[]
  edges: { source: string; target: string; type: string }[]
}

type HttpMethod = "GET" | "POST"

type EndpointState = {
  data: unknown
  error: string | null
  loading: boolean
}

type RpcCallArgs = {
  baseUrl: string
  rpcName: string
  method: HttpMethod
  query?: Record<string, string | number>
  body?: unknown
}

export type {
  Row,
  VisualData,
  RankedItem,
  GraphModel,
  HttpMethod,
  EndpointState,
  RpcCallArgs,
}