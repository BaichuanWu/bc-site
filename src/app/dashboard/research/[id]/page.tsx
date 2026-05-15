"use client"

import * as React from "react"
import useSWR from "swr"
import { useParams } from "next/navigation"
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ClockIcon,
  FlaskConicalIcon,
  Loader2Icon,
} from "lucide-react"

import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { ResearchExperimentTree } from "@/components/research/experiment-tree"
import { ResearchJsonPanel } from "@/components/research/json-panel"
import { ResearchStatusBadge } from "@/components/research/status-badge"
import type { ResearchKnowledge, ResearchRun, ResearchTraceItem } from "@/components/research/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { apiClient } from "@/lib/api"
import { formatDateTime } from "@/lib/date-utils"
import { isRecord } from "@/lib/json-utils"

function asList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function getResultList(result: unknown, camelKey: string, snakeKey: string) {
  if (!isRecord(result)) return []
  return asList(result[camelKey] ?? result[snakeKey])
}

function getEvaluation(result: unknown) {
  if (!isRecord(result)) return null
  return isRecord(result.evaluation) ? result.evaluation : null
}

function TraceList({ trace }: { trace?: ResearchTraceItem[] }) {
  if (!trace || trace.length === 0) {
    return (
      // dashboard-standards-ignore-next-line: Empty state belongs to a local tab renderer, not the page root.
      <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
        No trace recorded for this run.
      </div>
    )
  }
  return (
    <div className="relative space-y-3 pl-6">
      <div className="absolute bottom-2 left-2 top-2 w-px bg-border" />
      {trace.map((item, index) => (
        <Card key={`${item.phase || "phase"}-${index}`} className="relative shadow-none">
          <div className="absolute -left-[22px] top-5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold">{item.title || item.phase || "Trace"}</div>
              <Badge variant="outline">{item.phase || "trace"}</Badge>
            </div>
            {item.summary ? (
              <div className="mt-1 text-sm text-muted-foreground">{item.summary}</div>
            ) : null}
            <div className="mt-2 text-xs text-muted-foreground">
              {formatDateTime(item.time, "")}
            </div>
            {item.metadata && Object.keys(item.metadata).length > 0 ? (
              <div className="mt-3 rounded-lg bg-muted/30 p-3">
                <ResearchJsonPanel title="Metadata" data={item.metadata} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function KnowledgeList({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) {
    return <EmptyState label="No knowledge produced by this run result." />
  }
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <Card key={String(item.knowledgeRef || item.knowledge_ref || index)} className="shadow-none">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{String(item.typ || "knowledge")}</Badge>
              <Badge variant="outline">confidence {String(item.confidence ?? "-")}</Badge>
            </div>
            <p className="text-sm leading-6">{String(item.content || "")}</p>
            <ResearchJsonPanel title="Knowledge Data" data={item} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ProposalList({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) return <EmptyState label="No proposals produced by this run result." />
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <Card key={String(item.proposalRef || item.proposal_ref || index)} className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{String(item.summary || "Proposal")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{String(item.targetRef || item.target_ref || "")}</Badge>
              <Badge variant="secondary">{String(item.targetPartRef || item.target_part_ref || "")}</Badge>
            </div>
            {item.rationale ? <p className="text-sm text-muted-foreground">{String(item.rationale)}</p> : null}
            <ResearchJsonPanel title="Suggested Change" data={item.suggestedChange ?? item.suggested_change ?? {}} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CandidateList({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) return <EmptyState label="No iteration candidates produced by this run result." />
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <Card key={String(item.candidateRef || item.candidate_ref || index)} className="shadow-none">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{String(item.candidateRef || item.candidate_ref || "candidate")}</Badge>
              <Badge variant="outline">{String(item.targetRef || item.target_ref || "")}</Badge>
            </div>
            {item.summary ? <p className="text-sm text-muted-foreground">{String(item.summary)}</p> : null}
            <ResearchJsonPanel title="Artifacts" data={item.artifacts || {}} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    // dashboard-standards-ignore-next-line: Empty state belongs to a local tab renderer, not the page root.
    <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
      {label}
    </div>
  )
}

export default function ResearchRunDetailPage() {
  const params = useParams<{ id: string }>()
  const navigate = useWorkspaceNavigate()
  const runId = Number(params.id)
  const { data: run, isLoading } = useSWR<ResearchRun>(
    Number.isFinite(runId) && runId > 0 ? `/research/runs/${runId}` : null,
    async (url: string) => (await apiClient.get(url)) as ResearchRun,
  )

  useWorkspaceTabTitle(
    `/dashboard/research/${params.id}`,
    run ? `Research: ${run.displayName}` : `Research: ${params.id}`,
  )

  const evaluation = getEvaluation(run?.result)
  const knowledge = getResultList(run?.result, "knowledge", "knowledge") as ResearchKnowledge[]
  const proposals = getResultList(run?.result, "proposals", "proposals")
  const candidates = getResultList(run?.result, "iterationCandidates", "iteration_candidates")

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin opacity-40" />
      </div>
    )
  }

  if (!run || !Number.isFinite(runId) || runId <= 0) {
    return (
      <DetailPageLayout title="Research Run" subtitle="Research run not found.">
        <EmptyState label="Research run not found." />
      </DetailPageLayout>
    )
  }

  return (
    <DetailPageLayout
      title={run.displayName}
      subtitle={
        <span className="font-mono">
          #{run.id} • {run.ref}
        </span>
      }
      badge={<ResearchStatusBadge status={run.status} statusName={run.statusName} />}
      actions={
        <Button variant="outline" onClick={() => navigate("/dashboard/research")}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Research Runs
        </Button>
      }
      side={
        // dashboard-standards-ignore-next-line: DetailPageLayout side slot expects the local stack wrapper here.
        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ClockIcon className="h-4 w-4" />
                Run Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Started</span>
                <span className="text-right">{formatDateTime(run.startedTime)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Finished</span>
                <span className="text-right">{formatDateTime(run.finishedTime)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Badge variant="outline">{run.counts?.experiments || 0} experiments</Badge>
                <Badge variant="outline">{run.counts?.knowledgeRows || run.counts?.knowledge || 0} knowledge</Badge>
                <Badge variant="outline">{run.counts?.proposals || 0} proposals</Badge>
                <Badge variant="secondary">{run.counts?.iterationCandidates || 0} candidates</Badge>
              </div>
            </CardContent>
          </Card>
          <ResearchJsonPanel title="Metrics" data={run.metrics || {}} />
          <ResearchJsonPanel title="Input" data={run.input || {}} />
        </div>
      }
    >
      {run.errorLog ? (
        <Card className="border-destructive/30 bg-destructive/5 shadow-none">
          <CardContent className="flex gap-3 p-4 text-sm text-destructive">
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <pre className="whitespace-pre-wrap break-words">{run.errorLog}</pre>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="trace">Trace</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConicalIcon className="h-4 w-4" />
                Evaluation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {evaluation ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{String(evaluation.decision || "review")}</Badge>
                    <Badge variant="outline">score {String(evaluation.score ?? "-")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{String(evaluation.summary || "")}</p>
                  <ResearchJsonPanel title="Evaluation Data" data={evaluation} />
                </>
              ) : (
                <EmptyState label="No evaluation found in result JSON." />
              )}
            </CardContent>
          </Card>
          <ResearchJsonPanel title="Result" data={run.result || {}} />
        </TabsContent>

        <TabsContent value="experiments">
          <ResearchExperimentTree runId={run.id} />
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgeList items={knowledge as unknown as Record<string, unknown>[]} />
        </TabsContent>

        <TabsContent value="proposals">
          <ProposalList items={proposals} />
        </TabsContent>

        <TabsContent value="candidates">
          <CandidateList items={candidates} />
        </TabsContent>

        <TabsContent value="trace">
          <TraceList trace={run.trace} />
        </TabsContent>
      </Tabs>
    </DetailPageLayout>
  )
}
