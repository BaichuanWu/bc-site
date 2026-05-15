import type { TaskEventRecord, WorkflowNodeEventData } from "@/types/task"
import { isRecord } from "@/lib/json-utils"

export { isRecord }

export function getTaskEventData(event: TaskEventRecord): WorkflowNodeEventData | null {
  return isRecord(event.data) ? (event.data as WorkflowNodeEventData) : null
}

export function getTaskEventConversationId(event: TaskEventRecord): number | null {
  const data = getTaskEventData(event)
  const rawId = data?.conversationId ?? data?.conversation_id
  return typeof rawId === "number" && Number.isInteger(rawId) && rawId > 0
    ? rawId
    : null
}

export function getTaskEventArtifactData(
  event: TaskEventRecord,
  isResultEvent: boolean,
): Record<string, unknown> | null {
  if (isResultEvent) return null
  const data = getTaskEventData(event)
  if (!isRecord(data)) return null
  const rest: Record<string, unknown> = { ...data }
  delete rest.input
  delete rest.output
  delete rest.conversation_id
  delete rest.conversationId
  return rest
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
