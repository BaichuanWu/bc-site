import { formatJsonText, parseJsonText } from "@/lib/json-utils"
import type { JsonObject } from "@/types/json"

export type WorkflowOptionsResponse = {
  defaults?: {
    domain?: number
    status?: number
  }
  templates?: Record<string, Record<string, unknown>>
  meta?: {
    nodeTypes?: Record<string, string>
    edgeTypes?: Record<string, string>
  }
}

export type WorkflowRecord = {
  id: number
  name: string
  version: string
  title: string
  description?: string
  domain: number
  status: number
  definitionJson?: Record<string, unknown>
  uiSchemaJson?: Record<string, unknown>
  publishedTime?: string
  updateTime?: string
}

export type WorkflowPreview = {
  dslVersion?: string
  nodeCount?: number
  edgeCount?: number
  stateFields?: string[]
  nodeKeys?: string[]
  duplicateNodeKeys?: string[]
  invalidEdges?: Record<string, unknown>[]
  warnings?: string[]
  nodes?: Array<Record<string, unknown>>
}

export type AgentRecord = {
  id: number
  name: string
  agentClass: string
  description?: string
  defaultVersion?: {
    id: number
    agentId: number
    version: string
    description?: string
    configJson?: Record<string, unknown>
    isDefault: number
  } | null
}

export type WorkflowAgentOption = {
  id: number
  agentId: number
  defaultVersionId: number
  name: string
  version: string
  agentClass: string
  description?: string
  versionDescription?: string
  configJson?: Record<string, unknown>
}

export type WorkflowFormState = {
  name: string
  version: string
  title: string
  description: string
  domain: string
  status: string
  definitionJson: string
  uiSchemaJson: string
  taskKwargsJson: string
}

export const EMPTY_WORKFLOW_FORM: WorkflowFormState = {
  name: "",
  version: "1.0.0",
  title: "",
  description: "",
  domain: "0",
  status: "0",
  definitionJson: "{}",
  uiSchemaJson: "{}",
  taskKwargsJson: "{}",
}

export function extractTaskKwargs(
  definitionJson?: Record<string, unknown>,
): Record<string, unknown> {
  const runDefaults = definitionJson?.run_defaults
  if (!runDefaults || typeof runDefaults !== "object") return {}
  const kwargs = (runDefaults as Record<string, unknown>).kwargs
  if (!kwargs || typeof kwargs !== "object" || Array.isArray(kwargs)) return {}
  return kwargs as Record<string, unknown>
}

export function extractTaskKwargsTextFromDefinitionJson(
  definitionJsonText: string,
  fallback: string,
) {
  try {
    const parsed = JSON.parse(definitionJsonText) as JsonObject
    return formatJsonText(extractTaskKwargs(parsed), fallback)
  } catch {
    return fallback
  }
}

export function mergeTaskKwargsIntoDefinition(
  definitionJsonText: string,
  taskKwargsJson: string,
): Record<string, unknown> {
  const definitionJson = parseJsonText<Record<string, unknown>>(definitionJsonText, {})
  const runDefaults =
    definitionJson.run_defaults &&
    typeof definitionJson.run_defaults === "object" &&
    !Array.isArray(definitionJson.run_defaults)
      ? { ...(definitionJson.run_defaults as Record<string, unknown>) }
      : {}

  return {
    ...definitionJson,
    run_defaults: {
      ...runDefaults,
      kwargs: parseJsonText<Record<string, unknown>>(taskKwargsJson, {}),
    },
  }
}

export function workflowRecordToForm(
  workflow: WorkflowRecord,
  options: {
  statusOverride?: string
} = {},
): WorkflowFormState {
  const { statusOverride } = options
  return {
    name: workflow.name || "",
    version: workflow.version || "1.0.0",
    title: workflow.title || "",
    description: workflow.description || "",
    domain: String(workflow.domain ?? 0),
    status: statusOverride ?? String(workflow.status ?? 0),
    definitionJson: formatJsonText(workflow.definitionJson ?? {}, "{}"),
    uiSchemaJson: formatJsonText(workflow.uiSchemaJson ?? {}, "{}"),
    taskKwargsJson: formatJsonText(extractTaskKwargs(workflow.definitionJson), "{}"),
  }
}

export function applyWorkflowTemplateToForm(
  form: WorkflowFormState,
  templateKey: string,
  template: Record<string, unknown>,
): WorkflowFormState {
  return {
    ...form,
    name: form.name || templateKey,
    title: form.title || templateKey.replace(/_/g, " "),
    definitionJson: JSON.stringify(template, null, 2),
    taskKwargsJson: formatJsonText(extractTaskKwargs(template), "{}"),
  }
}

export function buildWorkflowAgentOptions(
  agents: AgentRecord[] = [],
  search = "",
): WorkflowAgentOption[] {
  const items = agents
    .filter((agent) => agent.defaultVersion)
    .map((agent) => ({
      id: agent.id,
      agentId: agent.id,
      defaultVersionId: Number(agent.defaultVersion?.id || 0),
      name: agent.name,
      version: String(agent.defaultVersion?.version || ""),
      agentClass: agent.agentClass,
      description: agent.description,
      versionDescription: agent.defaultVersion?.description,
      configJson: agent.defaultVersion?.configJson,
    }))
  const keyword = search.trim().toLowerCase()
  if (!keyword) return items
  return items.filter((agent) =>
    [agent.name, agent.version, agent.agentClass]
      .filter(Boolean)
      .some((part) => String(part).toLowerCase().includes(keyword)),
  )
}
