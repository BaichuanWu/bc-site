export function parseJsonText<T>(value: string, fallback: T): T {
  if (!value.trim()) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function formatJsonText(value: unknown, fallback = "{}") {
  if (value == null) return fallback
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return fallback
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

export function getJsonSizeKb(value: unknown): string {
  try {
    return (JSON.stringify(value ?? {}).length / 1024).toFixed(1)
  } catch {
    return "0.0"
  }
}
