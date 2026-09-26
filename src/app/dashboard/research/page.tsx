"use client"

import * as React from "react"
import { ChevronRightIcon, FlaskConicalIcon, Loader2Icon } from "lucide-react"

import { CrudLayout, type ItemsRenderProps } from "@/components/common/crud-layout"
import type { SearchFilterItem } from "@/components/common/query-filters"
import { ResearchStatusBadge } from "@/components/research/status-badge"
import type { ResearchRun } from "@/components/research/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/date-utils"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { WorkspaceLink } from "@/components/workspace/workspace-link"

function metricPreview(metrics?: Record<string, unknown>) {
  if (!metrics || Object.keys(metrics).length === 0) return "No metrics"
  return Object.entries(metrics)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" • ")
}

function ResearchRunGrid({ items }: ItemsRenderProps<ResearchRun>) {
  if (!items.length) {
    return (
      // dashboard-standards-ignore-next-line: Empty state belongs to the list renderer, not the page root.
      <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        No research runs match the current filters.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {items.map((run) => (
        <Card key={run.id} className="flex h-full flex-col shadow-none transition-colors hover:border-primary/40">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{run.displayName}</CardTitle>
                <div className="mt-1 truncate font-mono text-xs text-muted-foreground">
                  #{run.id} • {run.ref}
                </div>
              </div>
              <ResearchStatusBadge status={run.status} statusName={run.statusName} />
            </div>
            <div className="line-clamp-2 text-xs text-muted-foreground">
              {metricPreview(run.metrics)}
            </div>
          </CardHeader>
          <CardContent className="mt-auto space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{run.counts?.experiments || 0} experiments</Badge>
              <Badge variant="outline">{run.counts?.knowledge || 0} knowledge</Badge>
              <Badge variant="outline">{run.counts?.proposals || 0} proposals</Badge>
              <Badge variant="secondary">{run.counts?.iterationCandidates || 0} candidates</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 border-t pt-3">
              <div className="text-xs text-muted-foreground">
                {formatDateTime(run.startedTime, "No start time")}
              </div>
              <WorkspaceLink href={`/dashboard/research/${run.id}`}>
                <Button variant="ghost" size="sm" className="gap-1">
                  Details
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </WorkspaceLink>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ResearchRunsPage() {
  useWorkspaceTabTitle("/dashboard/research", "Research")

  const filterItems: SearchFilterItem[] = React.useMemo(
    () => [
      { key: "ref", label: "Ref", type: "text" },
      { key: "title", label: "Title", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "number",
        options: [
          { label: "Draft", value: 0 },
          { label: "Running", value: 10 },
          { label: "Completed", value: 20 },
          { label: "Failed", value: 30 },
          { label: "Cancelled", value: 40 },
        ],
      },
    ],
    [],
  )

  return (
    <CrudLayout<ResearchRun>
      icon={FlaskConicalIcon}
      title="Research Runs"
      endpoint="/research/runs"
      filterItems={filterItems}
      storageKey="research-run-filters"
      itemsRender={ResearchRunGrid}
      stickyTop={0}
      defaultPageSize={20}
      headerActions={
        <Button variant="outline" disabled className="gap-2">
          <Loader2Icon className="h-4 w-4 opacity-40" />
          Read Only
        </Button>
      }
    />
  )
}
