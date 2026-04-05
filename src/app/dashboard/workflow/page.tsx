"use client"

import * as React from "react"
import { GitBranch, History, Play, Workflow as WorkflowIcon } from "lucide-react"

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
import { RunWorkflowDialog } from "@/components/workflow/dialogs/run-workflow-dialog"
import { WorkflowVersionsDialog } from "@/components/workflow/dialogs/versions-dialog"
import type { JsonObject } from "@/types/json"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"

export default function WorkflowPage() {
  const navigate = useWorkspaceNavigate()
  useWorkspaceTabTitle("/dashboard/workflow", "Workflow")
  const { getOptions, getLabel } = useMeta()
  const {
    workflowCrud,
    publishAction,
    deleteAction,
    setVersionTarget,
    versionTarget,
    runningWorkflow,
    setRunningWorkflow,
    versionsCrud,
    handlePublishWorkflow,
    handleOpenVersions,
    handleDuplicateAsNewVersion,
    handleOpenRunDialog,
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
        const conditionalEdgeCount = Array.isArray(definitionValue.edges)
          ? definitionValue.edges.filter(
              (edge) =>
                edge &&
                typeof edge === "object" &&
                (edge as JsonObject).type === "conditional"
            ).length
          : 0
        return (
          <div className="space-y-1 text-xs">
            <div>{nodeCount} nodes / {edgeCount} edges</div>
            <div className="text-muted-foreground">
              conditional edges: {conditionalEdgeCount}
            </div>
          </div>
        )
      },
    },
    {
      key: "actions",
      title: "Actions",
      width: 320,
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
            onEdit={() => navigate(`/dashboard/workflow/${item.id}`)}
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
    <>
      <CrudLayout<WorkflowRecord>
        icon={WorkflowIcon}
        title="Workflow"
        endpoint="/workflow-definition"
        filterItems={filterItems}
        storageKey="workflow-definition-filters"
        columns={columns}
        addButtonLabel="New Workflow"
        onAdd={() => navigate("/dashboard/workflow/new")}
      />

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
          navigate(`/dashboard/workflow/${record.id}`)
        }}
      />
    </>
  )
}
