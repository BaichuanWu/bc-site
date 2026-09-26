"use client"

import * as React from "react"
import { Bot } from "lucide-react"

import { ActionButtons } from "@/components/common/action-buttons"
import { CrudLayout } from "@/components/common/crud-layout"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { type Column } from "@/components/common/data-table"
import { useCrudListRefresh } from "@/hooks/use-crud"
import { useDeleteAction } from "@/hooks/use-delete-action"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"

type AgentRecord = {
  id: number
  name: string
  agentClass: string
  description?: string
}

export default function AgentPage() {
  const navigate = useWorkspaceNavigate()
  const deleteAction = useDeleteAction()
  const refreshAgents = useCrudListRefresh("/agent/agent")
  useWorkspaceTabTitle("/dashboard/agent", "Agents")

  const filterItems: SearchFilterItem[] = React.useMemo(
    () => [
      { key: "nameLike", label: "Agent Name", type: "text" },
      { key: "agentClass", label: "Implementation Class", type: "text" },
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
      key: "actions",
      title: "Actions",
      width: 96,
      render: (_: unknown, item: AgentRecord) => (
        <div className="flex items-center justify-end">
          <ActionButtons
            onEdit={() => navigate(`/dashboard/agent/${item.id}`)}
            onConfirmDelete={async () => {
              await deleteAction.remove("/agent/agent", item.id, {
                successMessage: "Agent deleted successfully",
                errorMessage: "Failed to delete agent",
                onSuccess: async () => {
                  await refreshAgents()
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
