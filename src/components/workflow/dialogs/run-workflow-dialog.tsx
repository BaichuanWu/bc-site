'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { Loader2 } from "lucide-react"

interface RunWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  definitionId: number
  title: string
  description?: string
  initialInput?: Record<string, unknown>
}

function formatInitialInput(initialInput?: Record<string, unknown>) {
  return JSON.stringify(initialInput || {}, null, 2)
}

export function RunWorkflowDialog({
  open,
  onOpenChange,
  definitionId,
  title,
  description,
  initialInput,
}: RunWorkflowDialogProps) {
  const navigate = useWorkspaceNavigate()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [inputText, setInputText] = React.useState(() =>
    formatInitialInput(initialInput),
  )

  React.useEffect(() => {
    if (!open) return
    setInputText(formatInitialInput(initialInput))
  }, [initialInput, open])

  const handleRun = async () => {
    setIsLoading(true)
    setError("")
    try {
      const input: unknown = JSON.parse(inputText)
      if (input === null || typeof input !== "object" || Array.isArray(input)) {
        throw new Error("Workflow input must be a JSON object")
      }
      const created = await apiClient.post("/workflow-instances", {
        definitionId,
        input,
        config: { autoAdvance: false },
      }) as { id: number }
      onOpenChange(false)
      navigate(`/dashboard/workflow-instances/${created.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to start workflow")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Run {title}</DialogTitle>
          <DialogDescription>
            {description || "Configure the execution parameters for this AI workflow."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="run-input">Workflow input JSON</Label>
            <Textarea
              id="run-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[260px] font-mono text-xs"
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleRun} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
