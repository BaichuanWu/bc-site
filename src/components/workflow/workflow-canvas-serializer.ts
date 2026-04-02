import {
  MarkerType,
  Position,
  type Edge,
  type Node,
} from "@xyflow/react"

export type WorkflowDefinition = Record<string, any>
export type WorkflowUiSchema = Record<string, any>

export type CanvasNodeData = {
  label: string
  model?: Record<string, any>
  special?: boolean
  kind?: string
}

export const SPECIAL_NODE_IDS = new Set(["__start__", "__end__"])

export const NODE_KIND_STYLES: Record<string, string> = {
  system: "#0f172a",
  llm: "#1d4ed8",
  tool: "#7c3aed",
  workflow: "#0f766e",
}

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

export function formatNodeLabel(node: Record<string, any>) {
  return node?.description || node?.agent_name || node?.key || "Workflow Node"
}

export function getLayoutMap(uiSchema: WorkflowUiSchema) {
  return (uiSchema?.layout?.nodes || {}) as Record<string, { x: number; y: number }>
}

export function getEdgeModel(edge: Edge | null | undefined): Record<string, any> {
  return (edge?.data?.model || {}) as Record<string, any>
}

export function getEdgeFingerprint(edgeLike: Record<string, any> | null | undefined) {
  if (!edgeLike) return ""
  return [
    edgeLike.from || edgeLike.source || "",
    edgeLike.to || edgeLike.target || "",
    edgeLike.type || "direct",
    edgeLike.router || "",
  ].join("::")
}

export function buildCanvasState(definition: WorkflowDefinition, uiSchema: WorkflowUiSchema) {
  const workflowNodes = Array.isArray(definition?.nodes) ? definition.nodes : []
  const workflowEdges = Array.isArray(definition?.edges) ? definition.edges : []
  const layout = getLayoutMap(uiSchema)

  const specialNodeIds = new Set<string>()
  workflowEdges.forEach((edge) => {
    if (edge?.from === "__start__") specialNodeIds.add("__start__")
    if (edge?.to === "__end__") specialNodeIds.add("__end__")
  })

  const nodes: Node<CanvasNodeData>[] = []

  if (specialNodeIds.has("__start__")) {
    nodes.push({
      id: "__start__",
      type: "workflowNode",
      position: layout.__start__ || { x: 40, y: 220 },
      width: 140,
      height: 64,
      data: { label: "START", special: true, kind: "system" },
      draggable: true,
      selectable: true,
      style: {
        width: 140,
        height: 64,
        borderRadius: 18,
        border: "1px dashed rgba(148, 163, 184, 0.5)",
        background: "rgba(15, 23, 42, 0.92)",
        color: "white",
      },
      sourcePosition: Position.Right,
    })
  }

  workflowNodes.forEach((node, index) => {
    const position = layout[node.key] || { x: 280 + (index % 3) * 260, y: 60 + Math.floor(index / 3) * 170 }
    const color = NODE_KIND_STYLES[node.kind || "system"] || NODE_KIND_STYLES.system
    nodes.push({
      id: node.key,
      type: "workflowNode",
      position,
      width: 240,
      height: 156,
      data: {
        label: formatNodeLabel(node),
        model: cloneJson(node),
        kind: node.kind || "system",
      },
      style: {
        width: 240,
        height: 156,
        borderRadius: 20,
        border: `1px solid ${color}55`,
        background: `${color}12`,
        color: "var(--foreground)",
        boxShadow: `0 8px 24px ${color}18`,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    })
  })

  if (specialNodeIds.has("__end__")) {
    nodes.push({
      id: "__end__",
      type: "workflowNode",
      position: layout.__end__ || { x: 1140, y: 220 },
      width: 140,
      height: 64,
      data: { label: "END", special: true, kind: "system" },
      draggable: true,
      selectable: true,
      style: {
        width: 140,
        height: 64,
        borderRadius: 18,
        border: "1px dashed rgba(148, 163, 184, 0.5)",
        background: "rgba(15, 23, 42, 0.92)",
        color: "white",
      },
      targetPosition: Position.Left,
    })
  }

  const edges: Edge[] = workflowEdges.map((edge, index) => ({
    id: `${edge.from}->${edge.to}-${index}`,
    source: edge.from,
    target: edge.to,
    type: "smoothstep",
    label: edge.type === "conditional" ? `conditional${edge.router ? `:${edge.router}` : ""}` : "direct",
    data: {
      model: cloneJson(edge),
    },
    animated: edge.type === "conditional",
    markerEnd: { type: MarkerType.ArrowClosed },
  }))

  return { nodes, edges }
}

export function buildDefinitionFromCanvas(
  definition: WorkflowDefinition,
  uiSchema: WorkflowUiSchema,
  nodes: Node<CanvasNodeData>[],
  edges: Edge[],
) {
  const nextDefinition = cloneJson(definition || {})
  nextDefinition.nodes = nodes
    .filter((node) => !SPECIAL_NODE_IDS.has(node.id))
    .map((node) => ({
      ...(node.data.model || {}),
      key: node.id,
      kind: node.data.kind || node.data.model?.kind || "system",
      description: node.data.model?.description || "",
    }))

  nextDefinition.edges = edges.map((edge) => ({
    ...getEdgeModel(edge),
    from: edge.source,
    to: edge.target,
    type: getEdgeModel(edge).type || "direct",
  }))

  const nextUiSchema = cloneJson(uiSchema || {})
  const nextLayout = { ...(nextUiSchema.layout || {}), nodes: {} as Record<string, { x: number; y: number }> }
  nodes.forEach((node) => {
    nextLayout.nodes[node.id] = {
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
    }
  })
  nextUiSchema.layout = nextLayout

  return {
    definition: nextDefinition,
    uiSchema: nextUiSchema,
  }
}
