'use client'

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api"
import { parseJsonText } from "@/lib/json-utils"
import { useAsyncAction } from "@/hooks/use-async-action"
import { showTaskStartedToast } from "@/components/task/task-started-toast"
import { Loader2 } from "lucide-react"
import type { JsonObject } from "@/types/json"

interface RunWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowName: string
  title: string
  description?: string
  mode?: "config" | "json"
  initialKwargs?: Record<string, unknown>
  showSessionId?: boolean
}

type RunTaskResponse = {
  task_id: number | string
}

export function RunWorkflowDialog({
  open,
  onOpenChange,
  workflowName,
  title,
  description,
  mode = "config",
  initialKwargs,
  showSessionId = false,
}: RunWorkflowDialogProps) {
  const router = useRouter()
  const runAction = useAsyncAction()
  const [region, setRegion] = React.useState("USA")
  const [datasetId, setDatasetId] = React.useState("top_v1")
  const [universe, setUniverse] = React.useState("TOP3000")
  const [delay, setDelay] = React.useState("1")
  const [sessionId, setSessionId] = React.useState("")
  const [kwargsText, setKwargsText] = React.useState(
    JSON.stringify(
      initialKwargs || {
        config: {
          region: "USA",
          dataset_id: "top_v1",
          universe: "TOP3000",
          delay: 1,
        },
      },
      null,
      2
    )
  )

  React.useEffect(() => {
    if (!open) return
    if (mode === "json") {
      setKwargsText(
        JSON.stringify(
          initialKwargs || {
            config: {
              region: "USA",
              dataset_id: "top_v1",
              universe: "TOP3000",
              delay: 1,
            },
          },
          null,
          2
        )
      )
      setSessionId("")
      return
    }
    const config = (initialKwargs?.config as JsonObject | undefined) || {}
    setRegion(String(config.region || "USA"))
    setDatasetId(String(config.dataset_id || "top_v1"))
    setUniverse(String(config.universe || "TOP3000"))
    setDelay(String(config.delay || 1))
    setSessionId("")
  }, [initialKwargs, mode, open])

  const handleRun = async () => {
    await runAction.run(
      async () => {
        const kwargs =
          mode === "json"
            ? parseJsonText(kwargsText, {})
            : {
                config: {
                  region,
                  dataset_id: datasetId,
                  universe,
                  delay: parseInt(delay) || 1,
                },
              }
        const payload: Record<string, unknown> = { kwargs }
        if (showSessionId && sessionId.trim()) {
          payload.session_id = sessionId.trim()
        }
        return (await apiClient.post(`/sys/run/${workflowName}`, payload)) as RunTaskResponse
      },
      {
        errorMessage: "Failed to start workflow",
        onSuccess: async (res) => {
          showTaskStartedToast(router, res.task_id)
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={mode === "json" ? "max-w-[720px]" : "sm:max-w-[425px]"}>
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

          {mode === "json" ? (
            <div className="grid gap-2">
              <Label htmlFor="run-kwargs">Task kwargs JSON</Label>
              <Textarea
                id="run-kwargs"
                value={kwargsText}
                onChange={(e) => setKwargsText(e.target.value)}
                className="min-h-[260px] font-mono text-xs"
              />
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="region">Region</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="ASI">ASI</SelectItem>
                    <SelectItem value="CHN">CHN</SelectItem>
                    <SelectItem value="JPN">JPN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="datasetId">Dataset ID</Label>
                <Input
                  id="datasetId"
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                  placeholder="e.g. top_v1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="universe">Universe</Label>
                <Input
                  id="universe"
                  value={universe}
                  onChange={(e) => setUniverse(e.target.value)}
                  placeholder="e.g. TOP3000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="delay">Delay (Days)</Label>
                <Input
                  id="delay"
                  type="number"
                  value={delay}
                  onChange={(e) => setDelay(e.target.value)}
                />
              </div>
            </>
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
