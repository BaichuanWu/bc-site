"use client"

import * as React from "react"
import useSWR from "swr"
import { Bot, GitBranchPlus } from "lucide-react"

import {
  AgentConfigEditor,
  type AgentConfigSpec,
} from "@/components/agent/config/editor"
import { ActionButtons } from "@/components/common/action-buttons"
import { CrudLayout } from "@/components/common/crud-layout"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAsyncAction } from "@/hooks/use-async-action"
import { useCrud } from "@/hooks/use-crud"
import { useDeleteAction } from "@/hooks/use-delete-action"
import { apiClient } from "@/lib/api"

type AgentRecord = {
  id: number
  name: string
  agentClass: string
  description?: string
  status: number
}

type AgentVersionRecord = {
  id: number
  agentId: number
  version: string
  description?: string
  configJson?: Record<string, unknown>
  isActive: number
  publishedTime?: string
}

type AgentOptionsResponse = {
  agent_classes?: string[]
  config_specs?: Record<string, AgentConfigSpec>
}

type AgentFormState = {
  name: string
  agentClass: string
  description: string
  status: string
}

type VersionFormState = {
  version: string
  description: string
  isActive: boolean
  configJson: Record<string, unknown>
}

const EMPTY_AGENT_FORM: AgentFormState = {
  name: "",
  agentClass: "DefaultAgentNode",
  description: "",
  status: "10",
}

export default function AgentPage() {
  const [filters] = React.useState<Record<string, unknown>>({})
  const deleteAction = useDeleteAction()
  const versionSaveAction = useAsyncAction()
  const {
    isDialogOpen,
    editingItem,
    isSaving,
    handleOpenDialog,
    handleCloseDialog,
    handleSave,
    mutate,
  } = useCrud<AgentRecord>("/agent/agent", "", filters)

  const { data: agentOptions } = useSWR<AgentOptionsResponse>("/agent/options", (url: string) =>
    apiClient.get(url).then((res) => res as AgentOptionsResponse)
  )

  const [formData, setFormData] = React.useState<AgentFormState>(EMPTY_AGENT_FORM)
  const [versionTarget, setVersionTarget] = React.useState<AgentRecord | null>(null)
  const [isVersionEditorOpen, setIsVersionEditorOpen] = React.useState(false)
  const [editingVersion, setEditingVersion] = React.useState<AgentVersionRecord | null>(null)
  const [versionForm, setVersionForm] = React.useState<VersionFormState>({
    version: "1.0.0",
    description: "",
    isActive: true,
    configJson: {},
  })

  const agentClassOptions = React.useMemo(
    () => agentOptions?.agent_classes ?? [],
    [agentOptions?.agent_classes],
  )

  const configSpecs = agentOptions?.config_specs || {}
  const currentVersionSpec = versionTarget ? configSpecs[versionTarget.agentClass] : null

  const { data: versions = [], mutate: mutateVersions } = useSWR<AgentVersionRecord[]>(
    versionTarget ? `/agent/agent/${versionTarget.id}/versions` : null,
    (url: string) => apiClient.get(url).then((res: unknown) => res as AgentVersionRecord[]),
  )

  React.useEffect(() => {
    if (!isDialogOpen) return
    if (editingItem) {
      setFormData({
        name: editingItem.name || "",
        agentClass: editingItem.agentClass || "DefaultAgentNode",
        description: editingItem.description || "",
        status: String(editingItem.status ?? 10),
      })
      return
    }
      setFormData({
        ...EMPTY_AGENT_FORM,
        agentClass: agentClassOptions[0] || "",
      })
  }, [agentClassOptions, editingItem, isDialogOpen])

  React.useEffect(() => {
    if (!isVersionEditorOpen || !versionTarget) return
    if (editingVersion) {
      setVersionForm({
        version: editingVersion.version || "1.0.0",
        description: editingVersion.description || "",
        isActive: Boolean(editingVersion.isActive),
        configJson: editingVersion.configJson || currentVersionSpec?.defaults || {},
      })
      return
    }
    setVersionForm({
      version: "1.0.0",
      description: "",
      isActive: true,
      configJson: (currentVersionSpec?.defaults as Record<string, unknown>) || {},
    })
  }, [currentVersionSpec?.defaults, editingVersion, isVersionEditorOpen, versionTarget])

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

  const columns: import("@/components/common/data-table").Column<AgentRecord>[] = [
    {
      key: "name",
      title: "Agent",
      render: (name: unknown, item: AgentRecord) => (
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <div className="space-y-1">
            <div className="font-medium text-sm">{String(name ?? "-")}</div>
            <div className="text-xs text-muted-foreground">{item.description || "No description"}</div>
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
        const label = numeric === 10 ? "Active" : numeric === 20 ? "Archived" : "Inactive"
        return <Badge variant={numeric === 10 ? "default" : "secondary"}>{label}</Badge>
      },
    },
    {
      key: "actions",
      title: "Actions",
      width: 180,
      render: (_: unknown, item: AgentRecord) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setVersionTarget(item)
            }}
          >
            <GitBranchPlus className="mr-2 h-4 w-4" />
            Versions
          </Button>
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

  const handleOpenVersionEditor = React.useCallback(
    (versionRecord?: AgentVersionRecord | null) => {
      setEditingVersion(versionRecord || null)
      setIsVersionEditorOpen(true)
    },
    [],
  )

  const handleSaveVersion = React.useCallback(async () => {
    if (!versionTarget) return
    await versionSaveAction.run(
      async () => {
        const payload = {
          agentId: versionTarget.id,
          version: versionForm.version,
          description: versionForm.description,
          configJson: versionForm.configJson,
          isActive: versionForm.isActive ? 1 : 0,
          id: editingVersion?.id,
        }
        await apiClient.post("/agent/version/save", payload)
      },
      {
        successMessage: editingVersion ? "Agent version updated" : "Agent version created",
        errorMessage: "Failed to save agent version",
        onSuccess: async () => {
          setIsVersionEditorOpen(false)
          setEditingVersion(null)
          await mutateVersions()
        },
      },
    )
  }, [editingVersion, mutateVersions, versionForm, versionSaveAction, versionTarget])

  return (
    <div className="p-6">
      <CrudLayout<AgentRecord>
        title="Agent Management"
        description="Manage stable agent identities and their versioned runtime configuration."
        endpoint="/agent/agent"
        filterItems={filterItems}
        storageKey="agent-page-filters"
        columns={columns}
        addButtonLabel="Create Agent"
        onAdd={() => handleOpenDialog()}
      >
        <Dialog modal={false} open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Agent Identity" : "Create Agent Identity"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="clustering"
                  disabled={Boolean(editingItem)}
                />
                {editingItem ? (
                  <div className="text-xs text-muted-foreground">
                    Agent name is immutable after the identity is created.
                  </div>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="agentClass">Implementation Class</Label>
                <Select
                  value={formData.agentClass}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, agentClass: value }))}
                  disabled={Boolean(editingItem)}
                >
                  <SelectTrigger id="agentClass">
                    <SelectValue placeholder="Select an agent class" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentClassOptions.map((agentClass) => (
                      <SelectItem key={agentClass} value={agentClass}>
                      {agentClass}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                {editingItem ? (
                  <div className="text-xs text-muted-foreground">
                    Agent class is immutable after the identity is created.
                  </div>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="min-h-24"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Active</SelectItem>
                    <SelectItem value="0">Inactive</SelectItem>
                    <SelectItem value="20">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleCloseDialog()}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!formData.agentClass.trim()) return
                  await handleSave({
                    ...formData,
                    status: Number(formData.status),
                  } as unknown as Partial<AgentRecord>)
                }}
                disabled={isSaving || !formData.agentClass.trim() || !formData.name.trim()}
              >
                {isSaving ? "Saving..." : editingItem ? "Save Agent" : "Create Agent"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          modal={false}
          open={Boolean(versionTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setVersionTarget(null)
              setIsVersionEditorOpen(false)
              setEditingVersion(null)
            }
          }}
        >
          <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Agent Versions
                {versionTarget ? ` · ${versionTarget.name}` : ""}
              </DialogTitle>
            </DialogHeader>

            {versionTarget ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
                  <div className="space-y-1">
                    <div className="font-medium">{versionTarget.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {versionTarget.agentClass}
                    </div>
                  </div>
                  <Button onClick={() => handleOpenVersionEditor(null)}>
                    Create Version
                  </Button>
                </div>

                <div className="space-y-3">
                  {versions.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                      No versions yet for this agent.
                    </div>
                  ) : (
                    versions.map((version) => (
                      <div
                        key={version.id}
                        className="flex items-start justify-between gap-4 rounded-2xl border p-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">v{version.version}</span>
                            <Badge variant={version.isActive ? "default" : "secondary"}>
                              {version.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {version.description || "No version description"}
                          </div>
                          {version.publishedTime ? (
                            <div className="text-xs text-muted-foreground">
                              Published: {version.publishedTime}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenVersionEditor(version)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await deleteAction.remove("/agent/version", version.id, {
                                successMessage: "Agent version deleted",
                                errorMessage: "Failed to delete agent version",
                                onSuccess: async () => {
                                  await mutateVersions()
                                },
                              })
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog modal={false} open={isVersionEditorOpen} onOpenChange={setIsVersionEditorOpen}>
          <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVersion ? "Edit Agent Version" : "Create Agent Version"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={versionForm.version}
                    onChange={(e) =>
                      setVersionForm((prev) => ({ ...prev, version: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="versionStatus">Status</Label>
                  <div className="flex h-10 items-center rounded-md border px-3">
                    <Checkbox
                      checked={versionForm.isActive}
                      onCheckedChange={(checked: boolean | "indeterminate") =>
                        setVersionForm((prev) => ({
                          ...prev,
                          isActive: Boolean(checked),
                        }))
                      }
                    />
                    <span className="ml-3 text-sm">
                      {versionForm.isActive ? "Active version" : "Inactive version"}
                    </span>
                  </div>
                </div>
                <div className="grid gap-2 md:col-span-1">
                  <Label htmlFor="versionDescription">Description</Label>
                  <Textarea
                    id="versionDescription"
                    value={versionForm.description}
                    onChange={(e) =>
                      setVersionForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="min-h-24"
                  />
                </div>
              </div>

              <AgentConfigEditor
                spec={currentVersionSpec}
                value={versionForm.configJson}
                onChange={(next) =>
                  setVersionForm((prev) => ({ ...prev, configJson: next }))
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsVersionEditorOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveVersion}>
                Save Version
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CrudLayout>
    </div>
  )
}
