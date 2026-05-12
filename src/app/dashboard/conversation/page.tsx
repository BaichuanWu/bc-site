"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"
import useSWR, { useSWRConfig } from "swr"

import { PageShell } from "@/components/common/page-shell"
import { Button } from "@/components/ui/button"
import { apiClient, fetcher } from "@/lib/api"
import { normalizeCrudListResponse } from "@/lib/crud-response"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"

import { ConversationSettings } from "./_components/conversation-settings"
import { ConversationThread } from "./_components/conversation-thread"
import type {
  ConversationMessage,
  ConversationRecord,
  ConversationSendResponse,
  LlmModelsResponse,
  MessagesResponse,
} from "./types"
import { normalizeModelOptions } from "./utils"

export default function ConversationPage() {
  useWorkspaceTabTitle("/dashboard/conversation", "Conversation")
  const { mutate: mutateCache } = useSWRConfig()

  const [conversationId, setConversationId] = React.useState<number | null>(null)
  const [title, setTitle] = React.useState("New Conversation")
  const [systemPrompt, setSystemPrompt] = React.useState("")
  const [llmId, setLlmId] = React.useState<number | null>(null)
  const [modelName, setModelName] = React.useState("")
  const [temperature, setTemperature] = React.useState("0")
  const [input, setInput] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)
  const [optimisticMessages, setOptimisticMessages] = React.useState<ConversationMessage[]>([])

  const { data } = useSWR<MessagesResponse>(
    conversationId ? `/agent/conversation/${conversationId}/messages` : null,
    (url: string) => apiClient.get(url) as Promise<MessagesResponse>,
  )
  const messages = React.useMemo(
    () => [...(data?.items || []), ...optimisticMessages],
    [data?.items, optimisticMessages],
  )
  const { data: conversationResponse, mutate: mutateConversations } = useSWR<unknown>(
    "/agent/conversation?limit=30&order_by=-id",
    fetcher,
  )
  const conversations = React.useMemo(
    () => normalizeCrudListResponse<ConversationRecord>(conversationResponse),
    [conversationResponse],
  )
  const currentLlmConfig = React.useMemo(
    () =>
      llmId && modelName
        ? {
            // api-casing-ignore-next-line: Conversation payload still accepts backend llm_config internals.
            llm_id: llmId,
            model: modelName,
            temperature: Number(temperature || 0),
          }
        : null,
    [llmId, modelName, temperature],
  )
  const hasDraftConfig = Boolean(currentLlmConfig)
  const hasActiveContext = Boolean(conversationId)
  const canSend = Boolean(input.trim() && !isSending && (hasActiveContext || hasDraftConfig))

  const { data: llmModelsResponse, isLoading: isLoadingModels } = useSWR<LlmModelsResponse>(
    llmId ? `/agent/llm/${llmId}/models` : null,
    fetcher,
  )
  const modelOptions = React.useMemo(
    () => normalizeModelOptions(llmModelsResponse?.items),
    [llmModelsResponse],
  )

  React.useEffect(() => {
    if (!llmId) {
      setModelName("")
      return
    }
    setModelName((current) => {
      if (current && modelOptions.some((option) => option.modelName === current)) return current
      return modelOptions[0]?.modelName || ""
    })
  }, [llmId, modelOptions])

  const createConversation = React.useCallback(async () => {
    if (!currentLlmConfig) return null
    setIsCreating(true)
    try {
      const res = (await apiClient.post("/agent/conversation/init", {
        title,
        // api-casing-ignore-next-line: Backend request schema currently names this field llm_config.
        llm_config: currentLlmConfig,
        // api-casing-ignore-next-line: Backend request schema currently names this field system_prompt.
        system_prompt: systemPrompt,
        // api-casing-ignore-next-line: Backend request schema currently names this field meta_data.
        meta_data: {},
      })) as { conversationId?: number }
      const nextId = Number(res.conversationId || 0)
      if (nextId > 0) {
        setConversationId(nextId)
        await mutateConversations()
        return nextId
      }
      return null
    } finally {
      setIsCreating(false)
    }
  }, [currentLlmConfig, mutateConversations, systemPrompt, title])

  const openConversation = React.useCallback((conversation: ConversationRecord) => {
    setConversationId(conversation.id)
    setTitle(conversation.title || `Conversation #${conversation.id}`)
    setSystemPrompt(conversation.systemPrompt || "")
    setInput("")
    setOptimisticMessages([])
    const config = conversation.llmConfig || {}
    // api-casing-ignore-next-line: Conversation llmConfig is an opaque provider payload.
    setLlmId(config.llm_id ? Number(config.llm_id) : null)
    setModelName(typeof config.model === "string" ? config.model : "")
    setTemperature(String(config.temperature ?? 0))
  }, [])

  const sendMessage = React.useCallback(async () => {
    const content = input.trim()
    if (!content || isSending) return
    setIsSending(true)
    try {
      const activeConversationId = conversationId || (await createConversation())
      if (!activeConversationId) return
      setInput("")
      const optimisticUserMessage: ConversationMessage = {
        id: -Date.now(),
        conversationId: activeConversationId,
        role: "user",
        content,
        createTime: new Date().toISOString(),
      }
      setOptimisticMessages([optimisticUserMessage])
      const payload: Record<string, unknown> = {
        content,
        history_policy: "full",
        max_history_messages: 40,
        runtime_config: {},
      }
      if (currentLlmConfig) {
        payload.llm_config = currentLlmConfig
      }
      const res = (await apiClient.post(
        `/agent/conversation/${activeConversationId}/send`,
        payload,
      )) as ConversationSendResponse
      if (res.message) {
        setOptimisticMessages([optimisticUserMessage, res.message])
      }
      await mutateCache(`/agent/conversation/${activeConversationId}/messages`)
      setOptimisticMessages([])
    } catch (error) {
      setInput(content)
      setOptimisticMessages([])
      throw error
    } finally {
      setIsSending(false)
    }
  }, [conversationId, createConversation, currentLlmConfig, input, isSending, mutateCache])

  return (
    <PageShell className="h-full overflow-hidden" contentClassName="flex h-full min-h-0 flex-col gap-4 space-y-0 overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Conversation</h1>
          <p className="text-sm text-muted-foreground">Pure LLM chat, independent from agents and workflows.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setConversationId(null)
            setTitle("New Conversation")
            setInput("")
            setOptimisticMessages([])
          }}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          New
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <ConversationSettings
          conversationId={conversationId}
          conversations={conversations}
          title={title}
          systemPrompt={systemPrompt}
          llmId={llmId}
          modelName={modelName}
          temperature={temperature}
          modelOptions={modelOptions}
          isCreating={isCreating}
          isLoadingModels={isLoadingModels}
          onTitleChange={setTitle}
          onSystemPromptChange={setSystemPrompt}
          onLlmChange={setLlmId}
          onModelChange={setModelName}
          onTemperatureChange={setTemperature}
          onCreateConversation={() => {
            void createConversation()
          }}
          onOpenConversation={openConversation}
        />

        <ConversationThread
          messages={messages}
          input={input}
          canSend={canSend}
          isSending={isSending}
          inputEnabled={hasActiveContext || hasDraftConfig}
          onInputChange={setInput}
          onSend={() => {
            void sendMessage()
          }}
        />
      </div>
    </PageShell>
  )
}
