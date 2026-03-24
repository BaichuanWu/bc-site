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
import { DataTable } from "@/components/common/data-table"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ActionButtons } from "@/components/common/action-buttons"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { CrudLayout } from "@/components/common/crud-layout"

export default function LlmPage() {
  const [filters, setFilters] = React.useState<Record<string, any>>({})

  const {
    isDialogOpen,
    editingItem,
    isSaving,
    handleOpenDialog,
    handleCloseDialog,
    handleSave,
    mutate,
  } = useCrud<any>("/agent/llm", "", filters)


  const [formData, setFormData] = React.useState<any>({})

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

  const columns = [
    { key: "name", title: "Name", className: "text-sm font-medium" },
    { key: "provider", title: "Provider", className: "text-sm" },
    { key: "model_name", title: "Model", className: "text-sm text-muted-foreground font-mono" },
    {
      key: "is_active",
      title: "Status",
      render: (val: number) => (
        <Badge variant={val ? "default" : "secondary"} className="text-[10px]">
          {val ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      width: 100,
      render: (_: any, item: any) => (
        <ActionButtons 
          onEdit={() => handleOpenDialog(item)}
          onConfirmDelete={async () => {
            await apiClient.delete("/agent/llm", { params: { id: item.id } })
            mutate()
          }}
          description={<>Are you sure you want to delete the provider <strong>{item.name}</strong>? This action cannot be undone.</>}
        />
      ),
    },
  ]

  return (
    <TooltipProvider>
      <div className="p-6">
        <CrudLayout<any>
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
