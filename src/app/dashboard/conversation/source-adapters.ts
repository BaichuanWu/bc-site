"use client"

import type {
  ConversationMessage,
  ConversationRecord,
  ConversationSourceAdapter,
  ConversationSourceAdapterResult,
} from "./types"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

const AGENT_SOURCE_TYP = 10
const ALPHA_ENHANCEMENT_TITLE_PREFIX = "Alpha enhancement #"

function readAlphaEnhancementSourceAlphaId(conversation: ConversationRecord) {
  if (!conversation.title?.startsWith(ALPHA_ENHANCEMENT_TITLE_PREFIX)) return null
  const raw = conversation.title.slice(ALPHA_ENHANCEMENT_TITLE_PREFIX.length).trim()
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

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
    const enhancementSourceAlphaId = readAlphaEnhancementSourceAlphaId(conversation)
    if (enhancementSourceAlphaId) {
      return {
        label: "Alpha Enhancement Agent",
        summary: `Interactive enhancement conversation for alpha #${enhancementSourceAlphaId}.`,
        actions: [
          ...(conversation.sourceId
            ? [
                {
                  id: "open-agent",
                  kind: "openSource" as const,
                  label: "Open agent",
                  href: `/dashboard/agent/${conversation.sourceId}`,
                },
              ]
            : []),
          {
            id: "store-alpha-children",
            kind: "inspectSource",
            label: "Create related WQB alphas",
            run: async () => {
              try {
                const result = await apiClient.post("/quants/wqb/alpha/store-enhancement-children", {
                  conversationId: conversation.id,
                })
                const storedCount = Array.isArray((result as { storedChildren?: unknown[] }).storedChildren)
                  ? (result as { storedChildren: unknown[] }).storedChildren.length
                  : 0
                toast.success(`Created ${storedCount} related WQB alpha${storedCount === 1 ? "" : "s"}.`)
              } catch (error) {
                const detail = typeof error === "object" && error !== null && "response" in error
                  ? (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
                  : null
                toast.error(typeof detail === "string" ? detail : "Failed to create related WQB alphas.")
              }
            },
          },
          {
            id: "open-related-alpha",
            kind: "openSource",
            label: "Open related alphas",
            href: `/dashboard/wqb/alpha/analysis?lineageOf=${enhancementSourceAlphaId}`,
          },
        ],
      }
    }

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

const conversationSourceAdapters = new Map<number, ConversationSourceAdapter>([
  [AGENT_SOURCE_TYP, agentConversationSourceAdapter],
])

export function resolveConversationSourceAdapter(conversation: ConversationRecord) {
  return conversationSourceAdapters.get(Number(conversation.sourceTyp || 0)) || defaultConversationSourceAdapter
}
