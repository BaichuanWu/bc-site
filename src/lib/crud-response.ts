export function normalizeCrudListResponse<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (!value || typeof value !== "object") return []
  const record = value as Record<string, unknown>
  if (Array.isArray(record.dataSource)) return record.dataSource as T[]
  if (Array.isArray(record.data)) return record.data as T[]
  return []
}
