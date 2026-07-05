"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import useSWR from "swr"
import {
  Loader2Icon,
  MessageSquareIcon,
  PlayIcon,
  RefreshCwIcon,
} from "lucide-react"

import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { JsonNode } from "@/components/common/json-node"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { WorkspaceLink } from "@/components/workspace/workspace-link"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { apiClient, fetcher } from "@/lib/api"

type AgentExecutionDetail = {
  id: number
  agentId: number
  agentVersionId?: number
  status: number
  statusName: string
  inputJson?: unknown
  outputJson?: unknown
  errorLog?: string
  conversationId?: number | null
  agent?: {
    id: number
    name?: string
    agentClass?: string
    description?: string
  } | null
  version?: {
    id: number
    version?: string
    description?: string
  } | null
}

type AgentExecutionUpdate = {
  executionId?: number
  status?: number
  statusName?: string
  conversationId?: number | null
}

const STATUS_COMPLETED = 20
const STATUS_PAUSED = 25
const STATUS_FAILED = 30

function statusVariant(status?: number) {
  if (status === STATUS_PAUSED) return "secondary" as const
  if (status === STATUS_FAILED) return "destructive" as const
  if (status === STATUS_COMPLETED) return "default" as const
  return "outline" as const
}

function createSessionId(executionId: number) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `agent-execution-${executionId}-${crypto.randomUUID()}`
  }
  return `agent-execution-${executionId}-${Date.now()}`
}

export default function AgentExecutionDetailPage() {
  const params = useParams<{ executionId: string }>()
  const executionId = Number(params.executionId)
  const [inputText, setInputText] = React.useState("")
  const [isSendingInput, setIsSendingInput] = React.useState(false)
  const sessionId = React.useMemo(
    () => (Number.isFinite(executionId) && executionId > 0 ? createSessionId(executionId) : ""),
    [executionId],
  )

  const {
    data: execution,
    mutate,
    isLoading,
  } = useSWR<AgentExecutionDetail>(
    Number.isFinite(executionId) && executionId > 0 ? `/agent/execution/${executionId}` : null,
    fetcher,
  )

  useWorkspaceTabTitle(
    `/dashboard/agent-execution/${executionId}`,
    execution ? `Execution: #${execution.id}` : "Agent execution",
  )

  React.useEffect(() => {
    if (!sessionId || !executionId) return

    let closed = false
    const eventSource = new EventSource(
      `/api/v1/agent/execution/stream/session/${sessionId}`,
    )

    const subscribe = async () => {
      await apiClient.post("/agent/execution/subscription", {
        sessionId,
        executionIds: [executionId],
        action: "subscribe",
      })
    }

    eventSource.onopen = () => {
      if (!closed) void subscribe()
    }
    eventSource.addEventListener("agent_execution_update", (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as AgentExecutionUpdate
        if (payload.executionId === executionId) {
          void mutate()
        }
      } catch (error) {
        console.error("[AgentExecution] SSE parse error", error)
      }
    })
    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      closed = true
      void apiClient.post("/agent/execution/subscription", {
        sessionId,
        executionIds: [executionId],
        action: "unsubscribe",
      })
      eventSource.close()
    }
  }, [executionId, mutate, sessionId])

  const handleSendInput = React.useCallback(async () => {
    const content = inputText.trim()
    if (!content || !execution || execution.status !== STATUS_PAUSED || isSendingInput) return
    setIsSendingInput(true)
    try {
      setInputText("")
      if (execution.conversationId) {
        await apiClient.post(`/agent/conversation/${execution.conversationId}/send`, { content })
      } else {
        await apiClient.post(`/agent/execution/${execution.id}/input`, { content })
      }
      await mutate()
      if (execution.conversationId) {
        // Conversation detail owns message rendering; pre-warm its SWR cache key.
        await apiClient.get(`/agent/conversation/${execution.conversationId}/messages`)
      }
    } finally {
      setIsSendingInput(false)
    }
  }, [execution, inputText, isSendingInput, mutate])

  if (!Number.isFinite(executionId) || executionId <= 0) {
    return (
      <DetailPageLayout title="Agent execution" subtitle="Invalid execution id.">
        <div className="flex min-h-40 items-center justify-center rounded-lg border bg-muted/20 text-sm text-muted-foreground">
          Agent execution not found.
        </div>
      </DetailPageLayout>
    )
  }

  if (isLoading) {
    return (
      <DetailPageLayout title="Agent execution" subtitle="Loading execution trace...">
        <div className="flex h-[360px] items-center justify-center rounded-lg border bg-muted/20">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DetailPageLayout>
    )
  }

  if (!execution) {
    return (
      <DetailPageLayout title="Agent execution" subtitle={`Execution #${executionId} was not found.`}>
        <div className="flex min-h-40 items-center justify-center rounded-lg border bg-muted/20 text-sm text-muted-foreground">
          Agent execution not found.
        </div>
      </DetailPageLayout>
    )
  }

  const canSendInput = execution.status === STATUS_PAUSED

  return (
    <DetailPageLayout
      title={`Agent execution #${execution.id}`}
      subtitle={
        <span>
          {execution.agent?.name || `Agent #${execution.agentId}`}
          {execution.version?.version ? ` · ${execution.version.version}` : ""}
        </span>
      }
      badge={<Badge variant={statusVariant(execution.status)}>{execution.statusName}</Badge>}
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => void mutate()}>
            <RefreshCwIcon className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {execution.conversationId ? (
            <Button asChild type="button" variant="outline">
              <WorkspaceLink
                href={`/dashboard/conversation/${execution.conversationId}`}
                titleOverride={`Conversation #${execution.conversationId}`}
              >
                <MessageSquareIcon className="mr-2 h-4 w-4" />
                Conversation
              </WorkspaceLink>
            </Button>
          ) : null}
        </>
      }
      side={
        <>
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant(execution.status)}>{execution.statusName}</Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {execution.status}
                </span>
              </div>
              {execution.errorLog ? (
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                  {execution.errorLog}
                </pre>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <div>ID: {execution.agentId}</div>
              {execution.agent?.agentClass ? <div>Class: {execution.agent.agentClass}</div> : null}
              {execution.agentVersionId ? <div>Version ID: {execution.agentVersionId}</div> : null}
            </CardContent>
          </Card>
        </>
      }
    >
      {canSendInput ? (
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Send input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Add the next instruction for this paused execution..."
              className="min-h-24 resize-none"
            />
            <Button
              type="button"
              disabled={!inputText.trim() || isSendingInput}
              onClick={() => void handleSendInput()}
            >
              {isSendingInput ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayIcon className="mr-2 h-4 w-4" />
              )}
              Send input
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Input</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[420px] overflow-auto rounded-md border bg-muted/20 p-3">
              <JsonNode data={execution.inputJson || {}} depth={0} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Output</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[420px] overflow-auto rounded-md border bg-muted/20 p-3">
              <JsonNode data={execution.outputJson || {}} depth={0} />
            </div>
          </CardContent>
        </Card>
      </div>
    </DetailPageLayout>
  )
}
