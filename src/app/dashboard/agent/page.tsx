"use client"

import * as React from "react"
import { Bot, GitBranchPlus } from "lucide-react"

import { ActionButtons } from "@/components/common/action-buttons"
import { CrudLayout } from "@/components/common/crud-layout"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { type Column } from "@/components/common/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCrud } from "@/hooks/use-crud"
import { useDeleteAction } from "@/hooks/use-delete-action"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"

type AgentRecord = {
  id: number
  name: string
  agentClass: string
  description?: string
  status: number
}

export default function AgentPage() {
  const navigate = useWorkspaceNavigate()
  const deleteAction = useDeleteAction()
  const { mutate } = useCrud<AgentRecord>("/agent/agent")
  useWorkspaceTabTitle("/dashboard/agent", "Agents")

  const filterItems: SearchFilterItem[] = React.useMemo(
    () => [
      { key: "nameLike", label: "Agent Name", type: "text" },
      { key: "agentClass", label: "Implementation Class", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "number",
        options: [
          { label: "Active (10)", value: 10 },
          { label: "Inactive (0)", value: 0 },
          { label: "Archived (20)", value: 20 },
        ],
      },
    ],
    [],
  )

  const columns: Column<AgentRecord>[] = [
    {
      key: "name",
      title: "Agent",
      render: (name: unknown, item: AgentRecord) => (
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <div className="space-y-1">
            <div className="font-medium text-sm">{String(name ?? "-")}</div>
            <div className="text-xs text-muted-foreground">
              {item.description || "No description"}
            </div>
          </div>
        </div>
      ),
    },
    { key: "agentClass", title: "Class", className: "text-sm" },
    {
      key: "status",
      title: "Status",
      render: (value: unknown) => {
        const numeric = Number(value || 0)
        const label =
          numeric === 10 ? "Active" : numeric === 20 ? "Archived" : "Inactive"
        return (
          <Badge variant={numeric === 10 ? "default" : "secondary"}>
            {label}
          </Badge>
        )
      },
    },
    {
      key: "actions",
      title: "Actions",
      width: 220,
      render: (_: unknown, item: AgentRecord) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dashboard/agent/${item.id}`)}
          >
            <GitBranchPlus className="mr-2 h-4 w-4" />
            Detail
          </Button>
          <ActionButtons
            onEdit={() => navigate(`/dashboard/agent/${item.id}`)}
            onConfirmDelete={async () => {
              await deleteAction.remove("/agent/agent", item.id, {
                successMessage: "Agent deleted successfully",
                errorMessage: "Failed to delete agent",
                onSuccess: async () => {
                  await mutate()
                },
              })
            }}
            description={
              <>
                Are you sure you want to delete the agent <strong>{item.name}</strong>?
              </>
            }
          />
        </div>
      ),
    },
  ]

  return (
    <CrudLayout<AgentRecord>
      icon={Bot}
      title="Agents"
      endpoint="/agent/agent"
      filterItems={filterItems}
      storageKey="agent-page-filters"
      columns={columns}
      addButtonLabel="New Agent"
      onAdd={() => navigate("/dashboard/agent/new")}
    />
  )
}
