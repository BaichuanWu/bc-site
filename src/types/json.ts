export type JsonPrimitive = string | number | boolean | null

export type JsonValue = JsonPrimitive | JsonObject | JsonArray

export type JsonObject = {
  [key: string]: JsonValue | undefined
}

export type JsonArray = JsonValue[]

export function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

export function isJsonArray(value: unknown): value is JsonArray {
  return Array.isArray(value)
}

export function getJsonObject(value: unknown): JsonObject | undefined {
  return isJsonObject(value) ? value : undefined
}

export function getJsonArray(value: unknown): JsonArray | undefined {
  return isJsonArray(value) ? value : undefined
}

export function getJsonString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}
