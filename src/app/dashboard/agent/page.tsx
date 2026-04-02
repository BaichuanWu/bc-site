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
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MarkdownEditor } from "@/components/common/markdown-editor"
import { Bot } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import { ActionButtons } from "@/components/common/action-buttons"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { CrudLayout } from "@/components/common/crud-layout"
import { RemoteSelect } from "@/components/common/remote-select"
import { parseJsonText } from "@/lib/json-utils"
import { useDeleteAction } from "@/hooks/use-delete-action"
import useSWR from "swr"
import { Textarea } from "@/components/ui/textarea"

type AgentOptionsResponse = {
  agent_classes?: string[]
}

type AgentRecord = {
  id: number
  name: string
  version: string
  agentClass: string
  llmId: number | null
  sysPrompt: string
  userPrompt: string
  llmConfig?: Record<string, unknown>
  knowledgeNamespaces?: string[]
  responseType?: string
  isActive: number
}

type LlmOption = {
  id: number
  name: string
}

function preventDialogCloseWhileFullscreen(event: Event) {
  if (typeof document === "undefined") return
  if (document.documentElement.dataset.mdEditorFullscreen === "true") {
    event.preventDefault()
  }
}

function preventDialogEscapeWhileFullscreen(event: KeyboardEvent) {
  if (typeof document === "undefined") return
  if (document.documentElement.dataset.mdEditorFullscreen === "true") {
    event.preventDefault()
  }
}

export default function AgentPage() {
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
  } = useCrud<AgentRecord>("/agent/agent", "", filters)

  // Share the same endpoint/cache as RemoteSelect for table label lookup
  const { data: llmOptions } = useSWR<LlmOption[]>("/agent/llm?limit=100", (url: string) => 
    apiClient.get(url).then((res: unknown) => {
      if (Array.isArray(res)) return res;
      const record = (res && typeof res === "object") ? res as Record<string, unknown> : null
      return (Array.isArray(record?.dataSource) ? record.dataSource : Array.isArray(record?.data) ? record.data : []) as LlmOption[];
    })
  )
  const { data: agentOptions } = useSWR<AgentOptionsResponse>("/agent/options", (url: string) =>
    apiClient.get(url).then((res) => res as AgentOptionsResponse)
  )

  const [formData, setFormData] = React.useState<Partial<AgentRecord>>({})
  const [llmConfigText, setLlmConfigText] = React.useState("{}")
  const [knowledgeNamespacesText, setKnowledgeNamespacesText] = React.useState("[]")
  const availableAgentClasses = React.useMemo(() => {
    const classes = agentOptions?.agent_classes || []
    return classes.length ? classes : ["DefaultAgentNode", "ReflectiveAgent", "GraphAgentNode"]
  }, [agentOptions])

  React.useEffect(() => {
    if (editingItem) {
      setFormData(editingItem)
      setLlmConfigText(JSON.stringify(editingItem.llmConfig || {}, null, 2))
      setKnowledgeNamespacesText(
        JSON.stringify(editingItem.knowledgeNamespaces || [], null, 2)
      )
    } else {
      setFormData({
        name: "",
        version: "1.0.0",
        agentClass: availableAgentClasses[0] || "DefaultAgentNode",
        llmId: 0,
        sysPrompt: "# You are a helpful assistant\n\nDescribe your behavior here...",
        userPrompt: "",
        llmConfig: { model: "gpt-4o", temperature: 0.7 },
        isActive: 1,
      })
      setLlmConfigText(JSON.stringify({ model: "gpt-4o", temperature: 0.7 }, null, 2))
      setKnowledgeNamespacesText("[]")
    }
  }, [availableAgentClasses, editingItem, isDialogOpen])

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

  const columns: import("@/components/common/data-table").Column<AgentRecord>[] = [
    { 
        key: "name", 
        title: "Agent Name",
        render: (name: unknown, item: AgentRecord) => (
            <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{String(name ?? "-")}</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0">{item.version}</Badge>
            </div>
        )
    },
    { key: "agentClass", title: "Class", className: "text-sm" },
    { 
        key: "llmId", 
        title: "LLM / Override",
        render: (id: unknown, item: AgentRecord) => {
            const llm = (llmOptions || []).find((o) => o.id === id)
            const override = itemHasLlmOverride(item)
            return (
              <div className="space-y-1">
                <div className="text-sm">{llm ? llm.name : "No default LLM"}</div>
                <div className="text-[11px] text-muted-foreground">
                  {override ? "Agent llm_config override enabled" : "Using LLM defaults"}
                </div>
              </div>
            )
        }
    },
    {
      key: "responseType",
      title: "Response / Knowledge",
      render: (_: unknown, item: AgentRecord) => (
        <div className="space-y-1 text-xs">
          <div>{item.responseType || "-"}</div>
          <div className="text-muted-foreground">
            namespaces: {Array.isArray(item.knowledgeNamespaces) ? item.knowledgeNamespaces.length : 0}
          </div>
        </div>
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
      render: (_: unknown, item: AgentRecord) => (
        <ActionButtons 
          onEdit={() => handleOpenDialog(item)}
          onConfirmDelete={async () => {
            await deleteAction.remove("/agent/agent", item.id, {
              successMessage: "Agent deleted successfully",
              errorMessage: "Failed to delete agent",
              onSuccess: async () => {
                await mutate()
              },
            })
          }}
          description={<>Are you sure you want to delete the agent <strong>{item.name}</strong>? This action cannot be undone.</>}
        />
      ),
    },
  ]

  function itemHasLlmOverride(item: Partial<AgentRecord> | null | undefined) {
    return !!item?.llmConfig && Object.keys(item.llmConfig || {}).length > 0
  }

  return (
    <TooltipProvider>
      <div className="p-6">
        <CrudLayout<AgentRecord>
          title="Agent Management"
          description="Define and configure specialized agents and their prompts."
          endpoint="/agent/agent"
          filterItems={filterItems}
          storageKey="agent-page-filters"
          columns={columns}
          addButtonLabel="Create Agent"
          onAdd={() => handleOpenDialog()}
        >
          <Dialog modal={false} open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent
          className="sm:max-w-[1100px] max-h-[90vh] flex flex-col p-0"
          onInteractOutside={preventDialogCloseWhileFullscreen}
          onPointerDownOutside={preventDialogCloseWhileFullscreen}
          onEscapeKeyDown={preventDialogEscapeWhileFullscreen}
        >
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
                            {availableAgentClasses.map((agentClass) => (
                              <SelectItem key={agentClass} value={agentClass}>
                                {agentClass}
                              </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="llmId">LLM Credentials</Label>
                    <RemoteSelect
                        endpoint="/agent/llm?limit=100"
                        value={formData.llmId}
                        onValueChange={(val) =>
                          setFormData({
                            ...formData,
                            llmId: typeof val === "number" ? val : null,
                          })
                        }
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

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="responseType">Response Type</Label>
                    <Input
                        id="responseType"
                        value={formData.responseType || ""}
                        onChange={(e) => setFormData({ ...formData, responseType: e.target.value })}
                        placeholder="Optional schema name"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="knowledgeNamespaces">Knowledge Namespaces</Label>
                    <Textarea
                        id="knowledgeNamespaces"
                        value={knowledgeNamespacesText}
                        onChange={(e) => setKnowledgeNamespacesText(e.target.value)}
                        className="min-h-[96px] font-mono text-xs"
                        placeholder='["econ_intuition","seed_patterns"]'
                    />
                </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="llmConfig">
                LLM Override Config
              </Label>
              <p className="text-xs text-muted-foreground">
                Selected LLM provides default model credentials. Values in agent llm_config override them.
              </p>
              <Textarea
                id="llmConfig"
                value={llmConfigText}
                onChange={(e) => setLlmConfigText(e.target.value)}
                className="min-h-[160px] font-mono text-xs"
                placeholder='{"model":"gpt-4.1","temperature":0.2,"max_tokens":2000}'
              />
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
            <Button
              onClick={() =>
                handleSave({
                  ...formData,
                  llmConfig: parseJsonText(llmConfigText, {}),
                  knowledgeNamespaces: parseJsonText(knowledgeNamespacesText, []),
                })
              }
              disabled={isSaving}
            >
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
