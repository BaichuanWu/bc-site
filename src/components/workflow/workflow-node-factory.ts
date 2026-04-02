"use client"

import type { Node } from "@xyflow/react"

import {
  NODE_KIND_STYLES,
  type CanvasNodeData,
} from "@/components/workflow/workflow-canvas-serializer"

type AgentOption = {
  name: string
  version?: string
  title?: string
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
  const description = agent?.title || agent?.name || "New Workflow Node"
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
        agent_name: agent?.name || "",
        agent_version: agent?.version || "1.0.0",
        kind,
        description,
        input_mapping: {},
        output_mapping: {},
        config: {},
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
