'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api"
import { parseJsonText } from "@/lib/json-utils"
import { useAsyncAction } from "@/hooks/use-async-action"
import { showTaskStartedToast } from "@/components/task/task-started-toast"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

interface RunWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowName: string
  title: string
  description?: string
  initialKwargs?: Record<string, unknown>
  showSessionId?: boolean
  renderForm?: () => React.ReactNode
}

type RunTaskResponse = {
  taskId: number | string
}

function formatInitialKwargs(initialKwargs?: Record<string, unknown>) {
  return JSON.stringify(initialKwargs || {}, null, 2)
}

export function RunWorkflowDialog({
  open,
  onOpenChange,
  workflowName,
  title,
  description,
  initialKwargs,
  showSessionId = false,
  renderForm,
}: RunWorkflowDialogProps) {
  const navigate = useWorkspaceNavigate()
  const runAction = useAsyncAction()
  const [sessionId, setSessionId] = React.useState("")
  const [kwargsText, setKwargsText] = React.useState(() =>
    formatInitialKwargs(initialKwargs),
  )

  React.useEffect(() => {
    if (!open) return
    setKwargsText(formatInitialKwargs(initialKwargs))
    setSessionId("")
  }, [initialKwargs, open])

  const handleRun = async () => {
    await runAction.run(
      async () => {
        const kwargs = parseJsonText(kwargsText, {})
        const payload: Record<string, unknown> = { kwargs }
        if (showSessionId && sessionId.trim()) {
          payload.sessionId = sessionId.trim()
        }
        return (await apiClient.post(`/sys/tasks/run/${workflowName}`, payload)) as RunTaskResponse
      },
      {
        errorMessage: "Failed to start workflow",
        onSuccess: async (res) => {
          showTaskStartedToast(res.taskId, () =>
            navigate(`/dashboard/sys-task/${res.taskId}`),
          )
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={renderForm ? "sm:max-w-[425px]" : "max-w-[720px]"}>
        <DialogHeader>
          <DialogTitle>Run {title}</DialogTitle>
          <DialogDescription>
            {description || "Configure the execution parameters for this AI workflow."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {showSessionId ? (
            <div className="grid gap-2">
              <Label htmlFor="run-session-id">Session ID</Label>
              <Input
                id="run-session-id"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Optional SSE session id"
              />
            </div>
          ) : null}

          {renderForm ? (
            renderForm()
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="run-kwargs">Task kwargs JSON</Label>
              <Textarea
                id="run-kwargs"
                value={kwargsText}
                onChange={(e) => setKwargsText(e.target.value)}
                className="min-h-[260px] font-mono text-xs"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleRun} disabled={runAction.isLoading}>
            {runAction.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Execute Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
