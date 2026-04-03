import { addEdge, MarkerType, type Connection, type Edge } from "@xyflow/react"

export function validateWorkflowConnection(connection: Connection, edges: Edge[]) {
  if (!connection.source || !connection.target) return "Incomplete edge connection."
  if (connection.source === connection.target) {
    return "Self-loop edges are not allowed."
  }
  if (connection.target === "__start__") {
    return "No edge can target START."
  }
  if (connection.source === "__end__") {
    return "END cannot create outgoing edges."
  }
  if (edges.some((edge) => edge.source === connection.source && edge.target === connection.target)) {
    return "This edge already exists."
  }
  return null
}

export function addDefaultWorkflowEdge(connection: Connection, edges: Edge[]) {
  return addEdge(
    {
      ...connection,
      id: `${connection.source}->${connection.target}-${Date.now()}`,
      type: "smoothstep",
      label: "direct",
      data: { model: { from: connection.source, to: connection.target, type: "direct" } },
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    edges
  )
}
