export type LlmRecord = {
  id: number
  name: string
  provider: string
  defaultModel: string
  apiKey: string
  baseUrl: string
}

export type LlmModelOption = {
  id: number
  llmId: number
  modelName: string
  priority: number
  recoverTime: string
  lastError: string
  lastCheckedTime: string
  successCount: number
  failCount: number
  isAvailable: boolean
}

export type RemoteModelOption = {
  modelName: string
}

export type LlmFormState = {
  name: string
  provider: string
  defaultModel: string
  apiKey: string
  baseUrl: string
}

export const EMPTY_LLM_FORM: LlmFormState = {
  name: "",
  provider: "openai",
  defaultModel: "gpt-4o",
  apiKey: "",
  baseUrl: "",
}

export function llmRecordToForm(llm: LlmRecord): LlmFormState {
  return {
    name: llm.name || "",
    provider: llm.provider || "openai",
    defaultModel: llm.defaultModel || "gpt-4o",
    apiKey: llm.apiKey || "",
    baseUrl: llm.baseUrl || "",
  }
}

export function llmFormToPayload(form: LlmFormState) {
  return {
    name: form.name,
    provider: form.provider,
    defaultModel: form.defaultModel,
    apiKey: form.apiKey,
    baseUrl: form.baseUrl,
  }
}

export function nextModelOptionPriority(options: LlmModelOption[]) {
  return (
    options.reduce(
      (max, option) => Math.max(max, Number(option.priority) || 0),
      -10,
    ) + 10
  )
}
