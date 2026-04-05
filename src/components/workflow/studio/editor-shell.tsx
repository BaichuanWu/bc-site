"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Expand, Minimize2 } from "lucide-react"
import { usePathname } from "next/navigation"

import { JsonNode } from "@/components/common/json-node"
import { WorkflowCanvasEditor } from "@/components/workflow/canvas/editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { parseJsonText } from "@/lib/json-utils"
import type { AgentRecord, WorkflowPreview } from "@/hooks/use-workflow-studio"
import type { JsonObject } from "@/types/json"

type WorkflowCanvasShellProps = {
  definitionJson: string
  uiSchemaJson: string
  preview: WorkflowPreview | null
  availableAgents: AgentRecord[]
  agentSearch: string
  onAgentSearchChange: (value: string) => void
  isLoadingAgents: boolean
  onEditAgentVersion: (
    agent: AgentRecord,
    nodeKey: string,
  ) => void
  onChange: (value: { definitionJson: string; uiSchemaJson: string }) => void
  onPreview: () => Promise<void>
}

function WorkflowCanvasPreview({
  preview,
  definitionJson,
  onEdit,
}: {
  preview: WorkflowPreview | null
  definitionJson: string
  onEdit: () => void
}) {
  const definition = parseJsonText<JsonObject>(definitionJson, {})
  const nodeCount = Array.isArray(definition.nodes) ? definition.nodes.length : 0
  const edgeCount = Array.isArray(definition.edges) ? definition.edges.length : 0
  const conditionalEdgeCount = Array.isArray(definition.edges)
    ? definition.edges.filter(
        (edge) =>
          edge &&
          typeof edge === "object" &&
          (edge as Record<string, unknown>).type === "conditional"
      ).length
    : 0

  return (
    <div className="space-y-4 rounded-2xl border bg-muted/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold">Workflow Canvas Field</div>
          <div className="text-xs text-muted-foreground">
            This card only previews the graph-related DSL. Use fullscreen to edit nodes, edges, and layout.
          </div>
        </div>
        <Button type="button" onClick={onEdit}>
          <Expand className="mr-2 h-4 w-4" />
          Edit Canvas
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] uppercase text-muted-foreground">Nodes</div>
          <div className="mt-1 text-lg font-semibold">{preview?.node_count ?? nodeCount}</div>
        </div>
        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] uppercase text-muted-foreground">Edges</div>
          <div className="mt-1 text-lg font-semibold">{preview?.edge_count ?? edgeCount}</div>
        </div>
        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] uppercase text-muted-foreground">Conditional Edges</div>
          <div className="mt-1 text-sm font-medium">
            {conditionalEdgeCount}
          </div>
        </div>
        <div className="rounded-xl border bg-background p-3">
          <div className="text-[11px] uppercase text-muted-foreground">Warnings</div>
          <div className="mt-1 text-sm font-medium">{preview?.warnings?.length ?? 0}</div>
        </div>
      </div>

      {preview?.warnings && preview.warnings.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {preview.warnings.map((warning, idx) => (
            <Badge key={idx} variant="secondary">
              {warning}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-background p-4 text-sm text-muted-foreground">
          No compile preview yet. The graph field is currently shown in read mode.
        </div>
      )}
    </div>
  )
}

export function WorkflowEditorShell({
  definitionJson,
  uiSchemaJson,
  preview,
  availableAgents,
  agentSearch,
  onAgentSearchChange,
  isLoadingAgents,
  onEditAgentVersion,
  onChange,
  onPreview,
}: WorkflowCanvasShellProps) {
  const pathname = usePathname()
  const fullscreenStorageKey = React.useMemo(
    () => `bc:workflow-editor:fullscreen:${pathname || "unknown"}`,
    [pathname]
  )
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [isFullscreenHydrated, setIsFullscreenHydrated] = React.useState(false)
  const definition = React.useMemo(
    () => parseJsonText<JsonObject>(definitionJson, {}),
    [definitionJson]
  )
  const conditionalEdgeCount = Array.isArray(definition.edges)
    ? definition.edges.filter(
        (edge) =>
          edge &&
          typeof edge === "object" &&
          (edge as Record<string, unknown>).type === "conditional"
      ).length
    : 0

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    if (!isMounted) return
    setIsFullscreen(
      window.sessionStorage.getItem(fullscreenStorageKey) === "true"
    )
    setIsFullscreenHydrated(true)
  }, [fullscreenStorageKey, isMounted])

  React.useEffect(() => {
    if (!isMounted || !isFullscreenHydrated) return
    window.sessionStorage.setItem(
      fullscreenStorageKey,
      isFullscreen ? "true" : "false"
    )
  }, [fullscreenStorageKey, isFullscreen, isFullscreenHydrated, isMounted])

  React.useEffect(() => {
    if (!isMounted) return
    const previousOverflow = document.body.style.overflow
    if (isFullscreen) {
      document.body.style.overflow = "hidden"
      document.documentElement.dataset.workflowEditorFullscreen = "true"
    } else {
      delete document.documentElement.dataset.workflowEditorFullscreen
    }
    return () => {
      document.body.style.overflow = previousOverflow
      delete document.documentElement.dataset.workflowEditorFullscreen
    }
  }, [isFullscreen, isMounted])

  const fullscreenContent = (
    <div className="fixed inset-0 z-[130] bg-background p-4 md:p-6">
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-background/95 px-4 py-3 shadow-sm">
          <div className="space-y-1">
            <div className="text-lg font-semibold">Workflow Canvas</div>
            <div className="text-xs text-muted-foreground">
              Fullscreen mode is only for graph editing. Other workflow fields stay on the page.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => void onPreview()}>
              Preview
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsFullscreen(false)}>
              <Minimize2 className="mr-2 h-4 w-4" />
              Exit Fullscreen
            </Button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-0">
            <WorkflowCanvasEditor
              value={{
                definition: parseJsonText(definitionJson, {}),
                uiSchema: parseJsonText(uiSchemaJson, {}),
              }}
              availableAgents={availableAgents}
              agentSearch={agentSearch}
              onAgentSearchChange={onAgentSearchChange}
              isLoadingAgents={isLoadingAgents}
              onEditAgentVersion={onEditAgentVersion}
              preview={preview}
              onChange={({ definition, uiSchema }) =>
                onChange({
                  definitionJson: JSON.stringify(definition, null, 2),
                  uiSchemaJson: JSON.stringify(uiSchema, null, 2),
                })
              }
            />
          </div>

          <div className="min-h-0 space-y-4 overflow-y-auto rounded-2xl border bg-muted/20 p-4">
            <div>
              <h3 className="text-sm font-semibold">Compile Preview</h3>
              <p className="text-xs text-muted-foreground">
                Validation for the graph field only.
              </p>
            </div>

            {preview ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-[11px] uppercase text-muted-foreground">Nodes</div>
                    <div className="mt-1 text-lg font-semibold">{preview.node_count ?? 0}</div>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-[11px] uppercase text-muted-foreground">Edges</div>
                    <div className="mt-1 text-lg font-semibold">{preview.edge_count ?? 0}</div>
                  </div>
                </div>

                <div className="rounded-lg border bg-background p-3">
                  <div className="text-[11px] uppercase text-muted-foreground">Conditional Edges</div>
                  <div className="mt-1 text-sm font-medium">
                    {conditionalEdgeCount}
                  </div>
                </div>

                <div className="rounded-lg border bg-background p-3">
                  <div className="text-[11px] uppercase text-muted-foreground">Warnings</div>
                  <div className="mt-2 space-y-2">
                    {(preview.warnings || []).length ? (
                      (preview.warnings || []).map((warning, idx) => (
                        <Badge key={idx} variant="secondary" className="mr-2 mb-2">
                          {warning}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No warnings.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border bg-background p-3">
                  <div className="text-[11px] uppercase text-muted-foreground">State Fields</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(preview.state_fields || []).map((fieldName) => (
                      <Badge key={fieldName} variant="outline">
                        {fieldName}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border bg-background p-3">
                  <div className="text-[11px] uppercase text-muted-foreground">Preview JSON</div>
                  <div className="mt-2">
                    <JsonNode data={preview} depth={0} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-background p-6 text-sm text-muted-foreground">
                Run preview to inspect node graph, state schema fields, and validation warnings.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <WorkflowCanvasPreview
        preview={preview}
        definitionJson={definitionJson}
        onEdit={() => setIsFullscreen(true)}
      />
      {isMounted && isFullscreenHydrated && isFullscreen
        ? createPortal(fullscreenContent, document.body)
        : null}
    </div>
  )
}
