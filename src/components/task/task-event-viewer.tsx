"use client"

import { useMemo, useState } from "react"
import { ChevronRightIcon } from "lucide-react"

import { JsonNode } from "@/components/common/json-node"
import { Badge } from "@/components/ui/badge"
import { TASK_STATE } from "@/lib/constants"
import { formatTime } from "@/lib/date-utils"
import {
  getStatusColor,
  mapServerStateToStatus,
  mapStatusToName,
} from "@/lib/task-utils"
import {
  getTaskEventData,
  getTaskEventProgressPercent,
} from "@/lib/task-events"
import { cn } from "@/lib/utils"
import { type TaskEventRecord } from "@/types/task"

type TaskEventKindConfig = {
  title?: string
  summary?: (event: TaskEventRecord) => string
}

const TASK_EVENT_KIND_CONFIG: Record<string, TaskEventKindConfig> = {
  batch_progress: {
    title: "Batch Progress",
    summary: () => "Incremental execution progress and runtime artifacts",
  },
}

function getPayloadKind(event: TaskEventRecord) {
  const data = getTaskEventData(event)
  return typeof data?.kind === "string" && data.kind.length > 0 ? data.kind : event.type
}

function getEventTitle(event: TaskEventRecord) {
  const data = getTaskEventData(event)
  if (event.type === "task.result") return "Final Result"
  if (event.type === "task.failed" || event.type === "task.stopped") return "Task Error"
  const config = TASK_EVENT_KIND_CONFIG[getPayloadKind(event)]
  if (config?.title) return config.title
  if (typeof data?.key === "string" && data.key.length > 0) return data.key
  if (event.type === "task.started") return "Task Started"
  if (event.type === "task.updated") return "Task Update"
  if (event.type === "task.checkpoint") return "Checkpoint"
  return "Task Event"
}

function getEventStatus(event: TaskEventRecord) {
  const data = getTaskEventData(event)
  if (event.type === "task.result") return TASK_STATE.SUCCESS
  if (event.type === "task.failed" || event.type === "task.stopped") return TASK_STATE.ERROR
  if (data?.status === "completed") return TASK_STATE.SUCCESS
  if (data?.status === "failed") return TASK_STATE.ERROR
  return TASK_STATE.RUNNING
}

function getEventStatusTone(eventStatus: number) {
  if (eventStatus === TASK_STATE.SUCCESS) {
    return {
      badge: "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]",
      panel: "bg-green-600",
      dot: "bg-green-500",
    }
  }

  if (eventStatus === TASK_STATE.ERROR) {
    return {
      badge: "bg-red-500",
      panel: "bg-red-600",
      dot: "bg-red-500",
    }
  }

  if (eventStatus === TASK_STATE.RUNNING) {
    return {
      badge: "bg-blue-500 animate-pulse",
      panel: "bg-blue-600",
      dot: "bg-blue-500",
    }
  }

  return {
    badge: "bg-muted",
    panel: "bg-slate-600",
    dot: "bg-slate-500",
  }
}

function getEventSummary(event: TaskEventRecord) {
  if (event.message) return event.message
  if (event.type === "task.result") return "Final task output"
  if (event.type === "task.failed" || event.type === "task.stopped") {
    return event.message || "Task execution failed"
  }
  const config = TASK_EVENT_KIND_CONFIG[getPayloadKind(event)]
  if (config?.summary) return config.summary(event)
  return "Generic task event payload"
}

function hasDetailValue(value: unknown) {
  if (value === null || value === undefined) return false
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "object") return Object.keys(value).length > 0
  return true
}

const STANDARD_DETAIL_KEYS = new Set([
  "key",
  "kind",
  "status",
  "agentId",
  "agentVersionId",
  "conversationId",
  "input",
  "output",
  "error",
  "startTime",
  "endTime",
  "durationMs",
])

function omitStandardDetailData(data: Record<string, unknown>) {
  const entries = Object.entries(data).filter(([key]) => !STANDARD_DETAIL_KEYS.has(key))
  return Object.fromEntries(entries)
}

function buildEventDetails(event: TaskEventRecord) {
  const data = getTaskEventData(event)
  const details: Array<{ label: string; value: unknown }> = []

  if (data) {
    details.push(
      { label: "Input", value: data.input },
      { label: "Output", value: data.output },
      { label: "Error", value: data.error },
    )
    if (data.durationMs !== null && data.durationMs !== undefined) {
      details.push({ label: "Duration", value: `${data.durationMs}ms` })
    }
    details.push({ label: "Event Data", value: omitStandardDetailData(data) })
  } else {
    details.push({ label: "Event Data", value: event.data })
  }

  details.push({ label: "Snapshot", value: event.snapshot })

  return details.filter((item) => hasDetailValue(item.value))
}

type TaskEventViewerProps = {
  event: TaskEventRecord
}

export function TaskEventViewer({ event }: TaskEventViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const eventStatus = getEventStatus(event)
  const eventTone = getEventStatusTone(eventStatus)
  const eventTitle = getEventTitle(event)
  const payloadKind = getPayloadKind(event)
  const details = useMemo(() => buildEventDetails(event), [event])
  const canExpand = details.length > 0
  const progress = getTaskEventProgressPercent(event) ?? null

  return (
    <>
      <div
        className={cn(
          "absolute -left-[31px] top-6 h-2 w-2 rounded-full ring-4 ring-background z-10 transition-all group-hover:scale-125",
          eventTone.badge,
        )}
      />

      <div
        className={cn(
          "rounded-lg border bg-card/50 transition-colors hover:bg-card",
          canExpand ? "cursor-pointer" : "",
        )}
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : undefined}
        data-task-event-expandable={canExpand ? "true" : undefined}
        aria-expanded={canExpand ? isExpanded : undefined}
        onClick={() => {
          if (canExpand) setIsExpanded((value) => !value)
        }}
        onKeyDown={(eventKey) => {
          if (!canExpand) return
          if (eventKey.key === "Enter" || eventKey.key === " ") {
            eventKey.preventDefault()
            setIsExpanded((value) => !value)
          }
        }}
      >
        <div className="flex min-w-0 items-start justify-between gap-3 px-3 py-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {canExpand ? (
                <ChevronRightIcon
                  className={cn(
                    "h-3 w-3 shrink-0 text-muted-foreground transition-transform",
                    isExpanded ? "rotate-90" : "",
                  )}
                />
              ) : null}
              <span className="truncate text-xs font-bold uppercase tracking-tight">
                {eventTitle}
              </span>
              <Badge
                variant="secondary"
                className="h-4 bg-muted/50 px-1.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground"
              >
                {payloadKind}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "h-4 px-1.5 text-[8px] font-bold uppercase tracking-widest",
                  getStatusColor(eventStatus),
                )}
              >
                {mapStatusToName(mapServerStateToStatus(eventStatus))}
              </Badge>
              {progress !== null ? (
                <span className="font-mono text-[10px] text-muted-foreground">
                  {progress}%
                </span>
              ) : null}
            </div>
            <p className="truncate text-[11px] leading-5 text-muted-foreground">
              {getEventSummary(event)}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[9px] text-muted-foreground/70">
            {formatTime(event.timestamp)}
          </span>
        </div>
        {isExpanded ? (
          <div
            className="border-t bg-background/35 px-3 py-3"
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <div className="space-y-3">
              {details.map((detail) => (
                <div key={detail.label} className="space-y-1.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    {detail.label}
                  </div>
                  <div className="max-h-72 overflow-auto rounded-md border bg-muted/20 p-2 text-[11px]">
                    <JsonNode data={detail.value} depth={0} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
