"use client"

import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { ExternalLink, X } from "lucide-react"
import { toast } from "sonner"

type TaskStartedToastProps = {
  taskId: string | number
  toastId: string | number
  onOpen: () => void
}

function TaskStartedToast({ taskId, toastId, onOpen }: TaskStartedToastProps) {
  return (
    <div
      className="group w-[360px] cursor-pointer rounded-xl border bg-background p-4 shadow-lg transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-xl"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="text-sm font-semibold">Workflow started successfully</div>
          <div className="text-xs text-muted-foreground">
            Task #{taskId} is running. Click to open the task detail page.
          </div>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation()
            toast.dismiss(toastId)
          }}
          aria-label="Close task notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
        <span className="font-mono text-foreground">Task ID: {taskId}</span>
        <span className="inline-flex items-center gap-1 text-primary">
          Open task
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  )
}

export function showTaskStartedToast(router: AppRouterInstance, taskId: string | number) {
  const taskHref = `/dashboard/sys-task/${taskId}`
  toast.custom(
    (toastId) => (
      <TaskStartedToast
        taskId={taskId}
        toastId={toastId}
        onOpen={() => {
          router.push(taskHref)
          toast.dismiss(toastId)
        }}
      />
    ),
    {
      duration: Infinity,
    }
  )
}
