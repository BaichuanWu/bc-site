"use client"

import * as React from "react"
import useSWR, { useSWRConfig } from "swr"
import { Loader2Icon, MessageSquareIcon } from "lucide-react"

import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { JsonNode } from "@/components/common/json-node"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient, fetcher } from "@/lib/api"
import { normalizeCrudListResponse } from "@/lib/crud-response"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"

import {
  getLastResultMessage,
  resolveConversationSourceAdapter,
} from "../source-adapters"
import type {
  ConversationMessage,
  ConversationRecord,
  ConversationSendResponse,
  MessagesResponse,
} from "../types"
import { ConversationSourceSummary } from "./conversation-source-summary"
import { ConversationThread } from "./conversation-thread"

function getConversationTitle(conversationId: number, conversation?: ConversationRecord | null) {
  return conversation?.title || `Conversation #${conversationId}`
}

function getConversationModel(conversation?: ConversationRecord | null) {
  const config = conversation?.llmConfig || {}
  return typeof config.model === "string" ? config.model : null
}

export function ConversationDetail({ conversationId }: { conversationId: number }) {
  const { mutate: mutateCache } = useSWRConfig()
  const [input, setInput] = React.useState("")
  const [isSending, setIsSending] = React.useState(false)
  const [optimisticMessages, setOptimisticMessages] = React.useState<ConversationMessage[]>([])

  const conversationQuery = React.useMemo(
    () => encodeURIComponent(JSON.stringify({ id: conversationId })),
    [conversationId],
  )
  const { data: conversationResponse, isLoading: isLoadingConversation } = useSWR<unknown>(
    conversationId > 0 ? `/agent/conversation?q=${conversationQuery}&limit=1` : null,
    fetcher,
  )
  const { data: messagesResponse, isLoading: isLoadingMessages } = useSWR<MessagesResponse>(
    conversationId > 0 ? `/agent/conversation/${conversationId}/messages` : null,
    (url: string) => apiClient.get(url) as Promise<MessagesResponse>,
  )

  const conversation = React.useMemo(
    () => normalizeCrudListResponse<ConversationRecord>(conversationResponse)[0] || null,
    [conversationResponse],
  )
  const messages = React.useMemo(
    () => [...(messagesResponse?.items || []), ...optimisticMessages],
    [messagesResponse?.items, optimisticMessages],
  )
  const lastResultMessage = React.useMemo(() => getLastResultMessage(messages), [messages])
  const source = React.useMemo(() => {
    if (!conversation) {
      return {
        label: "Source",
        actions: [],
      }
    }
    return resolveConversationSourceAdapter(conversation).resolve({
      conversation,
      messages,
      lastResultMessage,
    })
  }, [conversation, lastResultMessage, messages])
  const title = getConversationTitle(conversationId, conversation)
  const modelName = getConversationModel(conversation)
  const canSend = Boolean(input.trim() && !isSending && conversation)

  useWorkspaceTabTitle(`/dashboard/conversation/${conversationId}`, `Conversation: ${title}`)

  const sendMessage = React.useCallback(async () => {
    const content = input.trim()
    if (!content || !conversation || isSending) return

    setIsSending(true)
    try {
      setInput("")
      const optimisticUserMessage: ConversationMessage = {
        id: -Date.now(),
        conversationId,
        role: "user",
        content,
        createTime: new Date().toISOString(),
      }
      setOptimisticMessages([optimisticUserMessage])
      const payload: Record<string, unknown> = {
        content,
        historyPolicy: "full",
        maxHistoryMessages: 40,
        runtimeConfig: {},
      }
      if (conversation.llmConfig) {
        payload.llmConfig = conversation.llmConfig
      }
      const res = (await apiClient.post(
        `/agent/conversation/${conversationId}/send`,
        payload,
      )) as ConversationSendResponse
      if (res.message) {
        setOptimisticMessages([optimisticUserMessage, res.message])
      }
      await mutateCache(`/agent/conversation/${conversationId}/messages`)
      setOptimisticMessages([])
    } catch (error) {
      setInput(content)
      setOptimisticMessages([])
      throw error
    } finally {
      setIsSending(false)
    }
  }, [conversation, conversationId, input, isSending, mutateCache])

  if (isLoadingConversation || isLoadingMessages) {
    return (
      <DetailPageLayout title="Conversation" subtitle="Loading conversation detail...">
        <div className="flex h-[360px] items-center justify-center rounded-lg border bg-muted/20">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DetailPageLayout>
    )
  }

  if (!conversation) {
    return (
      <DetailPageLayout title="Conversation" subtitle={`Conversation #${conversationId} was not found.`}>
        <div className="flex h-[360px] flex-col items-center justify-center gap-3 rounded-lg border bg-muted/20 text-muted-foreground">
          <MessageSquareIcon className="h-8 w-8" />
          <div className="text-sm">Conversation not found.</div>
        </div>
      </DetailPageLayout>
    )
  }

  return (
    <DetailPageLayout
      title={title}
      subtitle={
        <span>
          Conversation #{conversation.id}
          {modelName ? ` · ${modelName}` : ""}
        </span>
      }
      badge={<Badge variant="outline">Conversation</Badge>}
      side={
        <>
          <ConversationSourceSummary
            source={source}
            sourceTyp={conversation.sourceTyp}
            sourceId={conversation.sourceId}
          />

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">LLM Config</CardTitle>
            </CardHeader>
            <CardContent>
              <JsonNode data={conversation.llmConfig || {}} depth={0} />
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <JsonNode data={conversation.metaData || {}} depth={0} />
            </CardContent>
          </Card>

          {conversation.systemPrompt ? (
            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">System Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted/40 p-3 text-xs leading-5">
                  {conversation.systemPrompt}
                </pre>
              </CardContent>
            </Card>
          ) : null}
        </>
      }
      className="h-full"
    >
      <div className="h-[calc(100vh-210px)] min-h-[520px]">
        <ConversationThread
          messages={messages}
          input={input}
          canSend={canSend}
          isSending={isSending}
          inputEnabled={Boolean(conversation)}
          onInputChange={setInput}
          onSend={() => {
            void sendMessage()
          }}
        />
      </div>
    </DetailPageLayout>
  )
}
