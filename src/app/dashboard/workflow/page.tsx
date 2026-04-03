"use client"

import * as React from "react"
import { GitBranch, History, Play, Sparkles } from "lucide-react"

import { useMeta } from "@/hooks/use-meta"
import {
  useWorkflowStudio,
  type WorkflowRecord,
} from "@/hooks/use-workflow-studio"
import { CrudLayout } from "@/components/common/crud-layout"
import { ActionButtons } from "@/components/common/action-buttons"
import { type Column } from "@/components/common/data-table"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { JsonNode } from "@/components/common/json-node"
import { RunWorkflowDialog } from "@/components/workflow/dialogs/run-workflow-dialog"
import { WorkflowVersionsDialog } from "@/components/workflow/dialogs/versions-dialog"
import { WorkflowEditorShell } from "@/components/workflow/studio/editor-shell"
import type { JsonObject } from "@/types/json"

export default function WorkflowPage() {
  const { getOptions, getLabel } = useMeta()
  const {
    editorRef,
    options,
    workflowCrud,
    agentCrud,
    publishAction,
    deleteAction,
    form,
    setForm,
    selectedTemplate,
    setSelectedTemplate,
    preview,
    setVersionTarget,
    versionTarget,
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
  } = useWorkflowStudio()

  const domainOptions = getOptions("WorkflowDefinition", "DOMAIN_NAME_MAPPING").map((option) => ({
    label: String(option.label),
    value: String(option.value),
  }))
  const statusOptions = getOptions("WorkflowDefinition", "STATUS_NAME_MAPPING").map((option) => ({
    label: String(option.label),
    value: String(option.value),
  }))

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
                Workflow definition fields are edited on the page. The graph field has its own fullscreen canvas editor.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={closeEditor}>Close Editor</Button>
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
              <Button onClick={handleSaveWorkflow} disabled={workflowCrud.isSaving}>
                {workflowCrud.isSaving ? "Saving..." : "Save Workflow"}
              </Button>
            </div>
          </div>

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
          </div>

          <WorkflowEditorShell
            definitionJson={form.definitionJson}
            uiSchemaJson={form.uiSchemaJson}
            availableAgents={agentCrud.data || []}
            agentSearch={agentCrud.search}
            onAgentSearchChange={agentCrud.setSearch}
            isLoadingAgents={agentCrud.isLoading || agentCrud.isValidating}
            availableRouters={options?.meta?.routers || []}
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
                    setForm((prev) => ({
                      ...prev,
                      definitionJson: e.target.value,
                    }))
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
        showSessionId
        initialKwargs={
          ((((runningWorkflow?.definitionJson || {}) as JsonObject).run_defaults as JsonObject | undefined)?.kwargs as Record<string, unknown> | undefined) || {}
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
