"use client"

import type {
  ConversationMessage,
  ConversationRecord,
  ConversationSourceAdapter,
  ConversationSourceAdapterResult,
} from "./types"

const AGENT_SOURCE_TYP = 10
const AGENT_EXECUTION_SOURCE_TYP = 20

function getRecordValue(record: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined
}

function readString(record: Record<string, unknown>, key: string) {
  const value = getRecordValue(record, key)
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function readPositiveNumber(record: Record<string, unknown>, key: string) {
  const value = getRecordValue(record, key)
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value
  return null
}

function getSourceTypeLabel(sourceTyp?: number) {
  if (!sourceTyp) return "Manual"
  if (sourceTyp === AGENT_SOURCE_TYP) return "Agent"
  if (sourceTyp === AGENT_EXECUTION_SOURCE_TYP) return "Agent execution"
  return `Source ${sourceTyp}`
}

function getSourceSummary(conversation: ConversationRecord) {
  if (!conversation.sourceTyp) return "Conversation created directly in the dashboard."
  const sourceId = conversation.sourceId ? `#${conversation.sourceId}` : "unbound"
  return `${getSourceTypeLabel(conversation.sourceTyp)} ${sourceId}`
}

export function getLastResultMessage(messages: ConversationMessage[]) {
  return (
    [...messages]
      .reverse()
      .find((message) => message.role === "assistant" || message.role === "result") || null
  )
}

const defaultConversationSourceAdapter: ConversationSourceAdapter = {
  sourceTyp: "default",
  resolve: ({ conversation }): ConversationSourceAdapterResult => {
    return {
      label: getSourceTypeLabel(conversation.sourceTyp),
      summary: getSourceSummary(conversation),
      actions: [],
    }
  },
}

const agentConversationSourceAdapter: ConversationSourceAdapter = {
  sourceTyp: AGENT_SOURCE_TYP,
  resolve: ({ conversation }): ConversationSourceAdapterResult => {
    const metadata = conversation.metaData || {}
    const taskId = readPositiveNumber(metadata, "taskId")
    const workflowName = readString(metadata, "workflowName")
    const nodeKey = readString(metadata, "nodeKey")
    const agentClass = readString(metadata, "agentClass")
    const agentVersionId = readPositiveNumber(metadata, "agentVersionId")
    const agentId = conversation.sourceId && conversation.sourceId > 0 ? conversation.sourceId : null

    const summaryParts = [
      agentClass,
      workflowName && nodeKey ? `${workflowName} / ${nodeKey}` : workflowName || nodeKey,
      agentVersionId ? `version #${agentVersionId}` : null,
    ].filter(Boolean)

    return {
      label: "Agent",
      summary: summaryParts.length > 0 ? summaryParts.join(" · ") : getSourceSummary(conversation),
      actions: [
        ...(agentId
          ? [
              {
                id: "open-agent",
                kind: "openSource" as const,
                label: "Open agent",
                href: `/dashboard/agent/${agentId}`,
              },
            ]
          : []),
        ...(taskId
          ? [
              {
                id: "open-task",
                kind: "openSource" as const,
                label: "Open workflow task",
                href: `/dashboard/sys-task/${taskId}`,
              },
            ]
          : []),
      ],
    }
  },
}

const agentExecutionConversationSourceAdapter: ConversationSourceAdapter = {
  sourceTyp: AGENT_EXECUTION_SOURCE_TYP,
  resolve: ({ conversation }): ConversationSourceAdapterResult => {
    const executionId = conversation.sourceId && conversation.sourceId > 0 ? conversation.sourceId : null
    return {
      label: "Agent execution",
      summary: executionId ? `Agent execution #${executionId}` : getSourceSummary(conversation),
      actions: executionId
        ? [
            {
              id: "open-agent-execution",
              kind: "openSource" as const,
              label: "Open execution",
              href: `/dashboard/agent-execution/${executionId}`,
            },
          ]
        : [],
    }
  },
}

const conversationSourceAdapters = new Map<number, ConversationSourceAdapter>([
  [AGENT_SOURCE_TYP, agentConversationSourceAdapter],
  [AGENT_EXECUTION_SOURCE_TYP, agentExecutionConversationSourceAdapter],
])

export function resolveConversationSourceAdapter(conversation: ConversationRecord) {
  return conversationSourceAdapters.get(Number(conversation.sourceTyp || 0)) || defaultConversationSourceAdapter
}
