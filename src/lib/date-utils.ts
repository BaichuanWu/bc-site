export function formatDateTime(value?: string | number | Date | null, fallback = "-") {
  if (!value) return fallback
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleString()
}

export function formatTime(value?: string | number | Date | null, fallback = "N/A") {
  if (!value) return fallback
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleTimeString()
}
