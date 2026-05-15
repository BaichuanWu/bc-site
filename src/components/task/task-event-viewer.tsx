"use client"

import {
  ActivityIcon,
  ChevronRightIcon,
  MessageSquareIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { JsonNode } from "@/components/common/json-node"
import { TASK_STATE } from "@/lib/constants"
import { formatDateTime, formatTime } from "@/lib/date-utils"
import {
  getStatusColor,
  mapServerStateToStatus,
  mapStatusToName,
} from "@/lib/task-utils"
import {
  getTaskEventArtifactData,
  getTaskEventConversationId,
  getTaskEventData,
  isRecord,
} from "@/lib/task-events"
import { cn } from "@/lib/utils"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
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
  if (event.type === "task.result") return "Final workflow output"
  if (event.type === "task.failed" || event.type === "task.stopped") {
    return event.message || "Task execution failed"
  }
  const config = TASK_EVENT_KIND_CONFIG[getPayloadKind(event)]
  if (config?.summary) return config.summary(event)
  return "Generic task event payload"
}

type TaskEventViewerProps = {
  event: TaskEventRecord
}

export function TaskEventViewer({ event }: TaskEventViewerProps) {
  const navigate = useWorkspaceNavigate()
  const eventData = getTaskEventData(event)
  const eventStatus = getEventStatus(event)
  const eventTone = getEventStatusTone(eventStatus)
  const eventTitle = getEventTitle(event)
  const isResultEvent = event.type === "task.result"
  const resultData = event.data
  const payloadKind = getPayloadKind(event)
  const conversationId = getTaskEventConversationId(event)
  const displayInput = eventData?.input
  const displayOutput = eventData?.output
  const artifactData = getTaskEventArtifactData(event, isResultEvent)

  return (
    <>
      <div
        className={cn(
          "absolute -left-[31px] top-6 h-2 w-2 rounded-full ring-4 ring-background z-10 transition-all group-hover:scale-125",
          eventTone.badge,
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
                {formatTime(event.timestamp)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground line-clamp-1 opacity-70">
                {getEventSummary(event)}
              </p>
              {conversationId ? (
                <Badge variant="secondary" className="ml-3 h-5 text-[9px] uppercase">
                  Conversation #{conversationId}
                </Badge>
              ) : null}
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
                  eventTone.panel,
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
                      eventTone.dot,
                    )}
                  />
                  {mapStatusToName(mapServerStateToStatus(eventStatus))} •{" "}
                  {formatDateTime(event.timestamp, "N/A")}
                </SheetDescription>
              </div>
              {conversationId ? (
                <Button
                  variant="outline"
                  className="ml-auto"
                  onClick={() =>
                    navigate(
                      "/dashboard/conversation",
                      `conversationId=${conversationId}`,
                      { title: `Conversation #${conversationId}` },
                    )
                  }
                >
                  <MessageSquareIcon className="mr-2 h-4 w-4" />
                  Open Conversation
                </Button>
              ) : null}
            </div>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-8 max-w-full mx-auto">
              {!isResultEvent && displayInput !== undefined ? (
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30 text-center">
                    Input
                  </h4>
                  <div className="bg-muted/10 p-6 rounded-3xl border border-border shadow-2xl">
                    <JsonNode data={displayInput} depth={0} />
                  </div>
                </div>
              ) : null}

              {!isResultEvent && displayOutput !== undefined && displayOutput !== null ? (
                <div className="mt-16 pt-16 border-t border-white/5 space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30 text-center">
                    Output
                  </h4>
                  <div className="bg-muted/10 p-6 rounded-3xl border border-border shadow-2xl">
                    <JsonNode data={displayOutput} depth={0} />
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
                    Event Payload
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
