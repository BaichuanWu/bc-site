"use client"

import * as React from "react"
import useSWR from "swr"

import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { JsonNode } from "@/components/common/json-node"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useMeta } from "@/hooks/use-meta"
import { useAsyncAction } from "@/hooks/use-async-action"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { apiClient, fetcher } from "@/lib/api"
import { normalizeCrudListResponse } from "@/lib/crud-response"
import { formatJsonText, parseJsonText } from "@/lib/json-utils"
import { useWorkspaceTabs } from "@/components/workspace/workspace-tabs-provider"
import { WorkflowEditorShell } from "@/components/workflow/studio/editor-shell"
import type {
  AgentRecord,
  WorkflowAgentOption,
  WorkflowPreview,
} from "@/hooks/use-workflow-studio"
import type { JsonObject } from "@/types/json"

type WorkflowOptionsResponse = {
  defaults?: {
    domain?: number
    status?: number
  }
  templates?: Record<string, Record<string, unknown>>
}

type WorkflowRecord = {
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
}

type WorkflowFormState = {
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

const EMPTY_FORM: WorkflowFormState = {
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

function extractTaskKwargsTextFromDefinitionJson(
  definitionJsonText: string,
  fallback: string,
) {
  try {
    const parsed = JSON.parse(definitionJsonText) as JsonObject
    const runDefaults =
      parsed.run_defaults && typeof parsed.run_defaults === "object"
        ? (parsed.run_defaults as JsonObject)
        : undefined
    const kwargs =
      runDefaults?.kwargs && typeof runDefaults.kwargs === "object"
        ? (runDefaults.kwargs as Record<string, unknown>)
        : {}
    return formatJsonText(kwargs, fallback)
  } catch {
    return fallback
  }
}

function mergeTaskKwargsIntoDefinition(
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

type WorkflowDetailPageProps =
  | {
      mode: "create"
    }
  | {
      mode: "edit"
      workflowId: number
    }

export function WorkflowDetailPage(props: WorkflowDetailPageProps) {
  const navigate = useWorkspaceNavigate()
  const { currentPathname, updateTabMeta, closeTab } = useWorkspaceTabs()
  const { getOptions } = useMeta()
  const isCreate = props.mode === "create"
  const workflowId = props.mode === "edit" ? props.workflowId : null
  const pageKey = isCreate ? "/dashboard/workflow/new" : `/dashboard/workflow/${workflowId}`
  const previewAction = useAsyncAction()
  const saveAction = useAsyncAction()
  const publishAction = useAsyncAction()
  const [selectedTemplate, setSelectedTemplate] = React.useState("")
  const [preview, setPreview] = React.useState<WorkflowPreview | null>(null)
  const [form, setForm] = React.useState<WorkflowFormState>(EMPTY_FORM)
  const [agentSearch, setAgentSearch] = React.useState("")

  const { data: options } = useSWR<WorkflowOptionsResponse>(
    "/workflow-definition/options",
    fetcher,
  )
  const { data: workflowResponse, mutate: mutateWorkflow } = useSWR<unknown>(
    workflowId
      ? `/workflow-definition?q=${encodeURIComponent(JSON.stringify({ id: workflowId }))}&limit=1`
      : null,
    fetcher,
  )
  const { data: agents = [] } = useSWR<AgentRecord[]>(
    "/agent/agent",
    async (url: string) => {
      const response = await fetcher<unknown>(url)
      return normalizeCrudListResponse<AgentRecord>(response)
    },
  )

  const workflow = React.useMemo(
    () => normalizeCrudListResponse<WorkflowRecord>(workflowResponse)[0] || null,
    [workflowResponse],
  )

  React.useEffect(() => {
    const defaults = options?.defaults
    if (!defaults || !isCreate) return
    setForm((prev) => ({
      ...prev,
      domain: String(defaults.domain ?? 0),
      status: String(defaults.status ?? 0),
    }))
  }, [isCreate, options?.defaults])

  React.useEffect(() => {
    if (isCreate) {
      updateTabMeta("/dashboard/workflow/new", { title: "New Workflow" })
      return
    }
    if (!workflow) return
    setForm({
      name: workflow.name || "",
      version: workflow.version || "1.0.0",
      title: workflow.title || "",
      description: workflow.description || "",
      domain: String(workflow.domain ?? 0),
      status: String(workflow.status ?? 0),
      definitionJson: formatJsonText(workflow.definitionJson ?? {}, "{}"),
      uiSchemaJson: formatJsonText(workflow.uiSchemaJson ?? {}, "{}"),
      taskKwargsJson: extractTaskKwargsTextFromDefinitionJson(
        formatJsonText(workflow.definitionJson ?? {}, "{}"),
        "{}",
      ),
    })
    updateTabMeta(`/dashboard/workflow/${workflow.id}`, {
      title: `Workflow: ${workflow.name || `#${workflow.id}`}`,
    })
  }, [isCreate, updateTabMeta, workflow])

  const filteredAgents = React.useMemo<WorkflowAgentOption[]>(() => {
    const availableAgents = agents
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
    const keyword = agentSearch.trim().toLowerCase()
    if (!keyword) return availableAgents
    return availableAgents.filter((agent) =>
      [agent.name, agent.version, agent.agentClass]
        .filter(Boolean)
        .some((part) => String(part).toLowerCase().includes(keyword)),
    )
  }, [agents, agentSearch])

  const handlePreview = React.useCallback(async () => {
    await previewAction.run(
      async () => {
        const definitionJson = mergeTaskKwargsIntoDefinition(
          form.definitionJson,
          form.taskKwargsJson,
        )
        return (await apiClient.post("/workflow-definition/preview", {
          definitionJson: definitionJson,
        })) as WorkflowPreview
      },
      {
        errorMessage: "Failed to preview workflow definition",
        onSuccess: (result) => setPreview(result),
      },
    )
  }, [form.definitionJson, form.taskKwargsJson, previewAction])

  const handleSaveWorkflow = React.useCallback(async () => {
    await saveAction.run(
      async () => {
        const definitionJson = mergeTaskKwargsIntoDefinition(
          form.definitionJson,
          form.taskKwargsJson,
        )
        if (isCreate) {
          return (await apiClient.post("/workflow-definition", {
            name: form.name,
            version: form.version,
            title: form.title,
            description: form.description,
            domain: Number(form.domain),
            status: Number(form.status),
            definitionJson,
            uiSchemaJson: parseJsonText(form.uiSchemaJson, {}),
          })) as WorkflowRecord
        }
        return (await apiClient.put("/workflow-definition", {
          id: workflowId,
          name: form.name,
          version: form.version,
          title: form.title,
          description: form.description,
          domain: Number(form.domain),
          status: Number(form.status),
          definitionJson,
          uiSchemaJson: parseJsonText(form.uiSchemaJson, {}),
        })) as WorkflowRecord
      },
      {
        successMessage: isCreate ? "Workflow created" : "Workflow updated",
        errorMessage: "Failed to save workflow",
        onSuccess: async () => {
          await mutateWorkflow()
          closeTab(currentPathname)
        },
      },
    )
  }, [closeTab, currentPathname, form, isCreate, mutateWorkflow, saveAction, workflowId])

  const handleApplyTemplate = React.useCallback(() => {
    if (!selectedTemplate) return
    const template = options?.templates?.[selectedTemplate]
    if (!template) return
    setForm((prev) => ({
      ...prev,
      name: prev.name || selectedTemplate,
      title: prev.title || selectedTemplate.replace(/_/g, " "),
      definitionJson: JSON.stringify(template, null, 2),
      taskKwargsJson: formatJsonText(
        ((template.run_defaults as JsonObject | undefined)?.kwargs as Record<
          string,
          unknown
        >) || {},
        "{}",
      ),
    }))
  }, [options?.templates, selectedTemplate])

  const handlePublish = React.useCallback(async () => {
    if (!workflowId) return
    await publishAction.run(
      async () => apiClient.post("/workflow-definition/publish", { workflowId: workflowId }),
      {
        successMessage: "Workflow published",
        errorMessage: "Failed to publish workflow",
        onSuccess: async () => {
          await mutateWorkflow()
        },
      },
    )
  }, [mutateWorkflow, publishAction, workflowId])

  const domainOptions = getOptions("WorkflowDefinition", "DOMAIN_NAME_MAPPING").map((option) => ({
    label: String(option.label),
    value: String(option.value),
  }))
  const statusOptions = getOptions("WorkflowDefinition", "STATUS_NAME_MAPPING").map((option) => ({
    label: String(option.label),
    value: String(option.value),
  }))

  if (!isCreate && workflowId && !workflow) {
    return (
      <DetailPageLayout
        title="Workflow"
        subtitle="Loading workflow detail..."
      >
        <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
          Loading workflow detail...
        </div>
      </DetailPageLayout>
    )
  }

  return (
    <DetailPageLayout
      title={isCreate ? "New Workflow" : workflow?.title || workflow?.name || "Workflow"}
      subtitle="Workflow definition fields are edited here. The graph field uses the fullscreen canvas editor."
      badge={
        !isCreate && workflow ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={publishAction.isLoading || Number(workflow.status) === 10}
            onClick={handlePublish}
          >
            Publish
          </Button>
        ) : undefined
      }
      actions={
        <>
          <Button onClick={handleSaveWorkflow} disabled={saveAction.isLoading}>
            {saveAction.isLoading ? "Saving..." : "Save Workflow"}
          </Button>
        </>
      }
    >
      <section className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 rounded-2xl border bg-muted/10 p-4 lg:grid-cols-2 xl:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="version">Version</Label>
            <Input id="version" value={form.version} onChange={(e) => setForm((prev) => ({ ...prev, version: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="domain">Domain</Label>
            <Select value={form.domain} onValueChange={(value) => setForm((prev) => ({ ...prev, domain: value }))}>
              <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
              <SelectContent>
                {domainOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 lg:col-span-2">
            <Label htmlFor="template">Template</Label>
            <div className="flex gap-2">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger><SelectValue placeholder="Choose template" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(options?.templates || {}).map((templateKey) => (
                    <SelectItem key={templateKey} value={templateKey}>{templateKey}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={handleApplyTemplate} disabled={!selectedTemplate}>
                Apply
              </Button>
            </div>
          </div>
          <div className="grid gap-2 xl:col-span-4">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="min-h-[88px]"
            />
          </div>
          <div className="grid gap-2 xl:col-span-4">
            <Label htmlFor="taskKwargsJson">Task kwargs JSON Example</Label>
            <Textarea
              id="taskKwargsJson"
              value={form.taskKwargsJson}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  taskKwargsJson: e.target.value,
                }))
              }
              className="min-h-[180px] font-mono text-xs"
            />
          </div>
        </div>

        <WorkflowEditorShell
          pageKey={pageKey}
          definitionJson={form.definitionJson}
          uiSchemaJson={form.uiSchemaJson}
          availableAgents={filteredAgents}
          agentSearch={agentSearch}
          onAgentSearchChange={setAgentSearch}
          isLoadingAgents={false}
          onEditAgentVersion={(agent, nodeKey) => {
            void nodeKey
            navigate(
              `/dashboard/agent/${agent.agentId}`,
              `versionId=${agent.defaultVersionId}`,
            )
          }}
          preview={preview}
          onPreview={handlePreview}
          onChange={({ definitionJson, uiSchemaJson }) =>
            setForm((prev) => ({ ...prev, definitionJson, uiSchemaJson }))
          }
        />

        <details className="rounded-xl border bg-muted/10 p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Advanced JSON
          </summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="definitionJsonRaw">Definition JSON DSL</Label>
              <Textarea
                id="definitionJsonRaw"
                value={form.definitionJson}
                onChange={(e) =>
                  setForm((prev) => {
                    const nextDefinitionJson = e.target.value
                    return {
                      ...prev,
                      definitionJson: nextDefinitionJson,
                      taskKwargsJson: extractTaskKwargsTextFromDefinitionJson(
                        nextDefinitionJson,
                        prev.taskKwargsJson,
                      ),
                    }
                  })
                }
                className="min-h-[260px] font-mono text-xs"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="uiSchemaJson">UI Schema JSON</Label>
              <Textarea
                id="uiSchemaJson"
                value={form.uiSchemaJson}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, uiSchemaJson: e.target.value }))
                }
                className="min-h-[260px] font-mono text-xs"
              />
            </div>
          </div>
        </details>

        {preview ? (
          <div className="rounded-xl border bg-muted/10 p-4">
            <div className="mb-3 text-sm font-semibold">Compile Preview</div>
            <JsonNode data={preview} depth={0} />
          </div>
        ) : null}
      </section>
    </DetailPageLayout>
  )
}
