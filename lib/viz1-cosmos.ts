import {
  type Food,
  type Nutrient,
  inferNutrientFamily,
} from "@/lib/viz1-cosmos-model"
import { asRows, isTrueLike, toNumber, toText } from "@/lib/utils"

type CosmosModel = {
  nutrients: Nutrient[]
  selectedId: string | null
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function slugify(value: string) {
  return normalizeKey(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function makeShortName(name: string) {
  const compact = name
    .replace(/\(.*?\)/g, "")
    .trim()

  if (compact.length <= 8) return compact

  const words = compact.split(/\s+/).filter(Boolean)
  if (words.length === 1) return compact.slice(0, 8)

  const initials = words
    .map((word) => word[0])
    .join("")
    .slice(0, 4)

  return initials || compact.slice(0, 8)
}

function resolveMetadata(name: string) {
  return {
    id: slugify(name) || "unknown-nutrient",
    name,
    shortName: makeShortName(name),
    family: inferNutrientFamily(name),
  }
}

function detectStrength(row: Record<string, unknown>) {
  const direct =
    toNumber(row.strength) ??
    toNumber(row.weight) ??
    toNumber(row.score) ??
    toNumber(row.normalized_strength) ??
    toNumber(row.relationship_strength)

  if (direct !== null) {
    if (direct > 1) return Math.min(direct / 100, 1)
    return Math.max(0, Math.min(direct, 1))
  }

  const counts =
    toNumber(row.food_count) ??
    toNumber(row.support_count) ??
    toNumber(row.count) ??
    toNumber(row.shared_food_count)

  if (counts !== null) {
    return Math.max(0.15, Math.min(counts / 25, 1))
  }

  return 0.45
}
export function toFood(row: Record<string, unknown>): Food | null {
  const name = toText(row.food_name ?? row.name ?? row.food);
  
  if (!name) return null;

  // Map each specific metric safely
  const rawValue = toNumber(row.food_value_per_100g ?? row.target_food_value_per_100g ?? row.value);
  const pctDrv = toNumber(row.pct_drv_per_100g ?? row.target_pct_drv_per_100g);
  const score = toNumber(row.tradeoff_score ?? row.score);
  
  // Optional: If you strictly require at least one numeric value to render the food
  if (rawValue === null && pctDrv === null && score === null) return null;

  return {
    id: slugify(name),
    name,
    rawValue: rawValue ?? 0,
    unit: toText(row.unit) ?? "",
    pctDrv: pctDrv ?? 0,
    score: score ?? 0,
  };
}

function resolveSelectedName(foodAnchorRows: Record<string, unknown>[], fallbackName?: string) {
  if (fallbackName) return fallbackName

  for (const row of foodAnchorRows) {
    if (!isTrueLike(row.is_selected)) continue
    const selected =
      toText(row.selected_nutrient) ??
      toText(row.anchor_nutrient) ??
      toText(row.selected_nutrient_name) ??
      toText(row.nutrient_name)
    if (selected) return selected
  }

  return null
}

export function buildViz1CosmosModel({
  edges,
  degree,
  foodAnchors,
  selectedNutrientName,
}: {
  edges: unknown
  degree: unknown
  foodAnchors: unknown
  selectedNutrientName?: string
}): CosmosModel {
  const edgeRows = asRows(edges)
  const degreeRows = asRows(degree)
  const foodAnchorRows = asRows(foodAnchors)
  const nutrientMap = new Map<string, Nutrient>()

  const ensureNutrient = (name: string) => {
    const key = normalizeKey(name)
    const current = nutrientMap.get(key)
    if (current) return current

    const metadata = resolveMetadata(name)
    const nutrient: Nutrient = {
      id: metadata.id,
      name: metadata.name,
      shortName: metadata.shortName,
      family: metadata.family,
      links: [],
      foods: [],
    }
    nutrientMap.set(key, nutrient)
    return nutrient
  }

  for (const row of degreeRows) {
    const name = toText(
      row.nutrient_name ?? row.selected_nutrient ?? row.nutrient ?? row.name ?? row.node
    )
    if (name) ensureNutrient(name)
  }

  for (const row of edgeRows) {
    const sourceName = toText(
      row.source_nutrient ?? row.source ?? row.from_nutrient ?? row.from ?? row.nutrient_a
    )
    const targetName = toText(
      row.target_nutrient ?? row.target ?? row.to_nutrient ?? row.to ?? row.nutrient_b
    )

    if (!sourceName || !targetName) continue

    const source = ensureNutrient(sourceName)
    const target = ensureNutrient(targetName)

    source.links.push({
      targetId: target.id,
      strength: detectStrength(row),
      foods: [],
    })
  }

  const selectedName = resolveSelectedName(foodAnchorRows, selectedNutrientName)
  const selectedKey = selectedName ? normalizeKey(selectedName) : null

  if (selectedKey && nutrientMap.has(selectedKey)) {
    const foodsByNutrient = new Map<string, Food[]>()

    for (const row of foodAnchorRows) {
      const nutrientName = toText(row.nutrient_name)
      if (!nutrientName) continue
      const food = toFood(row)
      if (!food) continue

      const key = normalizeKey(nutrientName)
      const foods = foodsByNutrient.get(key) ?? []
      foods.push(food)
      foodsByNutrient.set(key, foods)
    }

    const selectedNutrient = nutrientMap.get(selectedKey)
    if (selectedNutrient) {
      selectedNutrient.foods = foodsByNutrient.get(selectedKey) ?? []
      selectedNutrient.links = selectedNutrient.links.map((link) => {
        const target = [...nutrientMap.values()].find((nutrient) => nutrient.id === link.targetId)
        if (!target) return link
        return {
          ...link,
          foods: foodsByNutrient.get(normalizeKey(target.name)) ?? [],
        }
      })
    }
  }

  const nutrients = [...nutrientMap.values()].sort((a, b) => a.name.localeCompare(b.name))
  const selectedId =
    selectedKey && nutrientMap.has(selectedKey)
      ? nutrientMap.get(selectedKey)?.id ?? null
      : nutrients[0]?.id ?? null

  return { nutrients, selectedId }
}
