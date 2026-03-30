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
import { MarkdownEditor } from "@/components/common/markdown-editor"
import { Plus, Bot } from "lucide-react"
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
import { RemoteSelect } from "@/components/common/remote-select"
import useSWR from "swr"

export default function AgentPage() {
  const [filters, setFilters] = React.useState<Record<string, any>>({})

  const {
    isDialogOpen,
    editingItem,
    isSaving,
    handleOpenDialog,
    handleCloseDialog,
    handleSave,
    mutate,
  } = useCrud<any>("/agent/agent", "", filters)

  // Share the same endpoint/cache as RemoteSelect for table label lookup
  const { data: llmOptions } = useSWR("/agent/llm?limit=100", (url) => 
    apiClient.get(url).then((res: any) => {
      if (Array.isArray(res)) return res;
      return res?.dataSource || res?.data || [];
    })
  )


  const [formData, setFormData] = React.useState<any>({})

  React.useEffect(() => {
    if (editingItem) {
      setFormData(editingItem)
    } else {
      setFormData({
        name: "",
        version: "1.0.0",
        agentClass: "BaseAgent",
        llmId: 0,
        sysPrompt: "# You are a helpful assistant\n\nDescribe your behavior here...",
        userPrompt: "",
        llmConfig: { model: "gpt-4o", temperature: 0.7 },
        isActive: 1,
      })
    }
  }, [editingItem, isDialogOpen])

  const filterItems: SearchFilterItem[] = React.useMemo(() => [
    { key: "nameLike", label: "Agent Name", type: "text" },
    { key: "agentClass", label: "Class", type: "text" },
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

  const columns = [
    { 
        key: "name", 
        title: "Agent Name",
        render: (name: string, item: any) => (
            <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{name}</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0">{item.version}</Badge>
            </div>
        )
    },
    { key: "agentClass", title: "Class", className: "text-sm" },
    { 
        key: "llmId", 
        title: "LLM Config",
        render: (id: number) => {
            const llm = (llmOptions || []).find((o: any) => o.id === id)
            return <span className="text-sm">{llm ? llm.name : "Default / None"}</span>
        }
    },
    {
      key: "isActive",
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
            await apiClient.delete("/agent/agent", { params: { id: item.id } })
            mutate()
          }}
          description={<>Are you sure you want to delete the agent <strong>{item.name}</strong>? This action cannot be undone.</>}
        />
      ),
    },
  ]

  return (
    <TooltipProvider>
      <div className="p-6">
        <CrudLayout<any>
          title="Agent Management"
          description="Define and configure specialized agents and their prompts."
          endpoint="/agent/agent"
          filterItems={filterItems}
          storageKey="agent-page-filters"
          columns={columns}
          addButtonLabel="Create Agent"
          onAdd={() => handleOpenDialog()}
        >
          <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[1100px] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{editingItem ? "Edit Agent" : "Create New Agent"}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="agent_name">Agent Name</Label>
                    <Input
                        id="agent_name"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Strategist"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="version">Version</Label>
                    <Input
                        id="version"
                        value={formData.version || ""}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        placeholder="1.0.0"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="agentClass">Implementation Class</Label>
                    <Select 
                        value={formData.agentClass || ""} 
                        onValueChange={(val) => setFormData({...formData, agentClass: val})}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="BaseAgent">BaseAgent</SelectItem>
                            <SelectItem value="ReflectionAgent">ReflectionAgent</SelectItem>
                            <SelectItem value="ClusteringAgent">ClusteringAgent</SelectItem>
                            <SelectItem value="StrategistAgent">StrategistAgent</SelectItem>
                            <SelectItem value="AssemblerAgent">AssemblerAgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="llmId">LLM Credentials</Label>
                    <RemoteSelect
                        endpoint="/agent/llm?limit=100"
                        value={formData.llmId}
                        onValueChange={(val) => setFormData({...formData, llmId: val})}
                        placeholder="Select LLM"
                    />
                </div>
            </div>

            <div className="grid gap-2">
               <Label htmlFor="isActive">Status</Label>
               <Select 
                   value={String(formData.isActive ?? 1)} 
                   onValueChange={(val) => setFormData({...formData, isActive: parseInt(val)})}
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

            <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-2 flex-1 min-h-0">
                  <Label>System Prompt (Markdown)</Label>
                  <MarkdownEditor
                    value={formData.sysPrompt || ""}
                    onChange={(val) => setFormData({ ...formData, sysPrompt: val })}
                    className="mt-1 h-[400px] overflow-auto"
                  />
                </div>
                <div className="grid gap-2 flex-1 min-h-0">
                  <Label>User Prompt Template (Markdown)</Label>
                  <MarkdownEditor
                    value={formData.userPrompt || ""}
                    onChange={(val) => setFormData({ ...formData, userPrompt: val })}
                    className="mt-1 h-[400px] overflow-auto"
                  />
                </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={() => handleSave(formData)} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Agent"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </CrudLayout>
      </div>
    </TooltipProvider>
  )
}
