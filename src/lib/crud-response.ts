export function normalizeCrudListResponse<T>(value: unknown): T[] {
  if (!value || typeof value !== "object") return []
  const record = value as Record<string, unknown>
  if (Array.isArray(record.dataSource)) return record.dataSource as T[]
  return []
}
