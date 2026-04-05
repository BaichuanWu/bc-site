"use client"

import type { Edge } from "@xyflow/react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getEdgeLabel, getEdgeModel } from "@/components/workflow/canvas/serializer"
import { getJsonObject, getJsonString } from "@/types/json"

type WorkflowEdgeInspectorProps = {
  edge: Edge
  onUpdateEdge: (patch: (edge: Edge) => Edge) => void
}

export function WorkflowEdgeInspector({
  edge,
  onUpdateEdge,
}: WorkflowEdgeInspectorProps) {
  const edgeType = getJsonString(getEdgeModel(edge).type, "direct")
  const condition = getJsonObject(getEdgeModel(edge).condition) || {}
  const priority = Number(getEdgeModel(edge).priority ?? 100)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">edge</Badge>
        <span className="text-sm font-medium">{edge.source} → {edge.target}</span>
      </div>
      <div className="grid gap-2">
        <Label>Edge Type</Label>
        <Select
          value={edgeType}
          onValueChange={(value) =>
            onUpdateEdge((current) => ({
              ...current,
              animated: value === "conditional",
              data: {
                ...current.data,
                model: {
                  ...getEdgeModel(current),
                  type: value,
                  condition:
                    value === "conditional"
                      ? getJsonObject(getEdgeModel(current).condition) || {
                          field: "",
                          operator: "not_null",
                        }
                      : undefined,
                  priority:
                    value === "conditional"
                      ? Number(getEdgeModel(current).priority ?? 100)
                      : undefined,
                },
              },
              label: getEdgeLabel({
                ...getEdgeModel(current),
                type: value,
                condition:
                  value === "conditional"
                    ? getJsonObject(getEdgeModel(current).condition) || {
                        field: "",
                        operator: "not_null",
                      }
                    : undefined,
              }),
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
      {edgeType === "conditional" ? (
        <>
          <div className="grid gap-2">
            <Label>Condition JSON</Label>
            <Textarea
              value={JSON.stringify(condition, null, 2)}
              onChange={(e) => {
                try {
                  const nextCondition = JSON.parse(e.target.value || "{}")
                  onUpdateEdge((current) => {
                    const nextModel = {
                      ...getEdgeModel(current),
                      condition: nextCondition,
                    }
                    return {
                      ...current,
                      data: { ...current.data, model: nextModel },
                      label: getEdgeLabel(nextModel),
                    }
                  })
                } catch {}
              }}
              className="min-h-[140px] font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Example: <code>{'{"field":"clusters","operator":"not_null"}'}</code>
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Priority</Label>
            <Input
              type="number"
              value={String(priority)}
              onChange={(e) => {
                const nextPriority = Number(e.target.value || 100)
                onUpdateEdge((current) => ({
                  ...current,
                  data: {
                    ...current.data,
                    model: {
                      ...getEdgeModel(current),
                      priority: Number.isFinite(nextPriority) ? nextPriority : 100,
                    },
                  },
                }))
              }}
            />
            <p className="text-xs text-muted-foreground">
              Lower priority runs first when multiple conditional edges share the same source node.
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}
