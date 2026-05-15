"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDateTime } from "@/lib/date-utils"

type WorkflowVersionBase = {
  id: number
  name: string
  version: string
  title: string
  status: number | string
  publishedTime?: string
}

type WorkflowVersionsDialogProps<T extends WorkflowVersionBase> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowName?: string
  versions: T[]
  isLoading?: boolean
  getStatusLabel: (status: number | string) => string
  onRun: (workflow: T) => void
  onDuplicate: (workflow: T) => void
  onOpenInEditor: (workflow: T) => void
}

export function WorkflowVersionsDialog<T extends WorkflowVersionBase>({
  open,
  onOpenChange,
  workflowName,
  versions,
  isLoading = false,
  getStatusLabel,
  onRun,
  onDuplicate,
  onOpenInEditor,
}: WorkflowVersionsDialogProps<T>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[860px]">
        <DialogHeader>
          <DialogTitle>Workflow Versions</DialogTitle>
          <DialogDescription>
            Browse historical versions for <code>{workflowName}</code> and reopen any version in the editor.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto rounded-xl border">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading versions...
            </div>
          ) : versions.length > 0 ? (
            <div className="divide-y">
              {versions.map((record) => (
                <div key={record.id} className="flex items-start justify-between gap-4 p-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{record.name}</span>
                      <Badge variant="outline">{record.version}</Badge>
                      <Badge variant={Number(record.status) === 10 ? "default" : "secondary"}>
                        {getStatusLabel(record.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{record.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Published: {formatDateTime(record.publishedTime)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRun(record)}
                      disabled={Number(record.status) !== 10}
                    >
                      Run
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onDuplicate(record)}
                    >
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onOpenInEditor(record)}
                    >
                      Open in Editor
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No versions found.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
