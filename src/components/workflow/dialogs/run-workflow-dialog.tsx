'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { parseJsonText } from "@/lib/json-utils"
import { useTaskAction } from "@/hooks/use-task-action"
import { Loader2 } from "lucide-react"

interface RunWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowName: string
  title: string
  description?: string
  initialKwargs?: Record<string, unknown>
  renderForm?: () => React.ReactNode
}

const WORKFLOW_TASK_NAME = "workflow_task"

function formatInitialKwargs(initialKwargs?: Record<string, unknown>) {
  return JSON.stringify(initialKwargs || {}, null, 2)
}

function toKwargs(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {}
}

export function RunWorkflowDialog({
  open,
  onOpenChange,
  workflowName,
  title,
  description,
  initialKwargs,
  renderForm,
}: RunWorkflowDialogProps) {
  const { runNamedTask, isLoading } = useTaskAction()
  const [kwargsText, setKwargsText] = React.useState(() =>
    formatInitialKwargs(initialKwargs),
  )

  React.useEffect(() => {
    if (!open) return
    setKwargsText(formatInitialKwargs(initialKwargs))
  }, [initialKwargs, open])

  const handleRun = async () => {
    const kwargs = toKwargs(parseJsonText(kwargsText, {}))
    kwargs.workflowName = workflowName

    await runNamedTask(
      WORKFLOW_TASK_NAME,
      {
        displayName: workflowName,
        kwargs,
      },
      {
        errorMessage: "Failed to start workflow",
        onSuccess: async () => {
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
          <Button onClick={handleRun} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Execute Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
