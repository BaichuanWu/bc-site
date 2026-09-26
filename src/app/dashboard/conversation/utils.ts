import type { LlmModelOption, ModelOption } from "./types"

export function getMessageText(content: unknown): string {
  if (typeof content === "string") return content
  if (content && typeof content === "object" && !Array.isArray(content)) {
    const text = (content as Record<string, unknown>).text
    if (typeof text === "string") return text
  }
  if (content == null) return ""
  return JSON.stringify(content, null, 2)
}

export function normalizeModelOptions(items: LlmModelOption[] = []): ModelOption[] {
  return items
    .map((item) => ({
      id: item.id,
      // api-casing-ignore-next-line: Accept legacy model key while API clients migrate.
      modelName: item.modelName || item.model_name || "",
      // api-casing-ignore-next-line: Accept legacy availability key while API clients migrate.
      isAvailable: item.isAvailable ?? item.is_available ?? false,
    }))
    .filter((item) => item.modelName && item.isAvailable)
    .map(({ id, modelName }) => ({ id, modelName }))
}
