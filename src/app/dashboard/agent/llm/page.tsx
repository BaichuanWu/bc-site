"use client"

import * as React from "react"
import { Bot } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ActionButtons } from "@/components/common/action-buttons"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { CrudLayout } from "@/components/common/crud-layout"
import { useDeleteAction } from "@/hooks/use-delete-action"
import { useCrud } from "@/hooks/use-crud"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"

type LlmRecord = {
  id: number
  name: string
  provider: string
  model_name: string
  api_key: string
  base_url: string
  is_active: number
}

export default function LlmPage() {
  const navigate = useWorkspaceNavigate()
  useWorkspaceTabTitle("/dashboard/agent/llm", "LLM Config")
  const deleteAction = useDeleteAction()
  const { mutate } = useCrud<LlmRecord>("/agent/llm")

  const filterItems: SearchFilterItem[] = React.useMemo(() => [
    { key: "nameLike", label: "Config Name", type: "text" },
    { key: "provider", label: "Provider", type: "text" },
    { key: "model_name", label: "Model Name", type: "text" },
    {
      key: "is_active",
      label: "Status",
      type: "number",
      options: [
        { label: "Active (1)", value: 1 },
        { label: "Inactive (0)", value: 0 }
      ]
    },
  ], [])

  const columns: import("@/components/common/data-table").Column<LlmRecord>[] = [
    { key: "name", title: "Name", className: "text-sm font-medium" },
    { key: "provider", title: "Provider", className: "text-sm" },
    {
      key: "model_name",
      title: "Default Model",
      render: (value: unknown) => (
        <div className="space-y-1">
          <div className="text-sm font-mono text-muted-foreground">{String(value ?? "-")}</div>
          <div className="text-[11px] text-muted-foreground">Agent llm_config can override this</div>
        </div>
      ),
    },
    {
      key: "base_url",
      title: "Endpoint",
      render: (value: unknown) => (
        <div className="max-w-[220px] truncate text-xs text-muted-foreground">
          {String(value || "Provider default")}
        </div>
      ),
    },
    {
      key: "api_key",
      title: "Credential",
      render: (value: unknown) => (
        <span className="text-xs font-mono text-muted-foreground">
          {typeof value === "string" && value ? `${value.slice(0, 6)}••••••${value.slice(-4)}` : "-"}
        </span>
      ),
    },
    {
      key: "is_active",
      title: "Status",
      render: (val: unknown) => (
        <Badge variant={val ? "default" : "secondary"} className="text-[10px]">
          {val ? "Active" : "Inactive"}
        </Badge>
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
                await mutate()
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
