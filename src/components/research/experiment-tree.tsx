"use client"

import useSWR from "swr"
import { GitBranchIcon } from "lucide-react"

import { ResearchArtifactDrawer } from "@/components/research/artifact-drawer"
import { ResearchStatusBadge } from "@/components/research/status-badge"
import type { ResearchExperiment } from "@/components/research/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { normalizeCrudListResponse } from "@/lib/crud-response"
import { cn } from "@/lib/utils"

export function ResearchExperimentTree({
  runId,
}: {
  runId: number
}) {
  const { data: experiments = [], isLoading } = useSWR<ResearchExperiment[]>(
    `/research/runs/${runId}/experiments`,
    async (url: string) => normalizeCrudListResponse<ResearchExperiment>(await apiClient.get(url)),
  )

  if (isLoading) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
        Loading experiments...
      </div>
    )
  }

  if (experiments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
        No experiments recorded for this research run.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {experiments.map((experiment) => (
        <Card
          key={experiment.id}
          className="shadow-none"
          style={{ marginLeft: `${Math.min(experiment.depth || 0, 6) * 24}px` }}
        >
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                experiment.depth > 0 ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
              )}
            >
              <GitBranchIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-sm font-semibold">{experiment.displayName}</div>
                <ResearchStatusBadge
                  status={experiment.status}
                  statusName={experiment.statusName}
                />
              </div>
              <div className="truncate font-mono text-xs text-muted-foreground">
                #{experiment.id} • {experiment.ref}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{experiment.proposalCount || 0} proposals</Badge>
              <Badge variant="outline">{experiment.candidateCount || 0} candidates</Badge>
              <Badge variant="secondary">{experiment.knowledgeCount || 0} knowledge</Badge>
            </div>
            <ResearchArtifactDrawer experiment={experiment} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
