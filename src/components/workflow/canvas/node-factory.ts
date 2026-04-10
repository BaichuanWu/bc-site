"use client"

import type { Node } from "@xyflow/react"

import {
  NODE_KIND_STYLES,
  type CanvasNodeData,
} from "@/components/workflow/canvas/serializer"

type AgentOption = {
  id: number
  agentId?: number
  name: string
  version: string
  description?: string
}

export function inferWorkflowNodeKind(agent?: AgentOption) {
  return /strateg|assembl|reflect|prompt|llm/i.test(agent?.name || "") ? "llm" : "system"
}

export function createWorkflowNodeFromAgent(
  index: number,
  agent?: AgentOption
): Node<CanvasNodeData> {
  const normalizedName = (agent?.name || `node_${index}`).replace(/[^a-zA-Z0-9_]+/g, "_")
  const id = `${normalizedName}_${index}`.toLowerCase()
  const kind = inferWorkflowNodeKind(agent)
  const description = agent?.name || "New Workflow Node"
  const color = NODE_KIND_STYLES[kind] || NODE_KIND_STYLES.system

  return {
    id,
    type: "workflowNode",
    position: { x: 280 + (index % 3) * 320, y: 90 + Math.floor(index / 3) * 220 },
    width: 240,
    height: 156,
    data: {
      label: description,
      kind,
      model: {
        key: id,
        type: "agent",
        agent_id: agent?.agentId || agent?.id || null,
        input_mapping: {},
        output_mapping: {},
      },
    },
    style: {
      width: 240,
      height: 156,
      borderRadius: 20,
      border: `1px solid ${color}55`,
      background: `${color}12`,
      boxShadow: `0 8px 24px ${color}18`,
    },
  }
}
