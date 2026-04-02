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
