"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  useReactFlow,
} from "@xyflow/react"
import { Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDefaultWorkflowEdge, validateWorkflowConnection } from "@/components/workflow/workflow-edge-rules"
import { WorkflowEdgeInspector } from "@/components/workflow/workflow-edge-inspector"
import { createWorkflowNodeFromAgent } from "@/components/workflow/workflow-node-factory"
import {
  buildCanvasState,
  buildDefinitionFromCanvas,
  CanvasNodeData,
  cloneJson,
  getEdgeFingerprint,
  SPECIAL_NODE_IDS,
  type WorkflowDefinition,
  type WorkflowUiSchema,
} from "@/components/workflow/workflow-canvas-serializer"
import { WorkflowDisplayNode } from "@/components/workflow/workflow-display-node"
import { WorkflowNodeInspector } from "@/components/workflow/workflow-node-inspector"
import { WorkflowNodePickerDialog } from "@/components/workflow/workflow-node-picker-dialog"
import { getJsonObject, getJsonString, type JsonObject } from "@/types/json"

type WorkflowCanvasEditorProps = {
  definition: WorkflowDefinition
  uiSchema: WorkflowUiSchema
  onDefinitionChange: (value: WorkflowDefinition) => void
  onUiSchemaChange: (value: WorkflowUiSchema) => void
  availableAgents?: Array<{
    id: number
    name: string
    version?: string
    title?: string
  }>
  agentSearch?: string
  onAgentSearchChange?: (value: string) => void
  isLoadingAgents?: boolean
  availableRouters?: string[]
  nodeKinds?: Record<string, string>
  preview?: {
    warnings?: string[]
    invalid_edges?: Record<string, unknown>[]
  } | null
}

const nodeTypes = {
  workflowNode: WorkflowDisplayNode,
}

function WorkflowCanvasEditorInner({
  definition,
  uiSchema,
  onDefinitionChange,
  onUiSchemaChange,
  availableAgents = [],
  agentSearch = "",
  onAgentSearchChange,
  isLoadingAgents = false,
  availableRouters = [],
  nodeKinds = {},
  preview = null,
}: WorkflowCanvasEditorProps) {
  const reactFlow = useReactFlow()
  const canvasShellRef = React.useRef<HTMLDivElement | null>(null)
  const initialState = React.useMemo(() => buildCanvasState(definition, uiSchema), [definition, uiSchema])
  const incomingSignature = React.useMemo(
    () => JSON.stringify({ definition: cloneJson(definition || {}), uiSchema: cloneJson(uiSchema || {}) }),
    [definition, uiSchema]
  )
  const lastSyncedSignatureRef = React.useRef(incomingSignature)
  const [nodes, setNodes] = React.useState<Node<CanvasNodeData>[]>(initialState.nodes)
  const [edges, setEdges] = React.useState<Edge[]>(initialState.edges)
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | null>(null)
  const [isAddNodeOpen, setIsAddNodeOpen] = React.useState(false)
  const invalidEdgeFingerprints = React.useMemo(
    () => new Set((preview?.invalid_edges || []).map((edge) => getEdgeFingerprint(edge as JsonObject))),
    [preview]
  )

  React.useEffect(() => {
    if (incomingSignature === lastSyncedSignatureRef.current) return
    setNodes(initialState.nodes)
    setEdges(initialState.edges)
    setSelectedNodeId((prev) =>
      prev && initialState.nodes.some((node) => node.id === prev) ? prev : null
    )
    setSelectedEdgeId((prev) =>
      prev && initialState.edges.some((edge) => edge.id === prev) ? prev : null
    )
    lastSyncedSignatureRef.current = incomingSignature
  }, [incomingSignature, initialState])

  React.useEffect(() => {
    const next = buildDefinitionFromCanvas(definition, uiSchema, nodes, edges)
    const nextSignature = JSON.stringify({
      definition: cloneJson(next.definition || {}),
      uiSchema: cloneJson(next.uiSchema || {}),
    })
    if (nextSignature === incomingSignature) {
      lastSyncedSignatureRef.current = incomingSignature
      return
    }
    lastSyncedSignatureRef.current = nextSignature
    onDefinitionChange(next.definition)
    onUiSchemaChange(next.uiSchema)
  }, [definition, edges, incomingSignature, nodes, onDefinitionChange, onUiSchemaChange, uiSchema])

  const onNodesChange = React.useCallback(
    (changes: NodeChange<Node<CanvasNodeData>>[]) => {
      setNodes((prev) => applyNodeChanges(changes, prev))
    },
    [],
  )

  const onEdgesChange = React.useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((prev) => applyEdgeChanges(changes, prev))
    },
    [],
  )

  const appendEdge = React.useCallback(
    (connection: Connection, nextSelection: "keep-node" | "select-edge" = "keep-node") => {
      const error = validateWorkflowConnection(connection, edges)
      if (error) {
        toast.warning(error)
        return false
      }

      let createdEdgeId: string | null = null
      setEdges((prev) => {
        const nextEdges = addDefaultWorkflowEdge(connection, prev)
        createdEdgeId = nextEdges[nextEdges.length - 1]?.id || null
        return nextEdges
      })

      if (nextSelection === "select-edge") {
        setSelectedNodeId(null)
        setSelectedEdgeId(createdEdgeId)
      }

      return true
    },
    [edges]
  )

  const onConnect = React.useCallback(
    (connection: Connection) => {
      appendEdge(connection)
    },
    [appendEdge],
  )

  const createEdgeBetween = React.useCallback(
    (source: string, target: string) => {
      const connection = {
        source,
        target,
        sourceHandle: "out" as string | null,
        targetHandle: "in" as string | null,
      } satisfies Connection
      appendEdge(connection, "select-edge")
    },
    [appendEdge]
  )

  const selectedNode = React.useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId],
  )
  const selectedEdge = React.useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeId) || null,
    [edges, selectedEdgeId],
  )

  const updateSelectedNode = React.useCallback(
    (patch: (node: Node<CanvasNodeData>) => Node<CanvasNodeData>) => {
      if (!selectedNodeId) return
      setNodes((prev) => prev.map((node) => (node.id === selectedNodeId ? patch(node) : node)))
    },
    [selectedNodeId],
  )

  const updateSelectedEdge = React.useCallback(
    (patch: (edge: Edge) => Edge) => {
      if (!selectedEdgeId) return
      setEdges((prev) => prev.map((edge) => (edge.id === selectedEdgeId ? patch(edge) : edge)))
    },
    [selectedEdgeId],
  )

  const createNodeFromAgent = React.useCallback(
    (agent?: { name: string; version?: string; title?: string }) => {
      const index = nodes.filter((node) => !SPECIAL_NODE_IDS.has(node.id)).length + 1
      const newNode = createWorkflowNodeFromAgent(index, agent)
      const nextNodes = [...nodes, newNode]
      setNodes(nextNodes)
      setSelectedNodeId(newNode.id)
      setSelectedEdgeId(null)
      setIsAddNodeOpen(false)
      onAgentSearchChange?.("")
      window.requestAnimationFrame(() => {
        reactFlow.setCenter(newNode.position.x + 120, newNode.position.y + 78, {
          zoom: 1,
          duration: 300,
        })
      })
    },
    [nodes, onAgentSearchChange, reactFlow],
  )

  const normalizedNodeKinds = React.useMemo(() => {
    return Object.keys(nodeKinds).length
      ? nodeKinds
      : { system: "System", llm: "LLM", tool: "Tool", workflow: "Workflow" }
  }, [nodeKinds])

  const [renderedEdges, setRenderedEdges] = React.useState<Array<{ id: string; d: string; stroke: string }>>([])

  React.useLayoutEffect(() => {
    const shell = canvasShellRef.current
    if (!shell) return

    const containerRect = shell.getBoundingClientRect()
    const nextEdges = edges
      .map((edge) => {
        const sourceEl = shell.querySelector<HTMLElement>(`[data-id="${edge.source}"]`)
        const targetEl = shell.querySelector<HTMLElement>(`[data-id="${edge.target}"]`)
        if (!sourceEl || !targetEl) return null

        const sourceRect = sourceEl.getBoundingClientRect()
        const targetRect = targetEl.getBoundingClientRect()
        const startX = sourceRect.right - containerRect.left
        const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top
        const endX = targetRect.left - containerRect.left
        const endY = targetRect.top + targetRect.height / 2 - containerRect.top
        const controlOffset = Math.max(48, Math.min(140, Math.abs(endX - startX) / 2))
        const invalid = invalidEdgeFingerprints.has(
          getEdgeFingerprint({
            source: edge.source,
            target: edge.target,
            ...(getJsonObject(edge.data?.model) || {}),
          })
        )

        return {
          id: edge.id,
          d: `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`,
          stroke: invalid ? "#dc2626" : "#2563eb",
        }
      })
      .filter(Boolean) as Array<{ id: string; d: string; stroke: string }>

    setRenderedEdges(nextEdges)
  }, [edges, invalidEdgeFingerprints, nodes])

  const updateEntryRouter = React.useCallback(
    (routerName: string) => {
      const nextDefinition = cloneJson(definition || {})
      nextDefinition.entry_router = {
        ...(getJsonObject(nextDefinition.entry_router) || {}),
        name: routerName === "__none__" ? undefined : routerName,
      }
      lastSyncedSignatureRef.current = JSON.stringify({
        definition: cloneJson(nextDefinition || {}),
        uiSchema: cloneJson(uiSchema || {}),
      })
      onDefinitionChange(nextDefinition)
    },
    [definition, onDefinitionChange, uiSchema]
  )

  const handleDeleteSelected = React.useCallback(() => {
    if (selectedNode && !SPECIAL_NODE_IDS.has(selectedNode.id)) {
      const nextNodes = nodes.filter((node) => node.id !== selectedNode.id)
      const nextEdges = edges.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
      setNodes(nextNodes)
      setEdges(nextEdges)
      setSelectedNodeId(null)
      return
    }
    if (selectedEdge) {
      const nextEdges = edges.filter((edge) => edge.id !== selectedEdge.id)
      setEdges(nextEdges)
      setSelectedEdgeId(null)
    }
  }, [edges, nodes, selectedEdge, selectedNode])

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 overflow-hidden rounded-2xl border bg-muted/10">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-background/70 px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Canvas Editor</div>
            <div className="text-xs text-muted-foreground">
              Drag nodes, connect edges, and edit workflow structure visually.
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {availableRouters.length > 0 && (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Entry Router</span>
                <Select
                  value={getJsonString(getJsonObject(definition.entry_router)?.name, "__none__")}
                  onValueChange={updateEntryRouter}
                >
                  <SelectTrigger className="h-8 min-w-[220px]">
                    <SelectValue placeholder="Select entry router" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No router</SelectItem>
                    {availableRouters.map((router) => (
                      <SelectItem key={router} value={router}>{router}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {preview?.warnings && preview.warnings.length > 0 && (
              <Badge variant="destructive" className="max-w-full">
                {preview.warnings.length} warning{preview.warnings.length > 1 ? "s" : ""}
              </Badge>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => createNodeFromAgent()}>
              <Plus className="mr-1 h-4 w-4" />
              Add Node
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddNodeOpen(true)}>
              From Agent
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={!selectedNode && !selectedEdge}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
        <div ref={canvasShellRef} className="relative h-[68vh] min-h-[620px]">
          <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
            <defs>
              <marker
                id="workflow-canvas-arrow"
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="5"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
              </marker>
            </defs>
            {renderedEdges.map((edge) => (
              <path
                key={edge.id}
                d={edge.d}
                fill="none"
                stroke={edge.stroke}
                strokeWidth={2.5}
                strokeLinecap="round"
                markerEnd="url(#workflow-canvas-arrow)"
                opacity={1}
              />
            ))}
          </svg>
          <ReactFlow
            nodes={nodes}
            edges={edges.map((edge) => {
              const invalid = invalidEdgeFingerprints.has(
                getEdgeFingerprint({
                  source: edge.source,
                  target: edge.target,
                  ...(edge.data?.model || {}),
                })
              )
              if (!invalid) return edge
              return {
                ...edge,
                labelStyle: { fill: "#dc2626", fontWeight: 700 },
                style: { stroke: "#dc2626", strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: "#dc2626" },
              }
            })}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id)
              setSelectedEdgeId(null)
            }}
            onPaneClick={() => {
              setSelectedNodeId(null)
              setSelectedEdgeId(null)
            }}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id)
              setSelectedNodeId(null)
            }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode={null}
          >
            <MiniMap zoomable pannable />
            <Controls />
            <Background gap={24} size={1} />
          </ReactFlow>
        </div>
      </div>

      <WorkflowNodePickerDialog
        open={isAddNodeOpen}
        onOpenChange={setIsAddNodeOpen}
        search={agentSearch}
        onSearchChange={onAgentSearchChange}
        isLoading={isLoadingAgents}
        agents={availableAgents}
        onSelectAgent={createNodeFromAgent}
      />

      <div className="min-w-0 space-y-4 rounded-2xl border bg-muted/10 p-4">
        <div>
          <div className="text-sm font-semibold">Inspector</div>
          <div className="text-xs text-muted-foreground">
            Select a node or edge on the canvas to edit its metadata.
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border bg-background/60 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Elements
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Nodes</div>
            <div className="flex flex-wrap gap-2">
              {nodes
                .filter((node) => !SPECIAL_NODE_IDS.has(node.id))
                .map((node) => (
                  <Button
                    key={node.id}
                    type="button"
                    variant={selectedNodeId === node.id ? "default" : "outline"}
                    size="sm"
                    className="max-w-full"
                    data-testid={`inspector-node-${node.id}`}
                    aria-label={`Select node ${node.id}`}
                    onClick={() => {
                      setSelectedNodeId(node.id)
                      setSelectedEdgeId(null)
                    }}
                  >
                    <span className="truncate">{node.id}</span>
                  </Button>
                ))}
            </div>
          </div>

          {edges.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Edges</div>
              <div className="flex flex-wrap gap-2">
                {edges.map((edge) => (
                  <Button
                    key={edge.id}
                    type="button"
                    variant={selectedEdgeId === edge.id ? "default" : "outline"}
                    size="sm"
                    className="max-w-full"
                    data-testid={`inspector-edge-${edge.id}`}
                    aria-label={`Select edge ${edge.source} to ${edge.target}`}
                    onClick={() => {
                      setSelectedEdgeId(edge.id)
                      setSelectedNodeId(null)
                    }}
                  >
                    <span className="truncate">
                      {edge.source} → {edge.target}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedNode ? (
          <WorkflowNodeInspector
            node={selectedNode}
            nodes={nodes}
            edges={edges}
            availableAgents={availableAgents}
            nodeKinds={normalizedNodeKinds}
            onChangeNodeId={(nextId) => {
              setNodes((prev) =>
                prev.map((node) =>
                  node.id === selectedNode.id
                    ? { ...node, id: nextId, data: { ...node.data, model: { ...node.data.model, key: nextId } } }
                    : node
                )
              )
              setEdges((prev) =>
                prev.map((edge) => ({
                  ...edge,
                  source: edge.source === selectedNode.id ? nextId : edge.source,
                  target: edge.target === selectedNode.id ? nextId : edge.target,
                  data: {
                    ...edge.data,
                    model: {
                      ...(edge.data?.model || {}),
                      from: edge.source === selectedNode.id ? nextId : edge.source,
                      to: edge.target === selectedNode.id ? nextId : edge.target,
                    },
                  },
                }))
              )
              setSelectedNodeId(nextId)
            }}
            onUpdateNode={updateSelectedNode}
            onCreateEdge={(targetNodeId) => createEdgeBetween(selectedNode.id, targetNodeId)}
          />
        ) : selectedEdge ? (
          <WorkflowEdgeInspector
            edge={selectedEdge}
            availableRouters={availableRouters}
            onUpdateEdge={updateSelectedEdge}
          />
        ) : (
          <div className="rounded-xl border border-dashed bg-background/60 p-6 text-sm text-muted-foreground">
            Nothing selected yet. Click a node or edge to edit it.
          </div>
        )}
      </div>
    </div>
  )
}

export function WorkflowCanvasEditor(props: WorkflowCanvasEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasEditorInner {...props} />
    </ReactFlowProvider>
  )
}
