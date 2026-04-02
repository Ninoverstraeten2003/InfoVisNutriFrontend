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

export interface FoodOption {
  food_id: number;
  food_name: string;
  food_category: string;
}

export interface MealItem {
  food_id: number;
  food_name: string;
  food_category: string;
  grams: number;
}

export interface Demographics {
  age: number;
  weight_kg: number;
  sex: "male" | "female";
  activity_level: "sedentary" | "low" | "moderate" | "high" | "very_high";
}

export interface NutrientResult {
  nutrient_name: string;
  nutrient_category: string;
  consumed_value: number;
  target_value: number;
  unit: string;
  percentage_met: number;
}

export type NutritionResults = NutrientResult[];


export type {
  Row,
  VisualData,
  RankedItem,
  GraphModel,
  HttpMethod,
  EndpointState,
  RpcCallArgs,
}

