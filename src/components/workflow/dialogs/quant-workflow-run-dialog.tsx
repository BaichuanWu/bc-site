'use client'

import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RunWorkflowDialog } from "@/components/workflow/dialogs/run-workflow-dialog"

type QuantWorkflowRunDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowName: string
  title: string
  description?: string
  showSessionId?: boolean
}

export function QuantWorkflowRunDialog({
  open,
  onOpenChange,
  workflowName,
  title,
  description,
  showSessionId = false,
}: QuantWorkflowRunDialogProps) {
  const [region, setRegion] = React.useState("USA")
  const [datasetId, setDatasetId] = React.useState("top_v1")
  const [universe, setUniverse] = React.useState("TOP3000")
  const [delay, setDelay] = React.useState("1")

  const initialKwargs = React.useMemo(
    () => ({
      config: {
        region,
        dataset_id: datasetId,
        universe,
        delay: parseInt(delay, 10) || 1,
      },
    }),
    [delay, datasetId, region, universe],
  )

  return (
    <RunWorkflowDialog
      open={open}
      onOpenChange={onOpenChange}
      workflowName={workflowName}
      title={title}
      description={description}
      initialKwargs={initialKwargs}
      showSessionId={showSessionId}
      renderForm={() => (
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
    />
  )
}
