"use client"

import * as React from "react"
import { Bot } from "lucide-react"
import { ActionButtons } from "@/components/common/action-buttons"
import { type Column } from "@/components/common/data-table"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { CrudLayout } from "@/components/common/crud-layout"
import { useDeleteAction } from "@/hooks/use-delete-action"
import { useCrudListRefresh } from "@/hooks/use-crud"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"

type LlmRecord = {
  id: number
  name: string
  provider: string
  defaultModel: string
  apiKey: string
  baseUrl: string
}

export default function LlmPage() {
  const navigate = useWorkspaceNavigate()
  useWorkspaceTabTitle("/dashboard/agent/llm", "LLM Config")
  const deleteAction = useDeleteAction()
  const refreshLlms = useCrudListRefresh("/agent/llm")

  const filterItems: SearchFilterItem[] = React.useMemo(() => [
    { key: "nameLike", label: "Config Name", type: "text" },
    { key: "provider", label: "Provider", type: "text" },
    { key: "defaultModel", label: "Default Model", type: "text" },
  ], [])

  const columns: Column<LlmRecord>[] = [
    { key: "name", title: "Name", className: "text-sm font-medium" },
    { key: "provider", title: "Provider", className: "text-sm" },
    {
      key: "defaultModel",
      title: "Default Model",
      render: (value: unknown) => (
        <div className="space-y-1">
          <div className="text-sm font-mono text-muted-foreground">{String(value ?? "-")}</div>
          <div className="text-[11px] text-muted-foreground">Agent llm_config can override this</div>
        </div>
      ),
    },
    {
      key: "baseUrl",
      title: "Endpoint",
      render: (value: unknown) => (
        <div className="max-w-[220px] truncate text-xs text-muted-foreground">
          {String(value || "Provider default")}
        </div>
      ),
    },
    {
      key: "apiKey",
      title: "Credential",
      render: (value: unknown) => (
        <span className="text-xs font-mono text-muted-foreground">
          {typeof value === "string" && value ? `${value.slice(0, 6)}••••••${value.slice(-4)}` : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      width: 100,
      render: (_: unknown, item: LlmRecord) => (
        <ActionButtons 
          onEdit={() => navigate(`/dashboard/agent/llm/${item.id}`)}
          onConfirmDelete={async () => {
            await deleteAction.remove("/agent/llm", item.id, {
              successMessage: "LLM provider deleted successfully",
              errorMessage: "Failed to delete provider",
              onSuccess: async () => {
                await refreshLlms()
              },
            })
          }}
          description={<>Are you sure you want to delete the provider <strong>{item.name}</strong>? This action cannot be undone.</>}
        />
      ),
    },
  ]

  return (
    <CrudLayout<LlmRecord>
      icon={Bot}
      title="LLM Config"
      endpoint="/agent/llm"
      filterItems={filterItems}
      storageKey="llm-page-filters"
      columns={columns}
      addButtonLabel="New Config"
      onAdd={() => navigate("/dashboard/agent/llm/new")}
    />
  )
}
