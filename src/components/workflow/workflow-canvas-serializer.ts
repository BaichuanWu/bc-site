import {
  MarkerType,
  Position,
  type Edge,
  type Node,
} from "@xyflow/react"
import {
  getJsonArray,
  getJsonObject,
  getJsonString,
  isJsonObject,
  type JsonObject,
} from "@/types/json"

export type WorkflowDefinition = JsonObject
export type WorkflowUiSchema = JsonObject

export type CanvasNodeData = {
  label: string
  model?: JsonObject
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

export function formatNodeLabel(node: JsonObject) {
  return (
    getJsonString(node.description) ||
    getJsonString(node.agent_name) ||
    getJsonString(node.key) ||
    "Workflow Node"
  )
}

export function getLayoutMap(uiSchema: WorkflowUiSchema) {
  const layout = getJsonObject(uiSchema.layout)
  const nodes = getJsonObject(layout?.nodes)
  return (nodes || {}) as Record<string, { x: number; y: number }>
}

export function getEdgeModel(edge: Edge | null | undefined): JsonObject {
  return (edge?.data?.model || {}) as JsonObject
}

export function getEdgeFingerprint(edgeLike: JsonObject | null | undefined) {
  if (!edgeLike) return ""
  return [
    edgeLike.from || edgeLike.source || "",
    edgeLike.to || edgeLike.target || "",
    edgeLike.type || "direct",
    edgeLike.router || "",
  ].join("::")
}

export function buildCanvasState(definition: WorkflowDefinition, uiSchema: WorkflowUiSchema) {
  const workflowNodes = (getJsonArray(definition.nodes) || []).filter(isJsonObject)
  const workflowEdges = (getJsonArray(definition.edges) || []).filter(isJsonObject)
  const layout = getLayoutMap(uiSchema)

  const specialNodeIds = new Set<string>()
  workflowEdges.forEach((edge) => {
    if (getJsonString(edge.from) === "__start__") specialNodeIds.add("__start__")
    if (getJsonString(edge.to) === "__end__") specialNodeIds.add("__end__")
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
    const nodeKey = getJsonString(node.key, `node_${index + 1}`)
    const nodeKind = getJsonString(node.kind, "system")
    const position = layout[nodeKey] || { x: 280 + (index % 3) * 260, y: 60 + Math.floor(index / 3) * 170 }
    const color = NODE_KIND_STYLES[nodeKind] || NODE_KIND_STYLES.system
    nodes.push({
      id: nodeKey,
      type: "workflowNode",
      position,
      width: 240,
      height: 156,
      data: {
        label: formatNodeLabel(node),
        model: cloneJson(node),
        kind: nodeKind,
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
    id: `${getJsonString(edge.from)}->${getJsonString(edge.to)}-${index}`,
    source: getJsonString(edge.from),
    target: getJsonString(edge.to),
    type: "smoothstep",
    label:
      getJsonString(edge.type) === "conditional"
        ? `conditional${getJsonString(edge.router) ? `:${getJsonString(edge.router)}` : ""}`
        : "direct",
    data: {
      model: cloneJson(edge),
    },
    animated: getJsonString(edge.type) === "conditional",
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
      ...(getJsonObject(node.data.model) || {}),
      key: node.id,
      kind: node.data.kind || getJsonString(getJsonObject(node.data.model)?.kind, "system"),
      description: getJsonString(getJsonObject(node.data.model)?.description),
    }))

  nextDefinition.edges = edges.map((edge) => ({
    ...getEdgeModel(edge),
    from: edge.source,
    to: edge.target,
    type: getJsonString(getEdgeModel(edge).type, "direct"),
  }))

  const nextUiSchema = cloneJson(uiSchema || {})
  const nextLayout = {
    ...(getJsonObject(nextUiSchema.layout) || {}),
    nodes: {} as Record<string, { x: number; y: number }>,
  }
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
