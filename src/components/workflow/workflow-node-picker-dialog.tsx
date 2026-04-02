"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type AgentOption = {
  id: number
  name: string
  version?: string
  title?: string
}

type WorkflowNodePickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  search: string
  onSearchChange?: (value: string) => void
  isLoading?: boolean
  agents: AgentOption[]
  onSelectAgent: (agent?: AgentOption) => void
}

export function WorkflowNodePickerDialog({
  open,
  onOpenChange,
  search,
  onSearchChange,
  isLoading = false,
  agents,
  onSelectAgent,
}: WorkflowNodePickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Add Workflow Node</DialogTitle>
          <DialogDescription>
            Choose an existing agent asset to create a new workflow node.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search agents by name"
          />
          <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-xl border bg-muted/10 p-3">
            {isLoading ? (
              <div className="rounded-xl border border-dashed bg-background/70 p-6 text-sm text-muted-foreground">
                Searching agents...
              </div>
            ) : agents.length > 0 ? (
              agents.map((agent) => (
                <button
                  key={`${agent.name}@@${agent.version || "1.0.0"}`}
                  type="button"
                  onClick={() => onSelectAgent(agent)}
                  className="flex w-full items-start justify-between rounded-xl border bg-background px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {agent.title || "No title"}
                    </div>
                  </div>
                  <Badge variant="outline">{agent.version || "1.0.0"}</Badge>
                </button>
              ))
            ) : (
              <div className="rounded-xl border border-dashed bg-background/70 p-6 text-sm text-muted-foreground">
                No agents matched your search.
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => onSelectAgent()}>
              Create Empty Node
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
