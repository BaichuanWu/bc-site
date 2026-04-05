"use client"

import * as React from "react"
import useSWR from "swr"
import { ArrowLeft, GitBranchPlus } from "lucide-react"

import {
  AgentConfigEditor,
  type AgentConfigSpec,
} from "@/components/agent/config/editor"
import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAsyncAction } from "@/hooks/use-async-action"
import { apiClient, fetcher } from "@/lib/api"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { useWorkspaceTabs } from "@/components/workspace/workspace-tabs-provider"
import { normalizeCrudListResponse } from "@/lib/crud-response"

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

type AgentDetailPageProps =
  | {
      mode: "create"
    }
  | {
      mode: "edit"
      agentId: number
      initialVersionId?: number
    }

export function AgentDetailPage(props: AgentDetailPageProps) {
  const navigate = useWorkspaceNavigate()
  const { updateTabMeta } = useWorkspaceTabs()
  const saveAction = useAsyncAction()
  const versionSaveAction = useAsyncAction()
  const isCreate = props.mode === "create"
  const agentId = props.mode === "edit" ? props.agentId : null
  const initialVersionId = props.mode === "edit" ? props.initialVersionId : undefined
  const initialVersionAppliedRef = React.useRef(false)

  const { data: agentsResponse, mutate: mutateAgents } = useSWR<unknown>(
    "/agent/agent",
    fetcher,
  )
  const { data: agentOptions } = useSWR<AgentOptionsResponse>(
    "/agent/options",
    fetcher,
  )
  const { data: versions = [], mutate: mutateVersions } = useSWR<AgentVersionRecord[]>(
    agentId ? `/agent/agent/${agentId}/versions` : null,
    fetcher,
  )

  const agents = React.useMemo(
    () => normalizeCrudListResponse<AgentRecord>(agentsResponse),
    [agentsResponse],
  )
  const agent = React.useMemo(
    () => (agentId ? agents.find((item) => item.id === agentId) || null : null),
    [agentId, agents],
  )

  const agentClassOptions = React.useMemo(
    () => agentOptions?.agent_classes ?? [],
    [agentOptions?.agent_classes],
  )
  const currentVersionSpec =
    agent && agentOptions?.config_specs
      ? agentOptions.config_specs[agent.agentClass] || null
      : null

  const [agentForm, setAgentForm] = React.useState<AgentFormState>(EMPTY_AGENT_FORM)
  const [editingVersion, setEditingVersion] =
    React.useState<AgentVersionRecord | null>(null)
  const [isVersionEditorOpen, setIsVersionEditorOpen] = React.useState(false)
  const [versionForm, setVersionForm] = React.useState<VersionFormState>({
    version: "1.0.0",
    description: "",
    isActive: true,
    configJson: {},
  })

  React.useEffect(() => {
    if (isCreate) {
      setAgentForm((prev) => ({
        ...EMPTY_AGENT_FORM,
        agentClass: agentClassOptions[0] || prev.agentClass || "",
      }))
      updateTabMeta("/dashboard/agent/new", { title: "New Agent" })
      return
    }
    if (!agent) return
    setAgentForm({
      name: agent.name || "",
      agentClass: agent.agentClass || "DefaultAgentNode",
      description: agent.description || "",
      status: String(agent.status ?? 10),
    })
    updateTabMeta(`/dashboard/agent/${agent.id}`, {
      title: `Agent: ${agent.name || `#${agent.id}`}`,
    })
  }, [agent, agentClassOptions, isCreate, updateTabMeta])

  React.useEffect(() => {
    if (!isVersionEditorOpen || !agent) return
    if (editingVersion) {
      setVersionForm({
        version: editingVersion.version || "1.0.0",
        description: editingVersion.description || "",
        isActive: Boolean(editingVersion.isActive),
        configJson:
          editingVersion.configJson ||
          (currentVersionSpec?.defaults as Record<string, unknown>) ||
          {},
      })
      return
    }
    setVersionForm({
      version: "1.0.0",
      description: "",
      isActive: true,
      configJson: (currentVersionSpec?.defaults as Record<string, unknown>) || {},
    })
  }, [agent, currentVersionSpec?.defaults, editingVersion, isVersionEditorOpen])

  React.useEffect(() => {
    if (initialVersionAppliedRef.current) return
    if (!initialVersionId || !versions.length) return
    const match = versions.find((item) => item.id === initialVersionId)
    if (!match) {
      initialVersionAppliedRef.current = true
      return
    }
    setEditingVersion(match)
    setIsVersionEditorOpen(true)
    initialVersionAppliedRef.current = true
  }, [initialVersionId, versions])

  const handleBack = React.useCallback(() => {
    navigate("/dashboard/agent")
  }, [navigate])

  const handleSaveAgent = React.useCallback(async () => {
    await saveAction.run(
      async () => {
        if (isCreate) {
          return (await apiClient.post("/agent/agent", {
            name: agentForm.name,
            agentClass: agentForm.agentClass,
            description: agentForm.description,
            status: Number(agentForm.status),
          })) as AgentRecord
        }
        if (!agent) throw new Error("Agent not found")
        return (await apiClient.put("/agent/agent", {
          id: agent.id,
          name: agent.name,
          agentClass: agent.agentClass,
          description: agentForm.description,
          status: Number(agentForm.status),
        })) as AgentRecord
      },
      {
        successMessage: isCreate ? "Agent created" : "Agent updated",
        errorMessage: "Failed to save agent",
        onSuccess: async (saved) => {
          await mutateAgents()
          const targetId = Number((saved as AgentRecord)?.id || agent?.id)
          if (Number.isFinite(targetId) && targetId > 0) {
            navigate(`/dashboard/agent/${targetId}`)
          }
        },
      },
    )
  }, [agent, agentForm, isCreate, mutateAgents, navigate, saveAction])

  const handleSaveVersion = React.useCallback(async () => {
    if (!agent) return
    await versionSaveAction.run(
      async () =>
        (await apiClient.post("/agent/version/save", {
          agentId: agent.id,
          version: versionForm.version,
          description: versionForm.description,
          configJson: versionForm.configJson,
          isActive: versionForm.isActive ? 1 : 0,
          id: editingVersion?.id,
        })) as AgentVersionRecord,
      {
        successMessage: editingVersion ? "Agent version updated" : "Agent version created",
        errorMessage: "Failed to save agent version",
        onSuccess: async () => {
          setIsVersionEditorOpen(false)
          setEditingVersion(null)
          await Promise.all([mutateVersions(), mutateAgents()])
        },
      },
    )
  }, [agent, editingVersion, mutateAgents, mutateVersions, versionForm, versionSaveAction])

  if (!isCreate && agentId && !agent) {
    return (
      <DetailPageLayout
        title="Agent"
        subtitle="Loading agent detail..."
        actions={
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
        }
      >
        <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
          Loading agent detail...
        </div>
      </DetailPageLayout>
    )
  }

  return (
    <DetailPageLayout
      title={isCreate ? "New Agent" : agent?.name || "Agent"}
      subtitle={
        isCreate
          ? "Create a stable agent identity first, then manage versions from the same detail page."
          : agent?.description || "Manage agent identity and versioned runtime configuration."
      }
      badge={
        !isCreate && agent ? (
          <Badge variant={agent.status === 10 ? "default" : "secondary"}>
            {agent.status === 10
              ? "Active"
              : agent.status === 20
                ? "Archived"
                : "Inactive"}
          </Badge>
        ) : undefined
      }
      actions={
        <>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
          {!isCreate && agent ? (
            <Button
              onClick={() => {
                setEditingVersion(null)
                setIsVersionEditorOpen(true)
              }}
            >
              <GitBranchPlus className="mr-2 h-4 w-4" />
              Create Version
            </Button>
          ) : null}
          <Button onClick={handleSaveAgent} disabled={saveAction.isLoading}>
            {saveAction.isLoading ? "Saving..." : isCreate ? "Create Agent" : "Save Agent"}
          </Button>
        </>
      }
      side={
        !isCreate && agent ? (
          <div className="rounded-2xl border bg-background p-4 text-sm">
            <div className="mb-2 font-medium">Identity</div>
            <div className="space-y-1 text-muted-foreground">
              <div>ID: {agent.id}</div>
              <div>Class: {agent.agentClass}</div>
              <div>Name: {agent.name}</div>
            </div>
          </div>
        ) : null
      }
    >
      <section className="space-y-4 rounded-2xl border bg-background p-5">
        <div className="text-sm font-semibold">Agent Identity</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={agentForm.name}
              onChange={(e) =>
                setAgentForm((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={!isCreate}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agentClass">Implementation Class</Label>
            <Input
              id="agentClass"
              value={agentForm.agentClass}
              onChange={(e) =>
                setAgentForm((prev) => ({ ...prev, agentClass: e.target.value }))
              }
              disabled={!isCreate}
              list="agent-class-options"
            />
            <datalist id="agent-class-options">
              {agentClassOptions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={agentForm.description}
              onChange={(e) =>
                setAgentForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="min-h-24"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Input
              id="status"
              value={agentForm.status}
              onChange={(e) =>
                setAgentForm((prev) => ({ ...prev, status: e.target.value }))
              }
            />
          </div>
        </div>
      </section>

      {!isCreate && agent ? (
        <section className="space-y-4 rounded-2xl border bg-background p-5">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Versions</div>
            <div className="text-xs text-muted-foreground">
              Prompt and config are managed per version.
            </div>
          </div>

          {versions.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              No versions yet for this agent.
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div key={version.id} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-4">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingVersion(version)
                        setIsVersionEditorOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {!isCreate && isVersionEditorOpen && agent ? (
        <section className="space-y-6 rounded-2xl border border-primary/20 bg-background p-5">
          <div className="space-y-1">
            <div className="text-sm font-semibold">
              {editingVersion ? "Edit Agent Version" : "Create Agent Version"}
            </div>
            <div className="text-xs text-muted-foreground">
              {agent.name} · {agent.agentClass}
            </div>
          </div>

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
            <div className="grid gap-2">
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

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsVersionEditorOpen(false)
                setEditingVersion(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveVersion}>Save Version</Button>
          </div>
        </section>
      ) : null}
    </DetailPageLayout>
  )
}
