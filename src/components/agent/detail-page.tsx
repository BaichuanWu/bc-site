"use client"

import * as React from "react"
import useSWR from "swr"
import { GitBranchPlus } from "lucide-react"

import type { AgentConfigSpec } from "@/components/agent/config/editor"
import { AgentIdentitySection } from "@/components/agent/identity-section"
import { AgentVersionEditor } from "@/components/agent/version-editor"
import { AgentVersionsSection } from "@/components/agent/versions-section"
import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { Button } from "@/components/ui/button"
import { useAsyncAction } from "@/hooks/use-async-action"
import { apiClient, fetcher } from "@/lib/api"
import { useWorkspaceTabs } from "@/components/workspace/workspace-tabs-provider"
import { normalizeCrudListResponse } from "@/lib/crud-response"
import {
  EMPTY_AGENT_FORM,
  agentFormToCreatePayload,
  agentFormToUpdatePayload,
  agentRecordToForm,
  defaultVersionForm,
  versionFormToSavePayload,
  versionRecordToForm,
  type AgentFormState,
  type AgentOptionsResponse,
  type AgentRecord,
  type AgentVersionRecord,
  type VersionFormState,
} from "@/lib/agent"

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
  const { currentPathname, updateTabMeta, closeTab } = useWorkspaceTabs()
  const saveAction = useAsyncAction()
  const versionSaveAction = useAsyncAction()
  const isCreate = props.mode === "create"
  const agentId = props.mode === "edit" ? props.agentId : null
  const initialVersionId = props.mode === "edit" ? props.initialVersionId : undefined
  const initialVersionAppliedRef = React.useRef(false)

  const {
    data: agent,
    mutate: mutateAgent,
    isLoading: isLoadingAgent,
  } = useSWR<AgentRecord | null>(
    agentId ? `/agent/agent?q=${encodeURIComponent(JSON.stringify({ id: agentId }))}&limit=1` : null,
    async (url: string) => {
      const response = await fetcher<unknown>(url)
      return normalizeCrudListResponse<AgentRecord>(response)[0] || null
    },
  )
  const { data: agentOptions } = useSWR<AgentOptionsResponse<AgentConfigSpec>>(
    "/agent/options",
    fetcher,
  )
  const { data: versions = [], mutate: mutateVersions } = useSWR<AgentVersionRecord[]>(
    agentId ? `/agent/agent/${agentId}/versions` : null,
    async (url: string) => {
      const response = await fetcher<unknown>(url)
      return normalizeCrudListResponse<AgentVersionRecord>(response)
    },
  )

  const agentClassOptions = React.useMemo(
    () => agentOptions?.agentClasses ?? [],
    [agentOptions?.agentClasses],
  )
  const currentVersionSpec =
    agent && agentOptions?.configSpecs
      ? agentOptions.configSpecs[agent.agentClass] || null
      : null

  const [agentForm, setAgentForm] = React.useState<AgentFormState>(EMPTY_AGENT_FORM)
  const [editingVersion, setEditingVersion] =
    React.useState<AgentVersionRecord | null>(null)
  const [isVersionEditorOpen, setIsVersionEditorOpen] = React.useState(false)
  const [versionForm, setVersionForm] = React.useState<VersionFormState>(
    defaultVersionForm(),
  )

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
    setAgentForm(agentRecordToForm(agent))
    updateTabMeta(`/dashboard/agent/${agent.id}`, {
      title: `Agent: ${agent.name || `#${agent.id}`}`,
    })
  }, [agent, agentClassOptions, isCreate, updateTabMeta])

  React.useEffect(() => {
    if (!isVersionEditorOpen || !agent) return
    if (editingVersion) {
      setVersionForm(
        versionRecordToForm(
          editingVersion,
          currentVersionSpec?.defaults as Record<string, unknown> | undefined,
        ),
      )
      return
    }
    setVersionForm(
      defaultVersionForm(
        currentVersionSpec?.defaults as Record<string, unknown> | undefined,
      ),
    )
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

  const handleSaveAgent = React.useCallback(async () => {
    await saveAction.run(
      async () => {
        if (isCreate) {
          return (await apiClient.post(
            "/agent/agent",
            agentFormToCreatePayload(agentForm),
          )) as AgentRecord
        }
        if (!agent) throw new Error("Agent not found")
        return (await apiClient.put(
          "/agent/agent",
          agentFormToUpdatePayload(agent, agentForm),
        )) as AgentRecord
      },
      {
        successMessage: isCreate ? "Agent created" : "Agent updated",
        errorMessage: "Failed to save agent",
        onSuccess: async () => {
          await mutateAgent()
          closeTab(currentPathname)
        },
      },
    )
  }, [agent, agentForm, closeTab, currentPathname, isCreate, mutateAgent, saveAction])

  const handleSaveVersion = React.useCallback(async () => {
    if (!agent) return
    await versionSaveAction.run(
      async () =>
        (await apiClient.post(
          "/agent/version/save",
          versionFormToSavePayload({
            agent,
            form: versionForm,
            editingVersion,
          }),
        )) as AgentVersionRecord,
      {
        successMessage: editingVersion ? "Agent version updated" : "Agent version created",
        errorMessage: "Failed to save agent version",
        onSuccess: async () => {
          setIsVersionEditorOpen(false)
          setEditingVersion(null)
          await Promise.all([mutateVersions(), mutateAgent()])
        },
      },
    )
  }, [agent, editingVersion, mutateAgent, mutateVersions, versionForm, versionSaveAction])

  if (!isCreate && agentId && isLoadingAgent) {
    return (
      <DetailPageLayout
        title="Agent"
        subtitle="Loading agent detail..."
      >
        <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
          Loading agent detail...
        </div>
      </DetailPageLayout>
    )
  }

  if (!isCreate && agentId && !agent) {
    return (
      <DetailPageLayout
        title="Agent"
        subtitle="Agent detail could not be loaded."
      >
        <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
          Agent not found or response payload was empty.
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
      actions={
        <>
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
            {saveAction.isLoading ? "Saving..." : "Save Agent"}
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
      <AgentIdentitySection
        form={agentForm}
        agentClassOptions={agentClassOptions}
        isCreate={isCreate}
        onChange={setAgentForm}
      />

      {!isCreate && agent ? (
        <AgentVersionsSection
          versions={versions}
          onEdit={(version) => {
            setEditingVersion(version)
            setIsVersionEditorOpen(true)
          }}
        />
      ) : null}

      {!isCreate && isVersionEditorOpen && agent ? (
        <AgentVersionEditor
          agent={agent}
          editingVersion={editingVersion}
          form={versionForm}
          spec={currentVersionSpec}
          onChange={setVersionForm}
          onCancel={() => {
            setIsVersionEditorOpen(false)
            setEditingVersion(null)
          }}
          onSave={handleSaveVersion}
        />
      ) : null}
    </DetailPageLayout>
  )
}
