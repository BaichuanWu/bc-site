"use client"

import * as React from "react"
import { Background, Controls, MarkerType, ReactFlow, type Edge, type Node } from "@xyflow/react"

import type { WorkflowInstance } from "@/lib/workflow-instances"

const STATUS_COLORS: Record<string, string> = {
  approved: "#16a34a",
  waiting_approval: "#d97706",
  running: "#2563eb",
  failed: "#dc2626",
  invalidated: "#9333ea",
  skipped: "#94a3b8",
}

export function WorkflowInstanceGraph({ instance, selected, onSelect }: {
  instance: WorkflowInstance
  selected: string
  onSelect: (key: string) => void
}) {
  const { nodes, edges } = React.useMemo(() => {
    const keys = instance.definitionJson.nodes.map((node) => node.key)
    const levels = new Map(keys.map((key) => [key, 0]))
    for (let pass = 0; pass < keys.length; pass += 1) {
      for (const edge of instance.definitionJson.edges) {
        if (!levels.has(edge.from) || !levels.has(edge.to)) continue
        levels.set(edge.to, Math.max(levels.get(edge.to) || 0, (levels.get(edge.from) || 0) + 1))
      }
    }
    const lanes = new Map<number, number>()
    const nodes: Node[] = keys.map((key) => {
      const level = levels.get(key) || 0
      const lane = lanes.get(level) || 0
      lanes.set(level, lane + 1)
      const status = instance.nodesJson[key]?.status || "pending"
      return {
        id: key, position: { x: level * 230, y: lane * 110 },
        data: { label: `${key} · ${status}` },
        style: {
          width: 190, border: `2px solid ${STATUS_COLORS[status] || "#64748b"}`,
          borderRadius: 10, padding: 8, background: selected === key ? "#e2e8f0" : "#fff",
          color: "#0f172a", fontSize: 12,
        },
      }
    })
    const edges: Edge[] = instance.definitionJson.edges
      .filter((edge) => levels.has(edge.from) && levels.has(edge.to))
      .map((edge, index) => ({
        id: `${edge.from}-${edge.to}-${index}`, source: edge.from, target: edge.to,
        label: edge.type === "conditional" ? "condition" : undefined,
        markerEnd: { type: MarkerType.ArrowClosed },
      }))
    return { nodes, edges }
  }, [instance.definitionJson, instance.nodesJson, selected])

  return <div className="h-72 rounded-lg border bg-muted/10">
    <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} nodesConnectable={false} elementsSelectable onNodeClick={(_, node) => onSelect(node.id)}>
      <Background /><Controls showInteractive={false} />
    </ReactFlow>
  </div>
}
