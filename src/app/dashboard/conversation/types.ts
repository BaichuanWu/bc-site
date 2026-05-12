export type ConversationMessage = {
  id: number
  conversationId: number
  role: string
  content: unknown
  llmConfig?: {
    // api-casing-ignore-next-line: Conversation llmConfig is an opaque provider payload.
    llm_id?: number
    model?: string
    // api-casing-ignore-next-line: Backward-compatible provider metadata key.
    model_name?: string
  }
  createTime?: string | null
}

export type MessagesResponse = {
  items?: ConversationMessage[]
}

export type ConversationSendResponse = {
  conversationId: number
  message: ConversationMessage
}

export type ConversationRecord = {
  id: number
  title: string
  llmConfig?: {
    // api-casing-ignore-next-line: Conversation llmConfig is an opaque provider payload.
    llm_id?: number
    model?: string
    temperature?: number
  }
  systemPrompt?: string
  createTime?: string
}

export type LlmModelOption = {
  id: number
  modelName?: string
  // api-casing-ignore-next-line: Accept legacy backend payload during transition.
  model_name?: string
  isAvailable?: boolean
  // api-casing-ignore-next-line: Accept legacy backend payload during transition.
  is_available?: boolean
}

export type LlmModelsResponse = {
  items?: LlmModelOption[]
}

export type ModelOption = {
  id: number
  modelName: string
}
