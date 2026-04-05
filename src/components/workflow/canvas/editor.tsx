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

import { DefaultCanvas } from "@/components/canvas/default-canvas"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  addDefaultWorkflowEdge,
  validateWorkflowConnection,
} from "@/components/workflow/canvas/edge-rules"
import { WorkflowEdgeInspector } from "@/components/workflow/canvas/edge-inspector"
import { createWorkflowNodeFromAgent } from "@/components/workflow/canvas/node-factory"
import {
  buildCanvasState,
  buildDefinitionFromCanvas,
  CanvasNodeData,
  cloneJson,
  getEdgeLabel,
  getEdgeFingerprint,
  NODE_KIND_STYLES,
  SPECIAL_NODE_IDS,
  type WorkflowDefinition,
  type WorkflowUiSchema,
} from "@/components/workflow/canvas/serializer"
import { WorkflowDisplayNode } from "@/components/workflow/canvas/display-node"
import { WorkflowNodeInspector } from "@/components/workflow/canvas/node-inspector"
import { WorkflowNodePickerDialog } from "@/components/workflow/canvas/node-picker-dialog"
import { ModelSchemaEditor } from "@/components/workflow/schema/model-schema-editor"
import { getJsonObject, type JsonObject } from "@/types/json"

type WorkflowCanvasEditorProps = {
  value: {
    definition: WorkflowDefinition
    uiSchema: WorkflowUiSchema
  }
  onChange: (value: {
    definition: WorkflowDefinition
    uiSchema: WorkflowUiSchema
  }) => void
  availableAgents?: Array<{
    id: number
    agent_id: number
    name: string
    version: string
    agent_class: string
    description?: string
    version_description?: string
    config_json?: Record<string, unknown>
  }>
  agentSearch?: string
  onAgentSearchChange?: (value: string) => void
  isLoadingAgents?: boolean
  onEditAgentVersion?: (
    agent: {
      id: number
      agent_id: number
      name: string
      version: string
      agent_class: string
      description?: string
      version_description?: string
      config_json?: Record<string, unknown>
    },
    nodeKey: string,
  ) => void
  preview?: {
    warnings?: string[]
    invalid_edges?: Record<string, unknown>[]
  } | null
}

const nodeTypes = {
  workflowNode: WorkflowDisplayNode,
}

function inferNodeKindFromAgent(agentClass?: string, name?: string) {
  if (/reflect|llm/i.test(agentClass || "") || /strateg|assembl/i.test(name || "")) {
    return "llm"
  }
  return "system"
}

function WorkflowCanvasEditorInner({
  value,
  onChange,
  availableAgents = [],
  agentSearch = "",
  onAgentSearchChange,
  isLoadingAgents = false,
  onEditAgentVersion,
  preview = null,
}: WorkflowCanvasEditorProps) {
  const definition = value.definition
  const uiSchema = value.uiSchema
  const reactFlow = useReactFlow()
  const initialState = React.useMemo(
    () => buildCanvasState(definition, uiSchema),
    [definition, uiSchema]
  )
  const incomingSignature = React.useMemo(
    () =>
      JSON.stringify({
        definition: cloneJson(definition || {}),
        uiSchema: cloneJson(uiSchema || {}),
      }),
    [definition, uiSchema]
  )
  const lastSyncedSignatureRef = React.useRef(incomingSignature)
  const [nodes, setNodes] = React.useState<Node<CanvasNodeData>[]>(initialState.nodes)
  const [edges, setEdges] = React.useState<Edge[]>(initialState.edges)
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | null>(null)
  const [drawerMode, setDrawerMode] = React.useState<"state" | "node" | "edge" | null>(null)
  const [isAddNodeOpen, setIsAddNodeOpen] = React.useState(false)
  const renderNodes = React.useMemo(
    () =>
      nodes.map((node) => {
        if (SPECIAL_NODE_IDS.has(node.id)) return node
        const model = getJsonObject(node.data.model)
        const selectedAgent = availableAgents.find(
          (agent) => agent.id === Number(model?.agent_version_id)
        )
        const kind = inferNodeKindFromAgent(selectedAgent?.agent_class, selectedAgent?.name)
        return {
          ...node,
          data: {
            ...node.data,
            kind,
            agentDisplay: selectedAgent?.name,
            agentVersionDisplay: selectedAgent?.version,
            agentClassDisplay: selectedAgent?.agent_class,
          },
          style: SPECIAL_NODE_IDS.has(node.id)
            ? node.style
            : {
                ...(node.style || {}),
                border: `1px solid ${(NODE_KIND_STYLES[kind] || NODE_KIND_STYLES.system)}55`,
                background: `${NODE_KIND_STYLES[kind] || NODE_KIND_STYLES.system}12`,
                boxShadow: `0 8px 24px ${(NODE_KIND_STYLES[kind] || NODE_KIND_STYLES.system)}18`,
              },
        }
      }),
    [availableAgents, nodes]
  )
  const invalidEdgeFingerprints = React.useMemo(
    () =>
      new Set(
        (preview?.invalid_edges || []).map((edge) =>
          getEdgeFingerprint(edge as JsonObject)
        )
      ),
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
    setDrawerMode((prev) => (prev === "state" ? prev : null))
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
    onChange(next)
  }, [definition, edges, incomingSignature, nodes, onChange, uiSchema])

  const onNodesChange = React.useCallback((changes: NodeChange<Node<CanvasNodeData>>[]) => {
    setNodes((prev) => applyNodeChanges(changes, prev))
  }, [])

  const onEdgesChange = React.useCallback((changes: EdgeChange<Edge>[]) => {
    setEdges((prev) => applyEdgeChanges(changes, prev))
  }, [])

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
        setDrawerMode("edge")
      }

      return true
    },
    [edges]
  )

  const selectedNode = React.useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  )
  const selectedEdge = React.useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeId) || null,
    [edges, selectedEdgeId]
  )

  const updateSelectedNode = React.useCallback(
    (patch: (node: Node<CanvasNodeData>) => Node<CanvasNodeData>) => {
      if (!selectedNodeId) return
      setNodes((prev) =>
        prev.map((node) => (node.id === selectedNodeId ? patch(node) : node))
      )
    },
    [selectedNodeId]
  )

  const updateSelectedEdge = React.useCallback(
    (patch: (edge: Edge) => Edge) => {
      if (!selectedEdgeId) return
      setEdges((prev) =>
        prev.map((edge) => (edge.id === selectedEdgeId ? patch(edge) : edge))
      )
    },
    [selectedEdgeId]
  )

  const createNodeFromAgent = React.useCallback(
    (agent?: {
      id: number
      agent_id: number
      name: string
      version: string
      agent_class: string
      description?: string
      config_json?: Record<string, unknown>
    }) => {
      const index =
        nodes.filter((node) => !SPECIAL_NODE_IDS.has(node.id)).length + 1
      const newNode = createWorkflowNodeFromAgent(index, agent)
      setNodes((prev) => [...prev, newNode])
      setSelectedNodeId(newNode.id)
      setSelectedEdgeId(null)
      setDrawerMode("node")
      setIsAddNodeOpen(false)
      onAgentSearchChange?.("")
      window.requestAnimationFrame(() => {
        reactFlow.setCenter(newNode.position.x + 120, newNode.position.y + 78, {
          zoom: 1,
          duration: 300,
        })
      })
    },
    [nodes, onAgentSearchChange, reactFlow]
  )

  const handleDeleteSelected = React.useCallback(() => {
    if (selectedNode && !SPECIAL_NODE_IDS.has(selectedNode.id)) {
      setNodes((prev) => prev.filter((node) => node.id !== selectedNode.id))
      setEdges((prev) =>
        prev.filter(
          (edge) =>
            edge.source !== selectedNode.id && edge.target !== selectedNode.id
        )
      )
      setSelectedNodeId(null)
      return
    }
    if (selectedEdge) {
      setEdges((prev) => prev.filter((edge) => edge.id !== selectedEdge.id))
      setSelectedEdgeId(null)
    }
  }, [selectedEdge, selectedNode])

  const closeDrawer = React.useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setDrawerMode(null)
  }, [])

  const renameSelectedNode = React.useCallback(
    (nextId: string) => {
      if (!selectedNode) return
      setNodes((prev) =>
        prev.map((node) =>
          node.id === selectedNode.id
            ? {
                ...node,
                id: nextId,
                data: { ...node.data, model: { ...node.data.model, key: nextId } },
              }
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
    },
    [selectedNode]
  )

  const drawerContent = drawerMode === "state" ? (
    <ModelSchemaEditor
      title="State Schema"
      description="Define the workflow state contract. Preview derives state_fields from this schema."
      value={getJsonObject(definition.state_schema)}
      onChange={(nextStateSchema) =>
        onChange({
          definition: {
            ...definition,
            state_schema: nextStateSchema,
          },
          uiSchema,
        })
      }
    />
  ) : selectedNode ? (
        <WorkflowNodeInspector
          node={selectedNode}
          nodes={nodes}
          edges={edges}
          availableAgents={availableAgents}
          onEditAgentVersion={onEditAgentVersion}
          onChangeNodeId={renameSelectedNode}
          onUpdateNode={updateSelectedNode}
          onCreateEdge={(targetNodeId) =>
            appendEdge(
              {
                source: selectedNode.id,
                target: targetNodeId,
                sourceHandle: "out",
                targetHandle: "in",
              },
              "select-edge"
            )
          }
        />
  ) : selectedEdge ? (
    <WorkflowEdgeInspector
      edge={selectedEdge}
      onUpdateEdge={updateSelectedEdge}
    />
  ) : (
    <div className="rounded-xl border border-dashed bg-background/60 p-6 text-sm text-muted-foreground">
      Nothing selected yet. Click a node or edge to edit it.
    </div>
  )

  return (
    <>
      <DefaultCanvas
        title="Canvas Editor"
        description="Use the toolbar and fullscreen graph to edit node topology and edge routing."
        toolbar={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedNodeId(null)
                setSelectedEdgeId(null)
                setDrawerMode("state")
              }}
            >
              State Schema
            </Button>
            {preview?.warnings && preview.warnings.length > 0 ? (
              <Badge variant="destructive" className="max-w-full">
                {preview.warnings.length} warning
                {preview.warnings.length > 1 ? "s" : ""}
              </Badge>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => createNodeFromAgent()}>
              <Plus className="mr-1 h-4 w-4" />
              Add Node
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddNodeOpen(true)}
            >
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
          </>
        }
        canvas={
          <ReactFlow
            nodes={renderNodes}
            edges={edges.map((edge) => {
              const edgeModel = {
                source: edge.source,
                target: edge.target,
                ...(edge.data?.model || {}),
              }
              const invalid = invalidEdgeFingerprints.has(
                getEdgeFingerprint(edgeModel)
              )
              const nextEdge = {
                ...edge,
                label: getEdgeLabel(getJsonObject(edge.data?.model) || ({} as JsonObject)),
              }
              if (!invalid) return nextEdge
              return {
                ...nextEdge,
                labelStyle: { fill: "#dc2626", fontWeight: 700 },
                style: { stroke: "#dc2626", strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: "#dc2626" },
              }
            })}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={(connection) => {
              appendEdge(connection)
            }}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id)
              setSelectedEdgeId(null)
              setDrawerMode("node")
            }}
            onPaneClick={closeDrawer}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id)
              setSelectedNodeId(null)
              setDrawerMode("edge")
            }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode={null}
          >
            <MiniMap zoomable pannable />
            <Controls />
            <Background gap={24} size={1} />
          </ReactFlow>
        }
        drawerOpen={drawerMode !== null}
        onDrawerOpenChange={(open) => {
          if (!open) closeDrawer()
        }}
        drawerTitle={
          drawerMode === "state"
            ? "State Schema"
            : selectedNode
              ? `Node: ${selectedNode.id}`
              : selectedEdge
                ? "Edge Inspector"
                : "Inspector"
        }
        drawerDescription={
          drawerMode === "state"
            ? "Edit the global workflow state contract that becomes part of the same DSL document."
            : selectedNode
            ? "Edit node metadata, mappings, and model references."
            : selectedEdge
              ? "Edit edge routing metadata."
              : "Select a canvas element to inspect it."
        }
        drawerContent={drawerContent}
      />

      <WorkflowNodePickerDialog
        open={isAddNodeOpen}
        onOpenChange={setIsAddNodeOpen}
        search={agentSearch}
        onSearchChange={onAgentSearchChange}
        isLoading={isLoadingAgents}
        agents={availableAgents}
        onSelectAgent={createNodeFromAgent}
      />
    </>
  )
}

export function WorkflowCanvasEditor(props: WorkflowCanvasEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasEditorInner {...props} />
    </ReactFlowProvider>
  )
}
