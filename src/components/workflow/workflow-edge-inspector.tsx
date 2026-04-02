"use client"

import type { Edge } from "@xyflow/react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getEdgeModel } from "@/components/workflow/workflow-canvas-serializer"
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
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">edge</Badge>
        <span className="text-sm font-medium">{edge.source} → {edge.target}</span>
      </div>
      <div className="grid gap-2">
        <Label>Edge Type</Label>
        <Select
          value={getJsonString(getEdgeModel(edge).type, "direct")}
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
            <SelectItem value="conditional">conditional</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Router</Label>
        {availableRouters.length > 0 && edge.source !== "__start__" ? (
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
            disabled={edge.source === "__start__"}
            placeholder={edge.source === "__start__" ? "Uses definition.entry_router.name" : "Optional router ref"}
            onChange={(e) =>
              onUpdateEdge((current) => ({
                ...current,
                label:
                  (getEdgeModel(current).type || "direct") === "conditional"
                    ? `conditional${e.target.value ? `:${e.target.value}` : ""}`
                    : "direct",
                data: {
                  ...current.data,
                  model: { ...getEdgeModel(current), router: e.target.value || undefined },
                },
              }))
            }
          />
        )}
      </div>
    </div>
  )
}
