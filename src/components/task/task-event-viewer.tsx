"use client"

import {
  ActivityIcon,
  ChevronRightIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { JsonNode } from "@/components/common/json-node"
import { DialogueTranscript } from "@/components/task/dialogue-transcript"
import { TASK_EVENT_TYPE, TASK_STATE } from "@/lib/constants"
import {
  getStatusColor,
  mapServerStateToStatus,
  mapStatusToName,
} from "@/lib/task-utils"
import { cn } from "@/lib/utils"

export type TaskEventPayload = {
  kind?: string
  step?: string
  node?: string
  status?: number
  message?: string
  result?: unknown
  messages?: unknown[]
  trace?: unknown[]
  data?: Record<string, unknown> | null
}

export type TaskEventRecord = {
  id: number | string
  typ: number
  message?: string
  createTime?: string
  payload?: TaskEventPayload
}

type TaskEventKindConfig = {
  title?: string
  summary?: (event: TaskEventRecord) => string
  showTranscript?: boolean
}

const TASK_EVENT_KIND_CONFIG: Record<string, TaskEventKindConfig> = {
  workflow_node: {
    summary: (event) => `Audit trail for ${event.payload?.step || "step"}`,
    showTranscript: true,
  },
  agent_run: {
    summary: (event) => `Agent execution for ${event.payload?.node || "node"}`,
    showTranscript: true,
  },
  batch_progress: {
    title: "Batch Progress",
    summary: () => "Incremental execution progress and runtime artifacts",
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function getPayloadKind(event: TaskEventRecord) {
  return event?.payload?.kind || "generic"
}

function getTraceArtifacts(trace: unknown): Record<string, unknown>[] {
  if (!Array.isArray(trace)) return []
  return trace.filter(
    (item): item is Record<string, unknown> =>
      isRecord(item) && item.type !== "message_added",
  )
}

function getEventTitle(event: TaskEventRecord) {
  if (event.typ === TASK_EVENT_TYPE.RESULT) return "Final Result"
  if (event.typ === TASK_EVENT_TYPE.ERROR) return "Task Error"
  const config = TASK_EVENT_KIND_CONFIG[getPayloadKind(event)]
  if (config?.title) return config.title
  return event.payload?.step || event.payload?.node || "Task Event"
}

function getEventStatus(event: TaskEventRecord) {
  if (event.typ === TASK_EVENT_TYPE.RESULT) return TASK_STATE.SUCCESS
  if (event.typ === TASK_EVENT_TYPE.ERROR) return TASK_STATE.ERROR
  return event.payload?.status || 0
}

function getEventSummary(event: TaskEventRecord) {
  if (event.message) return event.message
  if (event.typ === TASK_EVENT_TYPE.RESULT) return "Final workflow output"
  if (event.typ === TASK_EVENT_TYPE.ERROR) {
    return event.payload?.message || "Task execution failed"
  }
  const config = TASK_EVENT_KIND_CONFIG[getPayloadKind(event)]
  if (config?.summary) return config.summary(event)
  return "Generic task event payload"
}

type TaskEventViewerProps = {
  event: TaskEventRecord
}

export function TaskEventViewer({ event }: TaskEventViewerProps) {
  const eventStatus = getEventStatus(event)
  const eventTitle = getEventTitle(event)
  const isResultEvent = event.typ === TASK_EVENT_TYPE.RESULT
  const resultData = event.payload?.result
  const payloadKind = getPayloadKind(event)
  const traceArtifacts = getTraceArtifacts(event.payload?.trace)
  const shouldShowTranscript =
    !isResultEvent && Boolean(TASK_EVENT_KIND_CONFIG[payloadKind]?.showTranscript)
  const artifactData = isResultEvent
    ? null
    : isRecord(event.payload?.data)
      ? event.payload.data
      : event.payload

  return (
    <>
      <div
        className={cn(
          "absolute -left-[31px] top-6 h-2 w-2 rounded-full ring-4 ring-background z-10 transition-all group-hover:scale-125",
          eventStatus === TASK_STATE.SUCCESS
            ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
            : eventStatus === TASK_STATE.RUNNING
              ? "bg-blue-500 animate-pulse"
              : eventStatus === TASK_STATE.ERROR
                ? "bg-red-500"
                : "bg-muted",
        )}
      />

      <Sheet>
        <SheetTrigger asChild>
          <div className="p-4 rounded-2xl bg-card/50 hover:bg-card border border-transparent hover:border-border hover:shadow-2xl hover:shadow-primary/5 cursor-pointer transition-all">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black tracking-tight uppercase">
                  {eventTitle}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[8px] h-3.5 font-black uppercase tracking-widest bg-muted/50 text-muted-foreground"
                >
                  {payloadKind}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[8px] h-3.5 font-black uppercase tracking-widest",
                    getStatusColor(eventStatus),
                  )}
                >
                  {mapStatusToName(mapServerStateToStatus(eventStatus))}
                </Badge>
              </div>
              <span className="text-[9px] font-mono opacity-40">
                {event.createTime
                  ? new Date(event.createTime).toLocaleTimeString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground line-clamp-1 opacity-70">
                {getEventSummary(event)}
              </p>
              <ChevronRightIcon className="h-3.5 w-3.5 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="sm:max-w-[80vw] w-full flex flex-col p-0 overflow-hidden border-l border-border shadow-2xl bg-background/95 backdrop-blur-xl"
        >
          <SheetHeader className="p-8 border-b border-border bg-muted/5">
            <div className="flex items-center gap-6">
              <div
                className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-2xl",
                  eventStatus === TASK_STATE.SUCCESS ? "bg-green-600" : "bg-blue-600",
                )}
              >
                <ActivityIcon className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <SheetTitle className="text-3xl font-black italic uppercase tracking-tighter">
                  {eventTitle}
                </SheetTitle>
                <SheetDescription className="text-xs font-mono opacity-50 flex items-center gap-2 uppercase tracking-widest">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      eventStatus === TASK_STATE.SUCCESS
                        ? "bg-green-500"
                        : "bg-blue-500",
                    )}
                  />
                  {mapStatusToName(mapServerStateToStatus(eventStatus))} •{" "}
                  {event.createTime
                    ? new Date(event.createTime).toLocaleString()
                    : "N/A"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-8 max-w-full mx-auto">
              {shouldShowTranscript ? (
                <DialogueTranscript messages={event.payload?.messages || []} />
              ) : null}

              {traceArtifacts.length > 0 ? (
                <div className="mt-16 pt-16 border-t border-white/5 space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30 text-center">
                    Trace Events
                  </h4>
                  <div className="bg-muted/10 p-6 rounded-3xl border border-border shadow-2xl">
                    <JsonNode data={traceArtifacts} depth={0} />
                  </div>
                </div>
              ) : null}

              {isResultEvent && resultData ? (
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30 text-center">
                    Final Output
                  </h4>
                  <div className="bg-muted/10 p-6 rounded-3xl border border-border shadow-2xl">
                    <JsonNode data={resultData} depth={0} />
                  </div>
                </div>
              ) : null}

              {isRecord(artifactData) && Object.keys(artifactData).length > 0 ? (
                <div className="mt-16 pt-16 border-t border-white/5 space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30 text-center">
                    {shouldShowTranscript ? "Process Artifacts" : "Event Payload"}
                  </h4>
                  <div className="bg-muted/10 p-6 rounded-3xl border border-border shadow-2xl">
                    <JsonNode data={artifactData} depth={0} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
