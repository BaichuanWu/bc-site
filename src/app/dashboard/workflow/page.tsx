"use client"

import * as React from "react"
import useSWR from "swr"
import { GitBranch, History, Play, Sparkles } from "lucide-react"

import { apiClient } from "@/lib/api"
import { formatJsonText, parseJsonText } from "@/lib/json-utils"
import { useAsyncAction } from "@/hooks/use-async-action"
import { useCrud } from "@/hooks/use-crud"
import { useDeleteAction } from "@/hooks/use-delete-action"
import { useMeta } from "@/hooks/use-meta"
import { CrudLayout } from "@/components/common/crud-layout"
import { ActionButtons } from "@/components/common/action-buttons"
import { type Column } from "@/components/common/data-table"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { JsonNode } from "@/components/common/json-node"
import { WorkflowCanvasEditor } from "@/components/workflow/workflow-canvas-editor"
import { RunWorkflowDialog } from "@/components/workflow/run-workflow-dialog"
import { WorkflowVersionsDialog } from "@/components/workflow/workflow-versions-dialog"
import type { JsonObject } from "@/types/json"

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
    node_kinds?: Record<string, string>
  }
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
  updateTime?: string
}

type WorkflowPreview = {
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

type AgentRecord = {
  id: number
  name: string
  version?: string
  title?: string
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

export default function WorkflowPage() {
  const { getOptions, getLabel } = useMeta()
  const editorRef = React.useRef<HTMLDivElement | null>(null)
  const { data: options } = useSWR<WorkflowOptionsResponse>(
    "/workflow-definition/options",
    (url: string) => apiClient.get(url).then((res: unknown) => res as WorkflowOptionsResponse)
  )
  const workflowCrud = useCrud<WorkflowRecord>("/workflow-definition")
  const agentCrud = useCrud<AgentRecord>("/agent/agent", "name", {}, 50)
  const previewAction = useAsyncAction()
  const publishAction = useAsyncAction()
  const deleteAction = useDeleteAction()
  const [form, setForm] = React.useState<WorkflowFormState>(EMPTY_FORM)
  const [selectedTemplate, setSelectedTemplate] = React.useState("")
  const [preview, setPreview] = React.useState<WorkflowPreview | null>(null)
  const [versionTarget, setVersionTarget] = React.useState<WorkflowRecord | null>(null)
  const [runningWorkflow, setRunningWorkflow] = React.useState<WorkflowRecord | null>(null)
  const versionFilters = versionTarget?.name ? { name: versionTarget.name } : { name: "__no_workflow_selected__" }
  const versionsCrud = useCrud<WorkflowRecord>("/workflow-definition", "", versionFilters, 100)

  const domainOptions = getOptions("WorkflowDefinition", "DOMAIN_NAME_MAPPING").map((option) => ({
    label: String(option.label),
    value: String(option.value),
  }))
  const statusOptions = getOptions("WorkflowDefinition", "STATUS_NAME_MAPPING").map((option) => ({
    label: String(option.label),
    value: String(option.value),
  }))

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
  }, [workflowCrud.isDialogOpen, workflowCrud.editingItem])

  React.useEffect(() => {
    if (!workflowCrud.isDialogOpen) return
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [workflowCrud.isDialogOpen])

  const filterItems: SearchFilterItem[] = React.useMemo(
    () => [
      { key: "name", label: "Name", type: "text" },
      { key: "title", label: "Title", type: "text" },
      {
        key: "domain",
        label: "Domain",
        type: "number",
        options: domainOptions.map(({ label, value }) => ({ label, value: Number(value) })),
      },
      {
        key: "status",
        label: "Status",
        type: "number",
        options: statusOptions.map(({ label, value }) => ({ label, value: Number(value) })),
      },
    ],
    [domainOptions, statusOptions]
  )

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
      }
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
      const res = await apiClient.post("/workflow-definition/preview", { definition_json: definitionJson })
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

  const handlePublishWorkflow = React.useCallback(async (workflowId: number) => {
    await publishAction.run(
      async () => {
        await apiClient.post("/workflow-definition/publish", { workflow_id: workflowId })
      },
      {
        successMessage: "Workflow published successfully",
        errorMessage: "Failed to publish workflow",
        onSuccess: async () => {
          await workflowCrud.mutate()
        },
      }
    )
  }, [publishAction, workflowCrud])

  const handleOpenVersions = React.useCallback((workflow: WorkflowRecord) => {
    setVersionTarget(workflow)
  }, [])

  const handleDuplicateAsNewVersion = React.useCallback((workflow: WorkflowRecord) => {
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
  }, [workflowCrud])

  const handleOpenRunDialog = React.useCallback((workflow: WorkflowRecord) => {
    setRunningWorkflow(workflow)
  }, [])

  const columns: Column<WorkflowRecord>[] = [
    {
      key: "name",
      title: "Workflow",
      render: (value, item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <span className="font-medium">{String(value ?? "-")}</span>
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {item.version}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">{item.title}</div>
        </div>
      ),
    },
    {
      key: "domain",
      title: "Domain",
      render: (value) => <span className="text-sm">{getLabel("WorkflowDefinition", "DOMAIN_NAME_MAPPING", value)}</span>,
    },
    {
      key: "status",
      title: "Status",
      render: (value) => (
        <Badge variant={Number(value) === 10 ? "default" : "secondary"}>
          {getLabel("WorkflowDefinition", "STATUS_NAME_MAPPING", value)}
        </Badge>
      ),
    },
    {
      key: "publishedTime",
      title: "Published",
      render: (value) => (
        <span className="text-xs text-muted-foreground">
          {value ? new Date(String(value)).toLocaleString() : "-"}
        </span>
      ),
    },
    {
      key: "definitionJson",
      title: "Logic",
      render: (value: unknown) => {
        const definitionValue = (value && typeof value === "object" ? value : {}) as JsonObject
        const nodeCount = Array.isArray(definitionValue.nodes) ? definitionValue.nodes.length : 0
        const edgeCount = Array.isArray(definitionValue.edges) ? definitionValue.edges.length : 0
        const entryRouter =
          definitionValue.entry_router && typeof definitionValue.entry_router === "object"
            ? (definitionValue.entry_router as JsonObject).name
            : undefined
        return (
          <div className="space-y-1 text-xs">
            <div>{nodeCount} nodes / {edgeCount} edges</div>
            <div className="text-muted-foreground">
              router: {typeof entryRouter === "string" ? entryRouter : "-"}
            </div>
          </div>
        )
      },
    },
    {
      key: "actions",
      title: "Actions",
      width: 100,
      render: (_value, item) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={Number(item.status) !== 10}
            onClick={() => handleOpenRunDialog(item)}
          >
            <Play className="mr-1 h-3.5 w-3.5" />
            Run
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={publishAction.isLoading || Number(item.status) === 10}
            onClick={() => handlePublishWorkflow(item.id)}
          >
            Publish
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleOpenVersions(item)}
          >
            <History className="mr-1 h-3.5 w-3.5" />
            Versions
          </Button>
          <ActionButtons
            onEdit={() => workflowCrud.handleOpenDialog(item)}
            onConfirmDelete={async () => {
              await deleteAction.remove("/workflow-definition", item.id, {
                successMessage: "Workflow deleted successfully",
                errorMessage: "Failed to delete workflow",
                onSuccess: async () => {
                  await workflowCrud.mutate()
                },
              })
            }}
            description={<>Delete workflow <strong>{item.name}</strong>?</>}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-1 h-6 w-6 text-primary" />
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workflow Studio</h2>
          <p className="text-muted-foreground">
            Manage declarative workflow definitions, state schema, node graph, and compile preview.
          </p>
        </div>
      </div>

      {workflowCrud.isDialogOpen ? (
        <section
          ref={editorRef}
          className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold tracking-tight">
                {workflowCrud.editingItem ? "Edit Workflow Definition" : "Create Workflow Definition"}
              </h3>
              <p className="text-sm text-muted-foreground">
                State schema lives inside the DSL under <code>state_schema</code>. The compiler preview validates nodes, edges, and state fields.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={workflowCrud.handleCloseDialog}>Close Editor</Button>
              {workflowCrud.editingItem ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={publishAction.isLoading}
                  onClick={() => handlePublishWorkflow(workflowCrud.editingItem!.id)}
                >
                  {publishAction.isLoading ? "Publishing..." : "Publish"}
                </Button>
              ) : null}
              <Button
                onClick={handleSaveWorkflow}
                disabled={workflowCrud.isSaving}
              >
                {workflowCrud.isSaving ? "Saving..." : "Save Workflow"}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-4 rounded-2xl border bg-muted/10 p-4 lg:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="version">Version</Label>
                <Input id="version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="domain">Domain</Label>
                <Select value={form.domain} onValueChange={(value) => setForm({ ...form, domain: value })}>
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
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
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
                <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[88px]" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="definitionJson">Definition JSON DSL</Label>
                <WorkflowCanvasEditor
                  definition={parseJsonText(form.definitionJson, {})}
                  uiSchema={parseJsonText(form.uiSchemaJson, {})}
                  availableAgents={agentCrud.data || []}
                  agentSearch={agentCrud.search}
                  onAgentSearchChange={agentCrud.setSearch}
                  isLoadingAgents={agentCrud.isLoading || agentCrud.isValidating}
                  availableRouters={options?.meta?.routers || []}
                  nodeKinds={options?.meta?.node_kinds || {}}
                  preview={preview}
                  onDefinitionChange={(nextDefinition) =>
                    setForm((prev) => ({
                      ...prev,
                      definitionJson: JSON.stringify(nextDefinition, null, 2),
                    }))
                  }
                  onUiSchemaChange={(nextUiSchema) =>
                    setForm((prev) => ({
                      ...prev,
                      uiSchemaJson: JSON.stringify(nextUiSchema, null, 2),
                    }))
                  }
                />
              </div>

              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">Compile Preview</h3>
                  <p className="text-xs text-muted-foreground">
                    Preview validation and graph summary before saving or compiling.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={handlePreview} disabled={previewAction.isLoading}>
                  {previewAction.isLoading ? "Previewing..." : "Preview"}
                </Button>
              </div>

              {preview ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-background p-3">
                      <div className="text-[11px] uppercase text-muted-foreground">Nodes</div>
                      <div className="mt-1 text-lg font-semibold">{preview.node_count ?? 0}</div>
                    </div>
                    <div className="rounded-lg border bg-background p-3">
                      <div className="text-[11px] uppercase text-muted-foreground">Edges</div>
                      <div className="mt-1 text-lg font-semibold">{preview.edge_count ?? 0}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-[11px] uppercase text-muted-foreground">Entry Router</div>
                    <div className="mt-1 text-sm font-medium">{preview.entry_router || "-"}</div>
                  </div>

                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-[11px] uppercase text-muted-foreground">Warnings</div>
                    <div className="mt-2 space-y-2">
                      {(preview.warnings || []).length ? (
                        (preview.warnings || []).map((warning, idx) => (
                          <Badge key={idx} variant="secondary" className="mr-2 mb-2">{warning}</Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No warnings.</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-[11px] uppercase text-muted-foreground">State Fields</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(preview.state_fields || []).map((fieldName) => (
                        <Badge key={fieldName} variant="outline">{fieldName}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-[11px] uppercase text-muted-foreground">Preview JSON</div>
                    <div className="mt-2">
                      <JsonNode data={preview} depth={0} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed bg-background p-6 text-sm text-muted-foreground">
                  Run preview to inspect node graph, state schema fields, and validation warnings.
                </div>
              )}
            </div>
          </div>

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
                    onChange={(e) => setForm({ ...form, definitionJson: e.target.value })}
                    className="min-h-[260px] font-mono text-xs"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="uiSchemaJson">UI Schema JSON</Label>
                  <Textarea
                    id="uiSchemaJson"
                    value={form.uiSchemaJson}
                    onChange={(e) => setForm({ ...form, uiSchemaJson: e.target.value })}
                    className="min-h-[260px] font-mono text-xs"
                  />
                </div>
              </div>
            </details>
          </div>
        </section>
      ) : null}

      {!workflowCrud.isDialogOpen ? (
        <CrudLayout<WorkflowRecord>
          title="Workflow Definitions"
          description="Definition-first workflow registry for viewer, editor, and future compiler execution."
          endpoint="/workflow-definition"
          filterItems={filterItems}
          storageKey="workflow-definition-filters"
          columns={columns}
          addButtonLabel="Create Workflow"
          onAdd={() => workflowCrud.handleOpenDialog()}
        />
      ) : null}

      <RunWorkflowDialog
        open={!!runningWorkflow}
        onOpenChange={(open) => !open && setRunningWorkflow(null)}
        workflowName={runningWorkflow?.name || ""}
        title={runningWorkflow?.title || runningWorkflow?.name || "Workflow"}
        description={
          runningWorkflow
            ? `Execute ${runningWorkflow.name} with JSON kwargs. Active workflows can be launched directly from Workflow Studio.`
            : undefined
        }
        mode="json"
        showSessionId
        initialKwargs={
          ((((runningWorkflow?.definitionJson || {}) as JsonObject).run_defaults as JsonObject | undefined)?.kwargs as Record<string, unknown> | undefined) || {
            config: {
              region: "USA",
              dataset_id: "top_v1",
              universe: "TOP3000",
              delay: 1,
            },
          }
        }
      />

      <WorkflowVersionsDialog
        open={!!versionTarget}
        onOpenChange={(open) => !open && setVersionTarget(null)}
        workflowName={versionTarget?.name}
        versions={versionsCrud.data}
        isLoading={versionsCrud.isLoading || versionsCrud.isValidating}
        getStatusLabel={(status) => String(getLabel("WorkflowDefinition", "STATUS_NAME_MAPPING", String(status)))}
        onRun={handleOpenRunDialog}
        onDuplicate={handleDuplicateAsNewVersion}
        onOpenInEditor={(record) => {
          setVersionTarget(null)
          workflowCrud.handleOpenDialog(record)
        }}
      />
    </div>
  )
}
