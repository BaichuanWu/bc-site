import type { TaskEventData, TaskEventRecord } from "@/types/task"
import { isRecord } from "@/lib/json-utils"

export { isRecord }

export function getTaskEventData(event: TaskEventRecord): TaskEventData | null {
  return isRecord(event.data) ? (event.data as TaskEventData) : null
}

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

function getWorkflowNodeEventKey(event: TaskEventRecord): string | null {
  if (event.type !== "task.updated" && event.type !== "task.checkpoint") return null
  const data = getTaskEventData(event)
  if (!data) return null

  const nodeKey = data.key
  if (typeof nodeKey !== "string" || nodeKey.length === 0) return null

  const kind = typeof data.kind === "string" ? data.kind : "node"
  const status = typeof data.status === "string" ? data.status : "updated"
  return `${kind}:${nodeKey}:${status}`
}

export function collapseWorkflowNodeEvents(events: TaskEventRecord[]): TaskEventRecord[] {
  const collapsed: TaskEventRecord[] = []
  const workflowNodeIndexes = new Map<string, number>()

  for (const event of events) {
    const nodeEventKey = getWorkflowNodeEventKey(event)

    if (nodeEventKey) {
      const existingIndex = workflowNodeIndexes.get(nodeEventKey)
      if (existingIndex !== undefined) {
        collapsed[existingIndex] = event
        continue
      }
      workflowNodeIndexes.set(nodeEventKey, collapsed.length)
    }

    collapsed.push(event)
  }

  return collapsed
}

export function extractRelatedTaskIds(result: unknown, events: TaskEventRecord[]): number[] {
  const ids: number[] = []
  const seen = new Set<number>()

  const pushId = (value: unknown) => {
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) return
    if (seen.has(value)) return
    seen.add(value)
    ids.push(value)
  }

  if (isRecord(result)) {
    const taskIds = result.taskIds
    if (Array.isArray(taskIds)) {
      taskIds.forEach(pushId)
    }
  }

  events.forEach((event) => {
    const workflowTaskId = event.data?.workflowTaskId
    pushId(workflowTaskId)
  })

  return ids
}
