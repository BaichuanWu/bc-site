export function normalizeCrudListResponse<T>(value: unknown): T[] {
  if (!value || typeof value !== "object") return []
  const record = value as Record<string, unknown>
  if (Array.isArray(record.items)) return record.items as T[]
  return []
}
