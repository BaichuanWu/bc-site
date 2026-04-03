"use client"

import type { Edge } from "@xyflow/react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getEdgeModel } from "@/components/workflow/canvas/serializer"
import { getJsonString } from "@/types/json"

type WorkflowEdgeInspectorProps = {
  edge: Edge
  availableRouters: string[]
  onUpdateEdge: (patch: (edge: Edge) => Edge) => void
}

export function WorkflowEdgeInspector({
  edge,
  availableRouters,
  onUpdateEdge,
}: WorkflowEdgeInspectorProps) {
  const supportsConditional = edge.source === "__start__"
  const edgeType = getJsonString(getEdgeModel(edge).type, "direct")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">edge</Badge>
        <span className="text-sm font-medium">{edge.source} → {edge.target}</span>
      </div>
      <div className="grid gap-2">
        <Label>Edge Type</Label>
        <Select
          value={supportsConditional ? edgeType : "direct"}
          onValueChange={(value) =>
            onUpdateEdge((current) => ({
              ...current,
              animated: value === "conditional",
              label: value === "conditional"
                ? `conditional${getEdgeModel(current).router ? `:${getEdgeModel(current).router}` : ""}`
                : "direct",
              data: {
                ...current.data,
                model: { ...getEdgeModel(current), type: value },
              },
            }))
          }
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="direct">direct</SelectItem>
            {supportsConditional ? (
              <SelectItem value="conditional">conditional</SelectItem>
            ) : null}
          </SelectContent>
        </Select>
        {!supportsConditional ? (
          <p className="text-xs text-muted-foreground">
            Conditional edges are currently only supported from START.
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label>Router</Label>
        {edge.source === "__start__" ? (
          <Input
            value={getJsonString(getEdgeModel(edge).router)}
            disabled
            placeholder="Uses definition.entry_router.name"
          />
        ) : availableRouters.length > 0 ? (
          <Select
            value={getJsonString(getEdgeModel(edge).router, "__none__")}
            onValueChange={(value) =>
              onUpdateEdge((current) => ({
                ...current,
                label:
                  (getEdgeModel(current).type || "direct") === "conditional"
                    ? `conditional${value && value !== "__none__" ? `:${value}` : ""}`
                    : "direct",
                data: {
                  ...current.data,
                  model: {
                    ...getEdgeModel(current),
                    router: value === "__none__" ? undefined : value,
                  },
                },
              }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No router</SelectItem>
              {availableRouters.map((router) => (
                <SelectItem key={router} value={router}>{router}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={getJsonString(getEdgeModel(edge).router)}
            disabled
            placeholder="Router is only used for conditional edges"
          />
        )}
      </div>
    </div>
  )
}
