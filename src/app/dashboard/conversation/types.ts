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

export type ConversationMetaData = {
  [key: string]: unknown
}

export type MessagesResponse = {
  items?: ConversationMessage[]
}

export type ConversationSendResponse = {
  conversationId: number
  message?: ConversationMessage
  executionId?: number
  agentResult?: unknown
}

export type AgentExecutionRecord = {
  id: number
  agentId: number
  agentVersionId?: number
  status: number
  statusName: string
  inputJson?: unknown
  outputJson?: unknown
  errorLog?: string
  conversationId?: number | null
  agent?: {
    id: number
    name?: string
    agentClass?: string
  } | null
  version?: {
    id: number
    version?: string
  } | null
}

export type ConversationRecord = {
  id: number
  title: string
  sourceTyp?: number
  sourceId?: number
  llmConfig?: {
    // api-casing-ignore-next-line: Conversation llmConfig is an opaque provider payload.
    llm_id?: number
    model?: string
    temperature?: number
  }
  systemPrompt?: string
  metaData?: ConversationMetaData
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

export type ConversationSourceActionBase = {
  id: string
  label: string
  description?: string
  disabled?: boolean
}

export type ConversationRerunAction = ConversationSourceActionBase & {
  kind: "rerun"
  run: () => void | Promise<void>
}

export type ConversationOpenSourceAction = ConversationSourceActionBase & {
  kind: "openSource"
  href?: string
  run?: () => void | Promise<void>
}

export type ConversationInspectSourceAction = ConversationSourceActionBase & {
  kind: "inspectSource"
  run: () => void | Promise<void>
}

export type ConversationSourceAction =
  | ConversationRerunAction
  | ConversationOpenSourceAction
  | ConversationInspectSourceAction

export type ConversationSourceAdapterContext = {
  conversation: ConversationRecord
  messages: ConversationMessage[]
  lastResultMessage: ConversationMessage | null
}

export type ConversationSourceAdapterResult = {
  label: string
  summary?: string
  actions: ConversationSourceAction[]
}

export type ConversationSourceAdapter = {
  sourceTyp: number | "default"
  resolve: (context: ConversationSourceAdapterContext) => ConversationSourceAdapterResult
}
