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
  agentDisplay?: string
  agentVersionDisplay?: string
  agentClassDisplay?: string
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
    getJsonString(node.key) ||
    "Workflow Node"
  )
}

function normalizeWorkflowNodeModel(
  node: JsonObject,
): JsonObject {
  const normalized = cloneJson(node)
  delete normalized.kind
  delete normalized.description
  delete normalized.config
  delete normalized.input_schema
  delete normalized.output_schema
  return normalized
}

export function getLayoutMap(uiSchema: WorkflowUiSchema) {
  const layout = getJsonObject(uiSchema.layout)
  const nodes = getJsonObject(layout?.nodes)
  return (nodes || {}) as Record<string, { x: number; y: number }>
}

function getTopologicalLevels(
  nodeIds: string[],
  edges: JsonObject[],
) {
  const outgoing = new Map<string, string[]>()
  const incomingCount = new Map<string, number>()

  for (const nodeId of nodeIds) {
    outgoing.set(nodeId, [])
    incomingCount.set(nodeId, 0)
  }

  for (const edge of edges) {
    const from = getJsonString(edge.from)
    const to = getJsonString(edge.to)
    if (!nodeIds.includes(from) || !nodeIds.includes(to)) continue
    outgoing.get(from)?.push(to)
    incomingCount.set(to, (incomingCount.get(to) || 0) + 1)
  }

  const queue: string[] = nodeIds.filter((nodeId) => (incomingCount.get(nodeId) || 0) === 0)
  const levels = new Map<string, number>()

  queue.forEach((nodeId) => levels.set(nodeId, 0))

  while (queue.length > 0) {
    const current = queue.shift() as string
    const currentLevel = levels.get(current) || 0

    for (const next of outgoing.get(current) || []) {
      const nextLevel = Math.max(levels.get(next) || 0, currentLevel + 1)
      levels.set(next, nextLevel)
      incomingCount.set(next, (incomingCount.get(next) || 0) - 1)
      if ((incomingCount.get(next) || 0) === 0) {
        queue.push(next)
      }
    }
  }

  let fallbackLevel = Math.max(0, ...Array.from(levels.values()))
  for (const nodeId of nodeIds) {
    if (!levels.has(nodeId)) {
      fallbackLevel += 1
      levels.set(nodeId, fallbackLevel)
    }
  }

  return levels
}

function buildAutoLayout(
  workflowNodes: JsonObject[],
  workflowEdges: JsonObject[],
) {
  const nodeIds = workflowNodes
    .map((node, index) => getJsonString(node.key, `node_${index + 1}`))
    .filter(Boolean)
  const levels = getTopologicalLevels(nodeIds, workflowEdges)
  const grouped = new Map<number, string[]>()

  for (const nodeId of nodeIds) {
    const level = levels.get(nodeId) || 0
    grouped.set(level, [...(grouped.get(level) || []), nodeId])
  }

  const sortedLevels = Array.from(grouped.keys()).sort((a, b) => a - b)
  const layout: Record<string, { x: number; y: number }> = {}
  const nodeXStart = 300
  const nodeXGap = 320
  const nodeYStart = 80
  const nodeYGap = 220

  for (const level of sortedLevels) {
    const nodesAtLevel = grouped.get(level) || []
    const totalHeight = Math.max(0, (nodesAtLevel.length - 1) * nodeYGap)
    const levelStartY = nodeYStart + Math.max(0, 220 - totalHeight / 2)
    nodesAtLevel.forEach((nodeId, index) => {
      layout[nodeId] = {
        x: nodeXStart + level * nodeXGap,
        y: levelStartY + index * nodeYGap,
      }
    })
  }

  const maxLevel = sortedLevels.length > 0 ? Math.max(...sortedLevels) : 0
  const overallRows = Math.max(1, ...Array.from(grouped.values()).map((items) => items.length))
  const overallHeight = Math.max(0, (overallRows - 1) * nodeYGap)
  const centerY = nodeYStart + overallHeight / 2 + 110

  layout.__start__ = { x: 40, y: centerY }
  layout.__end__ = { x: nodeXStart + (maxLevel + 1) * nodeXGap, y: centerY }

  return layout
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
    JSON.stringify(edgeLike.condition || null),
    edgeLike.priority ?? "",
  ].join("::")
}

export function getEdgeLabel(model: JsonObject) {
  const edgeType = getJsonString(model.type, "direct")
  if (edgeType !== "conditional") return "direct"
  const condition = getJsonObject(model.condition)
  const field = getJsonString(condition?.field)
  const operator = getJsonString(condition?.operator, "not_null")
  return field ? `if ${field} ${operator}` : "conditional"
}

export function buildCanvasState(definition: WorkflowDefinition, uiSchema: WorkflowUiSchema) {
  const workflowNodes = (getJsonArray(definition.nodes) || []).filter(isJsonObject)
  const workflowEdges = (getJsonArray(definition.edges) || []).filter(isJsonObject)
  const explicitLayout = getLayoutMap(uiSchema)
  const autoLayout = buildAutoLayout(workflowNodes, workflowEdges)
  const layout = { ...autoLayout, ...explicitLayout }

  const nodes: Node<CanvasNodeData>[] = []

  nodes.push({
    id: "__start__",
    type: "workflowNode",
    position: layout.__start__ || { x: 40, y: 220 },
    width: 140,
    height: 64,
    data: {
      label: "START",
      special: true,
      kind: "system",
      model: { key: "__start__", type: "system" },
    },
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

  workflowNodes.forEach((node, index) => {
    const normalizedNode = normalizeWorkflowNodeModel(node)
    const nodeKey = getJsonString(normalizedNode.key, `node_${index + 1}`)
    const nodeKind = getJsonString(normalizedNode.kind, "system")
    const position = layout[nodeKey] || { x: 280 + (index % 3) * 260, y: 60 + Math.floor(index / 3) * 170 }
    const color = NODE_KIND_STYLES[nodeKind] || NODE_KIND_STYLES.system
    nodes.push({
      id: nodeKey,
      type: "workflowNode",
      position,
      width: 240,
      height: 156,
      data: {
        label: formatNodeLabel(normalizedNode),
        model: normalizedNode,
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

  nodes.push({
    id: "__end__",
    type: "workflowNode",
    position: layout.__end__ || { x: 1140, y: 220 },
    width: 140,
    height: 64,
    data: {
      label: "END",
      special: true,
      kind: "system",
      model: { key: "__end__", type: "system" },
    },
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

  const edges: Edge[] = workflowEdges.map((edge, index) => ({
    id: `${getJsonString(edge.from)}->${getJsonString(edge.to)}-${index}`,
    source: getJsonString(edge.from),
    target: getJsonString(edge.to),
    type: "smoothstep",
    label: getEdgeLabel(edge),
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
    .map((node) => {
      const model: JsonObject = {
        ...(getJsonObject(node.data.model) || {}),
        key: node.id,
      }
      delete model.kind
      delete model.description
      delete model.config
      delete model.input_schema
      delete model.output_schema
      return model
    })

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
