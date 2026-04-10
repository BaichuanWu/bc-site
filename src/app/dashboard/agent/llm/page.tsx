"use client"

import * as React from "react"
import { Bot } from "lucide-react"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { ActionButtons } from "@/components/common/action-buttons"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { CrudLayout } from "@/components/common/crud-layout"
import { useDeleteAction } from "@/hooks/use-delete-action"
import { useCrud } from "@/hooks/use-crud"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { fetcher } from "@/lib/api"

type LlmRecord = {
  id: number
  name: string
  provider: string
  modelName: string
  apiKey: string
  baseUrl: string
  isActive: number
}

type BestLlmModelResponse = {
  item?: {
    llmId: number
    model: string
    provider: string
    priority: number
    availabilityState: string
  } | null
}

export default function LlmPage() {
  const navigate = useWorkspaceNavigate()
  useWorkspaceTabTitle("/dashboard/agent/llm", "LLM Config")
  const deleteAction = useDeleteAction()
  const { mutate } = useCrud<LlmRecord>("/agent/llm")
  const { data: bestModelResponse } = useSWR<BestLlmModelResponse>(
    "/agent/llm/best",
    fetcher,
  )
  const bestModel = bestModelResponse?.item

  const filterItems: SearchFilterItem[] = React.useMemo(() => [
    { key: "nameLike", label: "Config Name", type: "text" },
    { key: "provider", label: "Provider", type: "text" },
    { key: "modelName", label: "Model Name", type: "text" },
    {
      key: "isActive",
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
      key: "modelName",
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
      key: "isActive",
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
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4 text-sm shadow-sm">
        <div className="font-medium">Current Best Model</div>
        {bestModel ? (
          <div className="mt-1 text-muted-foreground">
            LLM #{bestModel.llmId} ·{" "}
            <span className="font-mono">{bestModel.model}</span> · priority{" "}
            {bestModel.priority} · {bestModel.availabilityState}
          </div>
        ) : (
          <div className="mt-1 text-muted-foreground">
            No available model candidate.
          </div>
        )}
      </div>
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
    </div>
  )
}
