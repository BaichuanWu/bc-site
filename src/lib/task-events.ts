import { isRecord } from "@/lib/json-utils"

export function extractRelatedTaskIds(result: unknown): number[] {
  if (!isRecord(result)) return []

  const ids: number[] = []
  const seen = new Set<number>()
  const taskIds = result.taskIds

  if (!Array.isArray(taskIds)) return []

  taskIds.forEach((value) => {
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) return
    if (seen.has(value)) return
    seen.add(value)
    ids.push(value)
  })

  return ids
}
