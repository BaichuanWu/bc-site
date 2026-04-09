"use client"

import * as React from "react"
import type { Node } from "@xyflow/react"
import useSWR from "swr"

import { apiClient } from "@/lib/api"
import { normalizeCrudListResponse } from "@/lib/crud-response"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  SPECIAL_NODE_IDS,
  type CanvasNodeData,
} from "@/components/workflow/canvas/serializer"
import { getJsonObject, type JsonObject } from "@/types/json"

type AgentOption = {
  id: number
  agentId: number
  name: string
  version: string
  agentClass: string
  configJson?: Record<string, unknown>
  description?: string
  versionDescription?: string
}

type AgentVersionRecord = {
  id: number
  agentId: number
  version: string
  description?: string
  configJson?: Record<string, unknown>
  isActive?: number
}

type WorkflowNodeInspectorProps = {
  node: Node<CanvasNodeData>
  nodes: Node<CanvasNodeData>[]
  edges: Array<{
    source: string
    target: string
    data?: { model?: JsonObject }
  }>
  availableAgents: AgentOption[]
  onEditAgentVersion?: (agent: AgentOption, nodeKey: string) => void
  onChangeNodeId: (nextId: string) => void
  onUpdateNode: (patch: (node: Node<CanvasNodeData>) => Node<CanvasNodeData>) => void
  onCreateEdge: (targetNodeId: string) => void
}

export function WorkflowNodeInspector({
  node,
  nodes,
  edges,
  availableAgents,
  onEditAgentVersion,
  onChangeNodeId,
  onUpdateNode,
  onCreateEdge,
}: WorkflowNodeInspectorProps) {
  const model = getJsonObject(node.data.model) || {}
  const [isAgentPickerOpen, setIsAgentPickerOpen] = React.useState(false)
  const [agentSearch, setAgentSearch] = React.useState("")

  const selectedAgentFromActive = React.useMemo(
    () =>
      availableAgents.find((agent) => agent.id === Number(model.agent_version_id)) ||
      null,
    [availableAgents, model.agent_version_id],
  )
  const selectedAgentIdentityId = selectedAgentFromActive?.agentId ?? null
  const { data: agentVersions = [], isLoading: isLoadingVersions } = useSWR<
    AgentVersionRecord[]
  >(
    selectedAgentIdentityId ? `/agent/agent/${selectedAgentIdentityId}/versions` : null,
    (url: string) =>
      apiClient
        .get(url)
        .then((res: unknown) => normalizeCrudListResponse<AgentVersionRecord>(res)),
  )

  const selectedVersionRecord = React.useMemo(
    () =>
      agentVersions.find((version) => version.id === Number(model.agent_version_id)) ||
      null,
    [agentVersions, model.agent_version_id],
  )

  const selectedAgent = React.useMemo(() => {
    if (selectedAgentFromActive) return selectedAgentFromActive
    if (!selectedVersionRecord) return null
    const identity =
      availableAgents.find((agent) => agent.agentId === selectedVersionRecord.agentId) ||
      null
    if (!identity) return null
    return {
      ...identity,
      id: selectedVersionRecord.id,
      version: selectedVersionRecord.version,
      versionDescription:
        selectedVersionRecord.description || identity.versionDescription,
      configJson: selectedVersionRecord.configJson || identity.configJson,
    }
  }, [availableAgents, selectedAgentFromActive, selectedVersionRecord])

  const agentOptionsByIdentity = React.useMemo(() => {
    const unique = new Map<number, AgentOption>()
    for (const agent of availableAgents) {
      if (!unique.has(agent.agentId)) {
        unique.set(agent.agentId, agent)
      }
    }
    return Array.from(unique.values())
  }, [availableAgents])

  const filteredAgentIdentities = React.useMemo(() => {
    const keyword = agentSearch.trim().toLowerCase()
    if (!keyword) return agentOptionsByIdentity
    return agentOptionsByIdentity.filter((agent) =>
      [agent.name, agent.agentClass, agent.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    )
  }, [agentOptionsByIdentity, agentSearch])

  const connectableNodes = React.useMemo(
    () => nodes.filter((item) => !SPECIAL_NODE_IDS.has(item.id) && item.id !== node.id),
    [node.id, nodes],
  )
  const outgoingTargets = React.useMemo(
    () => new Set(edges.filter((edge) => edge.source === node.id).map((edge) => edge.target)),
    [edges, node.id],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {SPECIAL_NODE_IDS.has(node.id) ? "special" : "node"}
        </Badge>
        <span className="text-sm font-medium">{node.id}</span>
      </div>

      {!SPECIAL_NODE_IDS.has(node.id) ? (
        <>
          <div className="grid gap-2">
            <Label>Node Key</Label>
            <Input
              value={node.id}
              onChange={(e) => {
                const nextId = e.target.value.trim()
                if (!nextId || SPECIAL_NODE_IDS.has(nextId)) return
                onChangeNodeId(nextId)
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label>Agent Binding</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-w-0 flex-1 justify-between"
                onClick={() => setIsAgentPickerOpen(true)}
              >
                <span className="truncate">
                  {selectedAgent
                    ? `${selectedAgent.name} @ ${selectedAgent.version}`
                    : "Search and choose agent"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedAgent
                    ? `#${selectedAgent.id}`
                    : isLoadingVersions
                      ? "Loading"
                      : "Search"}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => selectedAgent && onEditAgentVersion?.(selectedAgent, node.id)}
                disabled={!selectedAgent || !onEditAgentVersion}
              >
                Open Detail
              </Button>
            </div>
            {selectedAgent ? (
              <div className="text-xs text-muted-foreground">
                Bound by `agent_version_id={selectedAgent.id}`. Use search to replace the agent binding.
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Input Mapping JSON</Label>
            <Textarea
              value={JSON.stringify(getJsonObject(model.input_mapping) || {}, null, 2)}
              onChange={(e) => {
                try {
                  const nextValue = JSON.parse(e.target.value || "{}")
                  onUpdateNode((current) => ({
                    ...current,
                    data: {
                      ...current.data,
                      model: { ...current.data.model, input_mapping: nextValue },
                    },
                  }))
                } catch {}
              }}
              className="min-h-[120px] font-mono text-xs"
            />
          </div>

          <div className="grid gap-2">
            <Label>Output Mapping JSON</Label>
            <Textarea
              value={JSON.stringify(getJsonObject(model.output_mapping) || {}, null, 2)}
              onChange={(e) => {
                try {
                  const nextValue = JSON.parse(e.target.value || "{}")
                  onUpdateNode((current) => ({
                    ...current,
                    data: {
                      ...current.data,
                      model: { ...current.data.model, output_mapping: nextValue },
                    },
                  }))
                } catch {}
              }}
              className="min-h-[120px] font-mono text-xs"
            />
          </div>

          <div className="grid gap-3 rounded-2xl border bg-background/70 p-3">
            <div>
              <div className="text-sm font-medium">Connections</div>
              <div className="text-xs text-muted-foreground">
                Drag from the node handles on the canvas, or add a downstream edge here.
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Connect To</Label>
              <div className="grid gap-2">
                {connectableNodes.length === 0 ? (
                  <div className="rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    No other nodes are available to connect.
                  </div>
                ) : (
                  connectableNodes.map((candidate) => {
                    const isLinked = outgoingTargets.has(candidate.id)
                    return (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between gap-3 rounded-xl border bg-background/70 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{candidate.id}</div>
                          <div className="text-xs text-muted-foreground">
                            {String(
                              getJsonObject(candidate.data.model)?.agent_version_id || "Unbound",
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant={isLinked ? "secondary" : "outline"}
                          size="sm"
                          disabled={isLinked}
                          onClick={() => onCreateEdge(candidate.id)}
                        >
                          {isLinked ? "Linked" : "Add Edge"}
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {outgoingTargets.size > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Array.from(outgoingTargets).map((target) => (
                  <Badge key={target} variant="outline" data-testid="workflow-outgoing-edge">
                    {target}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="rounded-xl border bg-background/70 p-3 text-xs text-muted-foreground">
          START and END are built-in workflow system nodes. You can reposition them on the
          canvas, and connect edges to them, but they do not have editable binding fields.
        </div>
      )}

      <Dialog open={isAgentPickerOpen} onOpenChange={setIsAgentPickerOpen}>
        <DialogContent className="max-h-[min(720px,calc(100vh-2rem))] max-w-[760px] overflow-hidden p-0">
          <DialogHeader>
            <div className="px-6 pt-6">
              <DialogTitle>Search Agent</DialogTitle>
              <DialogDescription>
                Search agent identities, then bind the current active version to this node.
                Detailed prompt and config editing lives on the agent detail page.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-6">
            <Input
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              placeholder="Search agents by name, class, or description"
            />
            <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-xl border bg-muted/10 p-3">
              {filteredAgentIdentities.length > 0 ? (
                filteredAgentIdentities.map((agent) => (
                  <button
                    key={agent.agentId}
                    type="button"
                    onClick={() => {
                      onUpdateNode((current) => ({
                        ...current,
                        data: {
                          ...current.data,
                          model: {
                            ...current.data.model,
                            agent_version_id: agent.id,
                          },
                        },
                      }))
                      setIsAgentPickerOpen(false)
                    }}
                    className="flex w-full min-w-0 items-start justify-between gap-3 rounded-xl border bg-background px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="truncate text-sm font-semibold">{agent.name}</div>
                      <div className="line-clamp-2 break-words text-xs text-muted-foreground">
                        {agent.description || agent.agentClass}
                      </div>
                    </div>
                    <div className="flex max-w-[45%] shrink-0 flex-wrap items-center justify-end gap-2">
                      <Badge variant="outline" className="max-w-full truncate">
                        {agent.agentClass}
                      </Badge>
                      <Badge variant="secondary" className="max-w-full truncate">
                        current {agent.version}
                      </Badge>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-dashed bg-background/70 p-6 text-sm text-muted-foreground">
                  No agents matched your search.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
