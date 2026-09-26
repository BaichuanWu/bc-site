"use client"

import { useParams } from "next/navigation"

import { ConversationDetail } from "../_components/conversation-detail"

export default function ConversationDetailPage() {
  const params = useParams<{ conversationId: string }>()
  const conversationId = Number(params.conversationId)

  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    return <ConversationDetail conversationId={0} />
  }

  return <ConversationDetail conversationId={conversationId} />
}

