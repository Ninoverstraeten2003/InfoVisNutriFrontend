import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Row, type RankedItem, RpcCallArgs } from "@/lib/types"

function asRows(value: unknown): Row[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is Row => typeof item === "object" && item !== null)
  }
  return []
}

function asObject(value: unknown): Row | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) return value as Row
  return null
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof value === "number" && Number.isFinite(value)) return `${value}`
  return null
}

function findKeyByCandidates(rows: Row[], candidates: string[], type: "text" | "number"): string | null {
  if (rows.length === 0) return null
  for (const candidate of candidates) {
    if (!(candidate in rows[0])) continue
    const valid = rows.some((row) => {
      const value = row[candidate]
      return type === "number" ? toNumber(value) !== null : toText(value) !== null
    })
    if (valid) return candidate
  }
  return null
}

function findAnyNumericKey(rows: Row[]): string | null {
  if (rows.length === 0) return null
  const keys = Object.keys(rows[0])
  for (const key of keys) {
    if (rows.some((row) => toNumber(row[key]) !== null)) return key
  }
  return null
}

function findAnyTextKey(rows: Row[]): string | null {
  if (rows.length === 0) return null
  const keys = Object.keys(rows[0])
  for (const key of keys) {
    if (rows.some((row) => toText(row[key]) !== null)) return key
  }
  return null
}

function toRankedItems(rows: Row[], labelCandidates: string[], valueCandidates: string[], limit = 12): RankedItem[] {
  const labelKey = findKeyByCandidates(rows, labelCandidates, "text") ?? findAnyTextKey(rows)
  const valueKey =
    findKeyByCandidates(rows, valueCandidates, "number") ??
    findAnyNumericKey(rows.filter((row) => {
      const label = labelKey ? toText(row[labelKey]) : null
      return label !== null
    }))

  if (!labelKey || !valueKey) return []

  return rows
    .map((row) => {
      const label = toText(row[labelKey])
      const value = toNumber(row[valueKey])
      if (!label || value === null) return null
      return { label, value }
    })
    .filter((item): item is RankedItem => item !== null)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

function edgeColor(type: string): string {
  const normalized = type.toLowerCase()
  if (normalized.includes("synerg")) return "oklch(0.66 0.15 155)"
  if (normalized.includes("antagon")) return "oklch(0.64 0.2 25)"
  return "oklch(0.62 0.08 210)"
}

function cleanBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, "")
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function extractStringOptions(value: unknown, preferredKeys: string[] = []) {
  if (!Array.isArray(value)) return []

  const options: string[] = []

  for (const item of value) {
    if (typeof item === "string" && item.trim().length > 0) {
      options.push(item.trim())
      continue
    }

    if (!item || typeof item !== "object") continue

    let candidate: string | null = null
    for (const key of preferredKeys) {
      if (key in item && typeof item[key as keyof typeof item] === "string") {
        const valueFromKey = `${item[key as keyof typeof item]}`.trim()
        if (valueFromKey.length > 0) {
          candidate = valueFromKey
          break
        }
      }
    }

    if (!candidate) {
      const firstString = Object.values(item).find(
        (entry) => typeof entry === "string" && entry.trim().length > 0
      )
      if (typeof firstString === "string") {
        candidate = firstString.trim()
      }
    }

    if (candidate) {
      options.push(candidate)
    }
  }

  return [...new Set(options)]
}

function isTrueLike(value: unknown) {
  if (value === true) return true
  if (typeof value === "number") return value === 1
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "y"
  }
  return false
}

function extractDefaultOption(value: unknown, preferredKeys: string[] = []) {
  if (!Array.isArray(value)) return null

  const defaultFlagKeys = [
    "is_default",
    "default",
    "is_selected",
    "selected",
    "is_current",
    "current",
    "is_preferred",
    "preferred",
  ]

  for (const item of value) {
    if (!item || typeof item !== "object") continue
    const record = item as Record<string, unknown>
    const hasDefaultFlag = defaultFlagKeys.some((flag) => isTrueLike(record[flag]))
    if (!hasDefaultFlag) continue

    for (const key of preferredKeys) {
      const candidate = record[key]
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate.trim()
      }
    }

    const firstString = Object.values(record).find(
      (entry) => typeof entry === "string" && entry.trim().length > 0
    )
    if (typeof firstString === "string") {
      return firstString.trim()
    }
  }

  return null
}

function resolveSelection(current: string, options: string[], apiDefault: string | null) {
  if (current && options.includes(current)) return current
  if (apiDefault && options.includes(apiDefault)) return apiDefault
  return ""
}

function nonEmptyQuery(query: Record<string, string | number>) {
  return Object.keys(query).length > 0 ? query : undefined
}

async function callRpc({
  baseUrl,
  rpcName,
  method,
  query,
  body,
}: RpcCallArgs): Promise<unknown> {
  const normalized = cleanBaseUrl(baseUrl)
  const url = new URL(`${normalized}/rpc/${rpcName}`)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      const normalizedValue = `${value}`.trim()
      if (normalizedValue.length > 0) {
        url.searchParams.set(key, normalizedValue)
      }
    })
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  })

  const rawBody = await response.text()
  const parsedBody = rawBody ? tryParseJson(rawBody) : null

  if (!response.ok) {
    const message =
      typeof parsedBody === "object" &&
      parsedBody !== null &&
      "message" in parsedBody &&
      typeof parsedBody.message === "string"
        ? parsedBody.message
        : `HTTP ${response.status}`
    throw new Error(message)
  }

  return parsedBody
}

export {
  asRows,
  asObject,
  toNumber,
  toText,
  findKeyByCandidates,
  findAnyNumericKey,
  findAnyTextKey,
  toRankedItems,
  edgeColor,
  cleanBaseUrl,
  tryParseJson,
  extractStringOptions,
  isTrueLike,
  extractDefaultOption,
  resolveSelection,
  nonEmptyQuery,
  callRpc,
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
