"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import useSWR, { useSWRConfig } from "swr"

import { apiClient, fetcher } from "@/lib/api"
import { normalizeCrudListResponse } from "@/lib/crud-response"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"

import type {
  ConversationMessage,
  ConversationRecord,
  ConversationSendResponse,
  LlmModelsResponse,
  MessagesResponse,
} from "./types"
import {
  type ConversationSourceFilter,
  getConversationSourceKind,
  normalizeModelOptions,
} from "./utils"

const CONVERSATION_LIST_LIMIT = 100

export function useConversationController() {
  const { mutate: mutateCache } = useSWRConfig()
  const searchParams = useSearchParams()
  const navigate = useWorkspaceNavigate()

  const [conversationId, setConversationId] = React.useState<number | null>(null)
  const [title, setTitle] = React.useState("New Conversation")
  const [systemPrompt, setSystemPrompt] = React.useState("")
  const [llmId, setLlmId] = React.useState<number | null>(null)
  const [modelName, setModelName] = React.useState("")
  const [temperature, setTemperature] = React.useState("0")
  const [input, setInput] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)
  const [sourceFilter, setSourceFilter] = React.useState<ConversationSourceFilter>("all")
  const [optimisticMessages, setOptimisticMessages] = React.useState<ConversationMessage[]>([])
  const requestedConversationId = Number(searchParams.get("conversationId") || 0) || null

  const { data } = useSWR<MessagesResponse>(
    conversationId ? `/agent/conversation/${conversationId}/messages` : null,
    (url: string) => apiClient.get(url) as Promise<MessagesResponse>,
  )
  const { data: requestedConversation } = useSWR<ConversationRecord>(
    requestedConversationId ? `/agent/conversation/${requestedConversationId}` : null,
    fetcher,
  )
  const { data: conversationResponse, mutate: mutateConversations } = useSWR<unknown>(
    `/agent/conversation?limit=${CONVERSATION_LIST_LIMIT}&order_by=-id`,
    fetcher,
  )
  const { data: llmModelsResponse, isLoading: isLoadingModels } = useSWR<LlmModelsResponse>(
    llmId ? `/agent/llm/${llmId}/models` : null,
    fetcher,
  )

  const messages = React.useMemo(
    () => [...(data?.items || []), ...optimisticMessages],
    [data?.items, optimisticMessages],
  )
  const conversations = React.useMemo(
    () => normalizeCrudListResponse<ConversationRecord>(conversationResponse),
    [conversationResponse],
  )
  const currentConversation = React.useMemo(() => {
    if (!conversationId) return null
    return (
      conversations.find((conversation) => conversation.id === conversationId) ||
      (requestedConversation?.id === conversationId ? requestedConversation : null)
    )
  }, [conversationId, conversations, requestedConversation])
  const filteredConversations = React.useMemo(() => {
    if (sourceFilter === "all") return conversations
    return conversations.filter(
      (conversation) => getConversationSourceKind(conversation) === sourceFilter,
    )
  }, [conversations, sourceFilter])
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
  const modelOptions = React.useMemo(
    () => normalizeModelOptions(llmModelsResponse?.items),
    [llmModelsResponse],
  )

  const hasDraftConfig = Boolean(currentLlmConfig)
  const hasActiveContext = Boolean(conversationId)
  const canSend = Boolean(input.trim() && !isSending && (hasActiveContext || hasDraftConfig))

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

  const openConversationFromList = React.useCallback(
    (conversation: ConversationRecord) => {
      openConversation(conversation)
      navigate(
        "/dashboard/conversation",
        `conversationId=${conversation.id}`,
        { title: `Conversation #${conversation.id}` },
      )
    },
    [navigate, openConversation],
  )

  const startNewConversation = React.useCallback(() => {
    setConversationId(null)
    setTitle("New Conversation")
    setInput("")
    setOptimisticMessages([])
    navigate("/dashboard/conversation", undefined, { title: "Conversation" })
  }, [navigate])

  React.useEffect(() => {
    if (!requestedConversation || requestedConversation.id === conversationId) return
    openConversation(requestedConversation)
  }, [conversationId, openConversation, requestedConversation])

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

  return {
    conversationId,
    currentConversation,
    conversations: filteredConversations,
    sourceFilter,
    title,
    systemPrompt,
    llmId,
    modelName,
    temperature,
    modelOptions,
    messages,
    input,
    canSend,
    isCreating,
    isSending,
    isLoadingModels,
    inputEnabled: hasActiveContext || hasDraftConfig,
    setTitle,
    setSystemPrompt,
    setLlmId,
    setModelName,
    setTemperature,
    setSourceFilter,
    setInput,
    createConversation,
    openConversationFromList,
    startNewConversation,
    sendMessage,
    openTask: (taskId: number) =>
      navigate(`/dashboard/sys-task/${taskId}`, undefined, { title: `Task #${taskId}` }),
    openAgent: (agentId: number) =>
      navigate(`/dashboard/agent/${agentId}`, undefined, { title: `Agent #${agentId}` }),
  }
}
