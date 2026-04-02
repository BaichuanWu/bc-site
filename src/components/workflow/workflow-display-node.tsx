"use client"

import type { CSSProperties } from "react"
import { Handle, Position } from "@xyflow/react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const KIND_BADGE_STYLES: Record<string, string> = {
  system: "bg-slate-900 text-white border-slate-700",
  llm: "bg-blue-600 text-white border-blue-400",
  tool: "bg-violet-600 text-white border-violet-400",
  workflow: "bg-teal-600 text-white border-teal-400",
}

export function WorkflowDisplayNode(props: any) {
  const data = (props?.data || {}) as Record<string, any>
  const selected = !!props?.selected
  const model = (data.model || {}) as Record<string, any>
  const kind = data.kind || model.kind || "system"
  const badgeClassName = KIND_BADGE_STYLES[kind] || KIND_BADGE_STYLES.system
  const handleClassName =
    "h-3.5 w-3.5 rounded-full border-2 border-background bg-primary shadow-sm"
  const handleStyle = {
    width: 14,
    height: 14,
  } satisfies CSSProperties

  if (data.special) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-slate-400/40 bg-slate-950 px-4 py-3 text-center text-white shadow-md",
          selected && "ring-2 ring-primary/40"
        )}
      >
        {model.key !== "__start__" && (
          <Handle id="in" type="target" position={Position.Left} className={handleClassName} style={handleStyle} />
        )}
        <div className="text-xs font-black tracking-[0.28em]">{data.label}</div>
        {model.key !== "__end__" && (
          <Handle id="out" type="source" position={Position.Right} className={handleClassName} style={handleStyle} />
        )}
      </div>
    )
  }

  return (
    <div
      data-testid="workflow-node-card"
      className={cn(
        "w-[240px] rounded-3xl border bg-background/95 px-4 py-4 shadow-lg backdrop-blur-sm",
        selected ? "border-primary/60 ring-2 ring-primary/20" : "border-border"
      )}
    >
      <Handle id="in" type="target" position={Position.Left} className={handleClassName} style={handleStyle} />
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{model.key || data.label}</div>
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {model.description || data.label || "Workflow node"}
            </div>
          </div>
          <Badge className={cn("border text-[10px] uppercase", badgeClassName)}>
            {kind}
          </Badge>
        </div>
        <div className="space-y-1 rounded-2xl bg-muted/40 px-3 py-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Agent</span>
            <span className="max-w-[120px] truncate font-medium">{model.agent_name || "-"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">{model.agent_version || "-"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium">{model.type || "agent"}</span>
          </div>
        </div>
      </div>
      <Handle id="out" type="source" position={Position.Right} className={handleClassName} style={handleStyle} />
    </div>
  )
}
