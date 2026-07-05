"use client"

import * as React from "react"
import { ChevronRightIcon, CircleCheckIcon, CircleDotIcon, CircleXIcon } from "lucide-react"

import { StructuredDataView } from "@/components/common/structured-data-view"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkspaceLink } from "@/components/workspace/workspace-link"
import { cn } from "@/lib/utils"
import type { TaskEventRecord } from "@/types/task"

type WorkflowNodeEventData = {
  eventKind?: string
  event_kind?: string
  key?: string
  agentExecutionId?: number | null
  agent_execution_id?: number | null
  agentId?: number | null
  // api-casing-ignore-next-line -- task event payloads may include legacy snake_case keys.
  agent_id?: number | null
  agentVersionId?: number | null
  agent_version_id?: number | null
  agentKind?: string | null
  agent_kind?: string | null
  status?: string
  input?: unknown
  output?: unknown
  error?: string | null
  startTime?: string | null
  start_time?: string | null
  endTime?: string | null
  end_time?: string | null
  durationMs?: number | null
  duration_ms?: number | null
}

type WorkflowNodeRecord = {
  id: string
  key: string
  occurrence: number
  event: TaskEventRecord
  data: WorkflowNodeEventData
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeNodeData(data: Record<string, unknown>): WorkflowNodeEventData | null {
  const eventKind = data.eventKind ?? data.event_kind
  if (eventKind !== "workflow.node") return null
  const key = data.key
  if (typeof key !== "string" || !key.trim()) return null
  return data as WorkflowNodeEventData
}

function getNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value
  }
  return null
}

function getString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function collectWorkflowNodes(events: TaskEventRecord[]) {
  const counts = new Map<string, number>()
  const nodes: WorkflowNodeRecord[] = []

  for (const event of events) {
    if (!isRecord(event.data)) continue
    const data = normalizeNodeData(event.data)
    if (!data?.key) continue
    const occurrence = (counts.get(data.key) || 0) + 1
    counts.set(data.key, occurrence)
    nodes.push({
      id: `${data.key}-${occurrence}-${event.eventId ?? event.timestamp}`,
      key: data.key,
      occurrence,
      event,
      data,
    })
  }

  return nodes
}

function statusTone(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === "completed") return "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-300"
  if (normalized === "failed") return "border-destructive/30 bg-destructive/5 text-destructive"
  if (normalized === "running") return "border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300"
  return "border-border bg-muted/20 text-muted-foreground"
}

function StatusIcon({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  if (normalized === "completed") return <CircleCheckIcon className="h-4 w-4 text-green-600" />
  if (normalized === "failed") return <CircleXIcon className="h-4 w-4 text-destructive" />
  return <CircleDotIcon className={cn("h-4 w-4", normalized === "running" ? "text-blue-600" : "text-muted-foreground")} />
}

function NodePayloadSection({ label, value }: { label: string; value: unknown }) {
  const [open, setOpen] = React.useState(false)
  const hasValue = value !== null && value !== undefined
  if (!hasValue) return null

  return (
    <div className="rounded-md border bg-background/50">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
        onClick={() => setOpen((value) => !value)}
      >
        <span>{label}</span>
        <ChevronRightIcon className={cn("h-3.5 w-3.5 transition-transform", open ? "rotate-90" : "")} />
      </button>
      {open ? (
        <div className="max-h-96 overflow-auto border-t bg-muted/10 p-3">
          <StructuredDataView data={value} />
        </div>
      ) : null}
    </div>
  )
}

function WorkflowNodeCard({ node }: { node: WorkflowNodeRecord }) {
  const status = getString(node.data.status) || "unknown"
  const agentExecutionId = getNumber(node.data.agentExecutionId, node.data.agent_execution_id)
  // api-casing-ignore-next-line -- task event payloads may include legacy snake_case keys.
  const agentId = getNumber(node.data.agentId, node.data.agent_id)
  const agentVersionId = getNumber(node.data.agentVersionId, node.data.agent_version_id)
  const durationMs = getNumber(node.data.durationMs, node.data.duration_ms)
  const agentKind = getString(node.data.agentKind, node.data.agent_kind)

  return (
    <div className={cn("rounded-lg border p-3", statusTone(status))}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <StatusIcon status={status} />
            <span className="font-mono text-sm font-semibold">{node.key}</span>
            <Badge variant="outline" className="h-5 text-[10px]">
              #{node.occurrence}
            </Badge>
            <Badge variant="secondary" className="h-5 text-[10px]">
              {status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {agentKind ? <span>kind {agentKind}</span> : null}
            {agentId !== null ? <span>agent #{agentId}</span> : null}
            {agentVersionId !== null ? <span>version #{agentVersionId}</span> : null}
            {durationMs !== null ? <span>{durationMs}ms</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-[11px]">
          {agentExecutionId !== null ? (
            <span className="rounded-md border bg-background/60 px-2 py-1 text-muted-foreground">
              Execution #{agentExecutionId}
            </span>
          ) : null}
          {agentId !== null ? (
            <WorkspaceLink
              href={`/dashboard/agent/${agentId}`}
              className="rounded-md border bg-background/60 px-2 py-1 text-muted-foreground hover:text-foreground"
            >
              Open agent
            </WorkspaceLink>
          ) : null}
        </div>
      </div>
      {node.data.error ? (
        <pre className="mt-3 whitespace-pre-wrap break-words rounded-md border border-destructive/20 bg-background/70 p-2 text-xs text-destructive">
          {node.data.error}
        </pre>
      ) : null}
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <NodePayloadSection label="Input" value={node.data.input} />
        <NodePayloadSection label="Output" value={node.data.output} />
      </div>
      <div className="mt-2">
        <NodePayloadSection label="Raw Event" value={node.event} />
      </div>
    </div>
  )
}

export function WorkflowRunView({ events }: { events: TaskEventRecord[] }) {
  const nodes = React.useMemo(() => collectWorkflowNodes(events), [events])
  if (nodes.length === 0) return null

  const completed = nodes.filter((node) => getString(node.data.status) === "completed").length
  const failed = nodes.filter((node) => getString(node.data.status) === "failed").length
  const running = nodes.filter((node) => getString(node.data.status) === "running").length

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-sm font-bold uppercase tracking-widest">Workflow Run</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{nodes.length} node events</Badge>
            <Badge variant="outline">{completed} completed</Badge>
            {running > 0 ? <Badge variant="outline">{running} running</Badge> : null}
            {failed > 0 ? <Badge variant="destructive">{failed} failed</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {nodes.map((node) => (
          <WorkflowNodeCard key={node.id} node={node} />
        ))}
      </CardContent>
    </Card>
  )
}
