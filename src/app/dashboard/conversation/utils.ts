import { CONVERSATION_SOURCE } from "@/lib/constants"

import type { ConversationRecord, LlmModelOption, ModelOption } from "./types"

export type ConversationSourceKind = "workflow" | "agent" | "manual"
export type ConversationSourceFilter = ConversationSourceKind | "all"

export function getMessageText(content: unknown): string {
  if (typeof content === "string") return content
  if (content && typeof content === "object" && !Array.isArray(content)) {
    const text = (content as Record<string, unknown>).text
    if (typeof text === "string") return text
  }
  if (content == null) return ""
  return JSON.stringify(content, null, 2)
}

export function normalizeModelOptions(items: LlmModelOption[] = []): ModelOption[] {
  return items
    .map((item) => ({
      id: item.id,
      // api-casing-ignore-next-line: Accept legacy model key while API clients migrate.
      modelName: item.modelName || item.model_name || "",
      // api-casing-ignore-next-line: Accept legacy availability key while API clients migrate.
      isAvailable: item.isAvailable ?? item.is_available ?? false,
    }))
    .filter((item) => item.modelName && item.isAvailable)
    .map(({ id, modelName }) => ({ id, modelName }))
}

export function getConversationSourceKind(
  conversation?: ConversationRecord | null,
): ConversationSourceKind {
  if (conversation?.metaData?.workflowName || conversation?.metaData?.nodeKey) {
    return "workflow"
  }
  if (conversation?.sourceTyp === CONVERSATION_SOURCE.AGENT) return "agent"
  return "manual"
}

export function getConversationSourceLabel(conversation?: ConversationRecord | null): string {
  if (!conversation) return "No source"
  const sourceKind = getConversationSourceKind(conversation)
  if (sourceKind === "workflow") return "Workflow node"
  if (sourceKind === "agent") return "Agent"
  return "Conversation"
}

export function getConversationSourceSummary(conversation?: ConversationRecord | null): string {
  if (!conversation) return ""
  const meta = conversation.metaData || {}
  const sourceKind = getConversationSourceKind(conversation)
  const parts = [
    typeof meta.workflowName === "string" && meta.workflowName ? meta.workflowName : null,
    typeof meta.nodeKey === "string" && meta.nodeKey ? meta.nodeKey : null,
    sourceKind === "agent" && conversation.sourceId ? `Agent #${conversation.sourceId}` : null,
  ].filter(Boolean)
  return parts.join(" · ")
}

export function getConversationAgentId(conversation?: ConversationRecord | null): number | null {
  if (!conversation) return null
  if (conversation.metaData?.workflowName || conversation.metaData?.nodeKey) {
    const rawId = conversation.metaData.agentId
    if (typeof rawId === "number" && Number.isInteger(rawId) && rawId > 0) return rawId
    if (typeof rawId === "string" && /^\d+$/.test(rawId)) return Number(rawId)
    return null
  }
  return conversation?.sourceTyp === CONVERSATION_SOURCE.AGENT && conversation.sourceId
    ? conversation.sourceId
    : null
}

export function getConversationTaskId(conversation?: ConversationRecord | null): number | null {
  const rawId = conversation?.metaData?.taskId
  if (typeof rawId === "number" && Number.isInteger(rawId) && rawId > 0) return rawId
  if (typeof rawId === "string" && /^\d+$/.test(rawId)) return Number(rawId)
  return null
}
