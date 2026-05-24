"use client"

import type {
  ConversationMessage,
  ConversationRecord,
  ConversationSourceAdapter,
  ConversationSourceAdapterResult,
} from "./types"

function getSourceTypeLabel(sourceTyp?: number) {
  if (!sourceTyp) return "Manual"
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
  resolve: ({ conversation }): ConversationSourceAdapterResult => ({
    label: getSourceTypeLabel(conversation.sourceTyp),
    summary: getSourceSummary(conversation),
    actions: [],
  }),
}

const conversationSourceAdapters = new Map<number, ConversationSourceAdapter>()

export function registerConversationSourceAdapter(adapter: ConversationSourceAdapter) {
  if (adapter.sourceTyp === "default") return
  conversationSourceAdapters.set(adapter.sourceTyp, adapter)
}

export function resolveConversationSourceAdapter(conversation: ConversationRecord) {
  return conversationSourceAdapters.get(Number(conversation.sourceTyp || 0)) || defaultConversationSourceAdapter
}

