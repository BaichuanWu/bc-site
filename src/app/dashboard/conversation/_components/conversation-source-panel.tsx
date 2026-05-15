"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import type { ConversationRecord } from "../types"
import {
  getConversationAgentId,
  getConversationSourceLabel,
  getConversationSourceSummary,
  getConversationTaskId,
} from "../utils"

type ConversationSourcePanelProps = {
  conversationId: number
  conversation: ConversationRecord | null
  onOpenTask: (taskId: number) => void
  onOpenAgent: (agentId: number) => void
}

export function ConversationSourcePanel({
  conversationId,
  conversation,
  onOpenTask,
  onOpenAgent,
}: ConversationSourcePanelProps) {
  const taskId = getConversationTaskId(conversation)
  const sourceSummary = getConversationSourceSummary(conversation)
  const agentId = getConversationAgentId(conversation)

  return (
    <div className="space-y-3 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
      <div className="flex items-center justify-between gap-2">
        <span>Conversation #{conversationId}</span>
        <Badge variant="secondary">{getConversationSourceLabel(conversation)}</Badge>
      </div>
      {sourceSummary ? <div className="break-words">{sourceSummary}</div> : null}
      {taskId || agentId ? (
        <div className="flex flex-wrap gap-2">
          {taskId ? (
            <Button size="sm" variant="outline" onClick={() => onOpenTask(taskId)}>
              Open Task
            </Button>
          ) : null}
          {agentId ? (
            <Button size="sm" variant="outline" onClick={() => onOpenAgent(agentId)}>
              Open Agent
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
