"use client"

import * as React from "react"
import { useCrud } from "@/hooks/use-crud"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import { ActionButtons } from "@/components/common/action-buttons"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { CrudLayout } from "@/components/common/crud-layout"
import { useDeleteAction } from "@/hooks/use-delete-action"

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
  const [filters] = React.useState<Record<string, unknown>>({})
  const deleteAction = useDeleteAction()

  const {
    isDialogOpen,
    editingItem,
    isSaving,
    handleOpenDialog,
    handleCloseDialog,
    handleSave,
    mutate,
  } = useCrud<LlmRecord>("/agent/llm", "", filters)


  const [formData, setFormData] = React.useState<Partial<LlmRecord>>({})

  React.useEffect(() => {
    if (editingItem) {
      setFormData(editingItem)
    } else {
      setFormData({
        name: "",
        provider: "openai",
        model_name: "gpt-4o",
        api_key: "",
        base_url: "",
        is_active: 1,
      })
    }
  }, [editingItem, isDialogOpen])

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
          onEdit={() => handleOpenDialog(item)}
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
    <TooltipProvider>
      <div className="p-6">
        <CrudLayout<LlmRecord>
          title="LLM Configuration"
          description="Manage your LLM providers and API credentials."
          endpoint="/agent/llm"
          filterItems={filterItems}
          storageKey="llm-page-filters"
          columns={columns}
          addButtonLabel="Add Provider"
          onAdd={() => handleOpenDialog()}
        >
          <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Provider" : "Add Provider"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Config Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. GPT-4o Official"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="openai, deepseek..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model_name">Model Name</Label>
                <Input
                  id="model_name"
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  placeholder="gpt-4o"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="base_url">Base URL (Optional)</Label>
              <Input
                id="base_url"
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            {/* We can use a standard button for the status toggle, but since we are editing, let's keep it simple with a select or just let them rely on the Action toggle button outside */}
            <div className="grid gap-2">
              <Label htmlFor="is_active">Status</Label>
              <Select 
                  value={String(formData.is_active)} 
                  onValueChange={(val) => setFormData({...formData, is_active: parseInt(val)})}
              >
                  <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="1">Active</SelectItem>
                      <SelectItem value="0">Inactive</SelectItem>
                  </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={() => handleSave(formData)} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </CrudLayout>
      </div>
    </TooltipProvider>
  )
}
