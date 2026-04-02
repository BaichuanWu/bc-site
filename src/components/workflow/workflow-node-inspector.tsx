"use client"

import * as React from "react"
import type { Node } from "@xyflow/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  formatNodeLabel,
  NODE_KIND_STYLES,
  SPECIAL_NODE_IDS,
  type CanvasNodeData,
} from "@/components/workflow/workflow-canvas-serializer"
import { getJsonObject, getJsonString, type JsonObject } from "@/types/json"

type AgentOption = {
  id: number
  name: string
  version?: string
  title?: string
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
  nodeKinds: Record<string, string>
  onChangeNodeId: (nextId: string) => void
  onUpdateNode: (patch: (node: Node<CanvasNodeData>) => Node<CanvasNodeData>) => void
  onCreateEdge: (targetNodeId: string) => void
}

export function WorkflowNodeInspector({
  node,
  nodes,
  edges,
  availableAgents,
  nodeKinds,
  onChangeNodeId,
  onUpdateNode,
  onCreateEdge,
}: WorkflowNodeInspectorProps) {
  const model = getJsonObject(node.data.model) || {}
  const connectableNodes = React.useMemo(
    () => nodes.filter((item) => !SPECIAL_NODE_IDS.has(item.id) && item.id !== node.id),
    [node.id, nodes]
  )
  const outgoingTargets = React.useMemo(
    () => new Set(edges.filter((edge) => edge.source === node.id).map((edge) => edge.target)),
    [edges, node.id]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{SPECIAL_NODE_IDS.has(node.id) ? "special" : "node"}</Badge>
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
            <Label>Agent</Label>
            <Select
              value={
                availableAgents.some(
                  (agent) =>
                    agent.name === getJsonString(model.agent_name) &&
                    (agent.version || "1.0.0") === getJsonString(model.agent_version, "1.0.0")
                )
                  ? `${getJsonString(model.agent_name)}@@${getJsonString(model.agent_version, "1.0.0")}`
                  : "__custom__"
              }
              onValueChange={(value) => {
                if (value === "__custom__") return
                const [agentName, agentVersion] = value.split("@@")
                onUpdateNode((current) => ({
                  ...current,
                  data: {
                    ...current.data,
                    model: {
                      ...current.data.model,
                      agent_name: agentName,
                      agent_version: agentVersion || "1.0.0",
                    },
                  },
                }))
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select an existing agent" /></SelectTrigger>
              <SelectContent>
                {availableAgents.map((agent) => (
                  <SelectItem
                    key={`${agent.name}@@${agent.version || "1.0.0"}`}
                    value={`${agent.name}@@${agent.version || "1.0.0"}`}
                  >
                    {agent.name} ({agent.version || "1.0.0"})
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Custom / manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Agent Name</Label>
            <Input
              value={getJsonString(model.agent_name)}
              onChange={(e) =>
                onUpdateNode((current) => ({
                  ...current,
                  data: {
                    ...current.data,
                    model: { ...current.data.model, agent_name: e.target.value },
                  },
                }))
              }
              placeholder="Manual override"
            />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Version</Label>
              <Input
                value={getJsonString(model.agent_version)}
                onChange={(e) =>
                  onUpdateNode((current) => ({
                    ...current,
                    data: {
                      ...current.data,
                      model: { ...current.data.model, agent_version: e.target.value },
                    },
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Kind</Label>
              <Select
                value={getJsonString(model.kind, "system")}
                onValueChange={(value) =>
                  onUpdateNode((current) => ({
                    ...current,
                    data: {
                      ...current.data,
                      kind: value,
                      model: { ...current.data.model, kind: value },
                    },
                    style: {
                      ...(current.style || {}),
                      border: `1px solid ${(NODE_KIND_STYLES[value] || NODE_KIND_STYLES.system)}55`,
                      background: `${NODE_KIND_STYLES[value] || NODE_KIND_STYLES.system}12`,
                      boxShadow: `0 8px 24px ${(NODE_KIND_STYLES[value] || NODE_KIND_STYLES.system)}18`,
                    },
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(nodeKinds).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea
              value={getJsonString(model.description)}
              onChange={(e) =>
                onUpdateNode((current) => ({
                  ...current,
                  data: {
                    ...current.data,
                    label: e.target.value || formatNodeLabel(current.data.model || {}),
                    model: { ...current.data.model, description: e.target.value },
                  },
                }))
              }
              className="min-h-[88px]"
            />
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
                    data: { ...current.data, model: { ...current.data.model, input_mapping: nextValue } },
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
                    data: { ...current.data, model: { ...current.data.model, output_mapping: nextValue } },
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
                            {getJsonString(getJsonObject(candidate.data.model)?.agent_name) || "Manual node"}
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

            {outgoingTargets.size > 0 && (
              <div className="flex flex-wrap gap-2">
                {Array.from(outgoingTargets).map((target) => (
                  <Badge key={target} variant="outline" data-testid="workflow-outgoing-edge">
                    {target}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-xl border bg-background/70 p-3 text-xs text-muted-foreground">
          Special nodes are generated from workflow edges and only store layout metadata.
        </div>
      )}
    </div>
  )
}
