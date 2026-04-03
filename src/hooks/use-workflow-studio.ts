"use client"

import * as React from "react"
import useSWR from "swr"

import { apiClient } from "@/lib/api"
import { formatJsonText, parseJsonText } from "@/lib/json-utils"
import { useAsyncAction } from "@/hooks/use-async-action"
import { useCrud } from "@/hooks/use-crud"
import { useDeleteAction } from "@/hooks/use-delete-action"

type WorkflowOptionsResponse = {
  defaults?: {
    domain?: number
    status?: number
  }
  templates?: Record<string, Record<string, unknown>>
  meta?: {
    node_types?: Record<string, string>
    edge_types?: Record<string, string>
    routers?: string[]
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
  dsl_version?: string
  entry_router?: string
  node_count?: number
  edge_count?: number
  state_fields?: string[]
  node_keys?: string[]
  duplicate_node_keys?: string[]
  invalid_edges?: Record<string, unknown>[]
  warnings?: string[]
  nodes?: Array<Record<string, unknown>>
}

export type AgentRecord = {
  id: number
  agent_id: number
  name: string
  version: string
  agent_class: string
  description?: string
  version_description?: string
  config_json?: Record<string, unknown>
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
}

const EMPTY_FORM: WorkflowFormState = {
  name: "",
  version: "1.0.0",
  title: "",
  description: "",
  domain: "0",
  status: "0",
  definitionJson: "{}",
  uiSchemaJson: "{}",
}

export function useWorkflowStudio() {
  const editorRef = React.useRef<HTMLDivElement | null>(null)
  const [agentSearch, setAgentSearch] = React.useState("")
  const { data: options } = useSWR<WorkflowOptionsResponse>(
    "/workflow-definition/options",
    (url: string) =>
      apiClient.get(url).then((res: unknown) => res as WorkflowOptionsResponse),
  )
  const workflowCrud = useCrud<WorkflowRecord>("/workflow-definition")
  const { data: activeAgents } = useSWR<AgentRecord[]>(
    "/agent/active-versions",
    (url: string) => apiClient.get(url).then((res: unknown) => res as AgentRecord[]),
  )
  const filteredAgents = React.useMemo(() => {
    const items = activeAgents || []
    const keyword = agentSearch.trim().toLowerCase()
    if (!keyword) return items
    return items.filter((agent) =>
      [agent.name, agent.version, agent.agent_class]
        .filter(Boolean)
        .some((part) => String(part).toLowerCase().includes(keyword)),
    )
  }, [activeAgents, agentSearch])
  const previewAction = useAsyncAction()
  const publishAction = useAsyncAction()
  const deleteAction = useDeleteAction()
  const [form, setForm] = React.useState<WorkflowFormState>(EMPTY_FORM)
  const [selectedTemplate, setSelectedTemplate] = React.useState("")
  const [preview, setPreview] = React.useState<WorkflowPreview | null>(null)
  const [versionTarget, setVersionTarget] = React.useState<WorkflowRecord | null>(
    null,
  )
  const [runningWorkflow, setRunningWorkflow] =
    React.useState<WorkflowRecord | null>(null)
  const versionFilters = versionTarget?.name
    ? { name: versionTarget.name }
    : { name: "__no_workflow_selected__" }
  const versionsCrud = useCrud<WorkflowRecord>(
    "/workflow-definition",
    "",
    versionFilters,
    100,
  )

  React.useEffect(() => {
    const defaults = options?.defaults
    if (!defaults) return
    setForm((prev) => ({
      ...prev,
      domain: String(defaults.domain ?? 0),
      status: String(defaults.status ?? 0),
    }))
  }, [options])

  React.useEffect(() => {
    if (!workflowCrud.isDialogOpen) return
    if (workflowCrud.editingItem) {
      const item = workflowCrud.editingItem
      setForm({
        name: item.name || "",
        version: item.version || "1.0.0",
        title: item.title || "",
        description: item.description || "",
        domain: String(item.domain ?? 0),
        status: String(item.status ?? 0),
        definitionJson: formatJsonText(item.definitionJson ?? {}, "{}"),
        uiSchemaJson: formatJsonText(item.uiSchemaJson ?? {}, "{}"),
      })
      return
    }
    setForm((prev) => ({
      ...EMPTY_FORM,
      domain: prev.domain,
      status: prev.status,
    }))
    setPreview(null)
    setSelectedTemplate("")
  }, [workflowCrud.isDialogOpen, workflowCrud.editingItem])

  React.useEffect(() => {
    if (!workflowCrud.isDialogOpen) return
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [workflowCrud.isDialogOpen])

  const handlePreview = React.useCallback(async () => {
    await previewAction.run(
      async () => {
        const definitionJson = parseJsonText(form.definitionJson, {})
        return (await apiClient.post("/workflow-definition/preview", {
          definition_json: definitionJson,
        })) as WorkflowPreview
      },
      {
        errorMessage: "Failed to preview workflow definition",
        onSuccess: (result) => setPreview(result),
      },
    )
  }, [form.definitionJson, previewAction])

  const handleSaveWorkflow = React.useCallback(async () => {
    await workflowCrud.handleSave({
      ...form,
      domain: Number(form.domain),
      status: Number(form.status),
      definitionJson: parseJsonText(form.definitionJson, {}),
      uiSchemaJson: parseJsonText(form.uiSchemaJson, {}),
    } as unknown as Partial<WorkflowRecord>)

    try {
      const definitionJson = parseJsonText(form.definitionJson, {})
      const res = await apiClient.post("/workflow-definition/preview", {
        definition_json: definitionJson,
      })
      setPreview(res as WorkflowPreview)
    } catch {
      // keep save success independent from preview refresh
    }
  }, [form, workflowCrud])

  const handleApplyTemplate = React.useCallback(() => {
    if (!selectedTemplate) return
    const template = options?.templates?.[selectedTemplate]
    if (!template) return
    setForm((prev) => ({
      ...prev,
      name: prev.name || selectedTemplate,
      title: prev.title || selectedTemplate.replace(/_/g, " "),
      definitionJson: JSON.stringify(template, null, 2),
    }))
  }, [options?.templates, selectedTemplate])

  const handlePublishWorkflow = React.useCallback(
    async (workflowId: number) => {
      await publishAction.run(
        async () => {
          await apiClient.post("/workflow-definition/publish", {
            workflow_id: workflowId,
          })
        },
        {
          successMessage: "Workflow published successfully",
          errorMessage: "Failed to publish workflow",
          onSuccess: async () => {
            await workflowCrud.mutate()
          },
        },
      )
    },
    [publishAction, workflowCrud],
  )

  const handleOpenVersions = React.useCallback((workflow: WorkflowRecord) => {
    setVersionTarget(workflow)
  }, [])

  const handleDuplicateAsNewVersion = React.useCallback(
    (workflow: WorkflowRecord) => {
      const bumpVersion = (version: string) => {
        const parts = (version || "1.0.0").split(".")
        const last = Number(parts[parts.length - 1] || "0")
        parts[parts.length - 1] = String(Number.isFinite(last) ? last + 1 : 1)
        return parts.join(".")
      }

      setVersionTarget(null)
      workflowCrud.handleOpenDialog()
      setForm({
        name: workflow.name,
        version: bumpVersion(workflow.version),
        title: workflow.title,
        description: workflow.description || "",
        domain: String(workflow.domain ?? 0),
        status: "0",
        definitionJson: formatJsonText(workflow.definitionJson ?? {}, "{}"),
        uiSchemaJson: formatJsonText(workflow.uiSchemaJson ?? {}, "{}"),
      })
    },
    [workflowCrud],
  )

  const handleOpenRunDialog = React.useCallback((workflow: WorkflowRecord) => {
    setRunningWorkflow(workflow)
  }, [])

  const closeEditor = React.useCallback(() => {
    workflowCrud.handleCloseDialog()
    setPreview(null)
    setSelectedTemplate("")
  }, [workflowCrud])

  return {
    editorRef,
    options,
    workflowCrud,
    agentCrud: {
      data: filteredAgents,
      dataSource: filteredAgents,
      search: agentSearch,
      setSearch: setAgentSearch,
      isLoading: !activeAgents,
      isValidating: false,
    },
    previewAction,
    publishAction,
    deleteAction,
    form,
    setForm,
    selectedTemplate,
    setSelectedTemplate,
    preview,
    setPreview,
    versionTarget,
    setVersionTarget,
    runningWorkflow,
    setRunningWorkflow,
    versionsCrud,
    handlePreview,
    handleSaveWorkflow,
    handleApplyTemplate,
    handlePublishWorkflow,
    handleOpenVersions,
    handleDuplicateAsNewVersion,
    handleOpenRunDialog,
    closeEditor,
  }
}
