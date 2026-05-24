export type AgentRecord = {
  id: number
  name: string
  agentClass: string
  description?: string
}

export type AgentVersionRecord = {
  id: number
  agentId: number
  version: string
  description?: string
  configJson?: Record<string, unknown>
  isDefault: number
}

export type AgentOptionsResponse<TSpec = unknown> = {
  agentClasses?: string[]
  configSpecs?: Record<string, TSpec>
}

export type AgentFormState = {
  name: string
  agentClass: string
  description: string
}

export type VersionFormState = {
  version: string
  description: string
  isDefault: boolean
  configJson: Record<string, unknown>
}

export const EMPTY_AGENT_FORM: AgentFormState = {
  name: "",
  agentClass: "DefaultAgentNode",
  description: "",
}

export function agentRecordToForm(agent: AgentRecord): AgentFormState {
  return {
    name: agent.name || "",
    agentClass: agent.agentClass || "DefaultAgentNode",
    description: agent.description || "",
  }
}

export function defaultVersionForm(
  defaults?: Record<string, unknown>,
): VersionFormState {
  return {
    version: "1.0.0",
    description: "",
    isDefault: true,
    configJson: defaults || {},
  }
}

export function versionRecordToForm(
  version: AgentVersionRecord,
  defaults?: Record<string, unknown>,
): VersionFormState {
  return {
    version: version.version || "1.0.0",
    description: version.description || "",
    isDefault: Boolean(version.isDefault),
    configJson: version.configJson || defaults || {},
  }
}

export function agentFormToCreatePayload(form: AgentFormState) {
  return {
    name: form.name,
    agentClass: form.agentClass,
    description: form.description,
  }
}

export function agentFormToUpdatePayload(agent: AgentRecord, form: AgentFormState) {
  return {
    id: agent.id,
    name: agent.name,
    agentClass: agent.agentClass,
    description: form.description,
  }
}

export function versionFormToSavePayload({
  agent,
  form,
  editingVersion,
}: {
  agent: AgentRecord
  form: VersionFormState
  editingVersion?: AgentVersionRecord | null
}) {
  return {
    agentId: agent.id,
    version: form.version,
    description: form.description,
    configJson: form.configJson,
    isDefault: form.isDefault ? 1 : 0,
    id: editingVersion?.id,
  }
}
