import type { TaskEventRecord } from "@/types/task"

export function getProgressPercentFromMessage(message?: string | null): number | undefined {
  if (!message) return undefined

  const match = message.match(/\((\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\)/)
  if (!match) return undefined

  const current = Number.parseFloat(match[1] ?? "")
  const total = Number.parseFloat(match[2] ?? "")
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
    return undefined
  }

  return Math.max(0, Math.min(100, Math.trunc((current / total) * 100)))
}

export function getTaskEventProgressPercent(event: TaskEventRecord): number | undefined {
  if (
    typeof event.current === "number" &&
    Number.isFinite(event.current) &&
    typeof event.total === "number" &&
    Number.isFinite(event.total) &&
    event.total > 0
  ) {
    return Math.max(0, Math.min(100, Math.trunc((event.current / event.total) * 100)))
  }

  return getProgressPercentFromMessage(event.message) ??
    (typeof event.progress === "number" && Number.isFinite(event.progress)
      ? event.progress
      : undefined)
}
