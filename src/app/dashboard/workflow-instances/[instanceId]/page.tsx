"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"

import { ConversationThread } from "@/app/dashboard/conversation/_components/conversation-thread"
import { WorkflowInstanceGraph } from "@/components/workflow/instance-graph"
import type { AgentExecutionRecord, ConversationMessage, MessagesResponse } from "@/app/dashboard/conversation/types"
import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiClient, fetcher } from "@/lib/api"
import { currentAttempt, type WorkflowInstance } from "@/lib/workflow-instances"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"

export default function WorkflowInstancePage() {
  const params = useParams<{ instanceId: string }>()
  const instanceId = Number(params.instanceId)
  const navigate = useWorkspaceNavigate()
  const { data: instance, mutate } = useSWR<WorkflowInstance>(
    Number.isFinite(instanceId) && instanceId > 0 ? `/workflow-instances/${instanceId}` : null,
    fetcher,
    { refreshInterval: 3000 },
  )
  const [selected, setSelected] = React.useState("")
  const [input, setInput] = React.useState("")
  const [model, setModel] = React.useState("")
  const [adoptJson, setAdoptJson] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState("")
  const key = selected || instance?.definitionJson.nodes[0]?.key || ""
  const node = instance?.nodesJson[key]
  const attempt = instance ? currentAttempt(instance, key) : undefined
  const { data: execution } = useSWR<AgentExecutionRecord>(
    attempt?.agentExecutionId ? `/agent/execution/${attempt.agentExecutionId}` : null,
    fetcher,
  )
  const conversationId = execution?.conversationId || 0
  const { data: messages, mutate: mutateMessages } = useSWR<MessagesResponse>(
    conversationId ? `/agent/conversation/${conversationId}/messages` : null,
    fetcher,
    { refreshInterval: 3000 },
  )

  async function command(path: string, body: Record<string, unknown> = {}) {
    if (!instance) return
    setBusy(true)
    setError("")
    try {
      const result = await apiClient.post(`/workflow-instances/${instance.id}/nodes/${key}/${path}`, {
        revision: instance.revision, ...body,
      }) as WorkflowInstance
      await mutate(result, { revalidate: true })
      return result
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Command failed")
    } finally {
      setBusy(false)
    }
  }

  async function setAuto(enabled: boolean) {
    if (!instance) return
    setBusy(true)
    try {
      await apiClient.put(`/workflow-instances/${instance.id}/nodes/${key}/auto-advance`, { revision: instance.revision, enabled })
      await mutate()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update node")
    } finally { setBusy(false) }
  }

  async function saveModel() {
    if (!instance || !model.trim()) return
    setBusy(true)
    try {
      await apiClient.put(`/workflow-instances/${instance.id}/nodes/${key}/model`, {
        revision: instance.revision, llmOverrides: { model: model.trim() },
      })
      await mutate()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update model")
    } finally { setBusy(false) }
  }

  async function send() {
    if (!input.trim()) return
    const content = input.trim()
    setInput("")
    const result = await command("chat", { content, llmConfig: model ? { model } : {} })
    if (!result) setInput(content)
    await mutateMessages()
  }

  const ordered = instance?.definitionJson.nodes || []
  const completed = ordered.filter((item) => instance?.nodesJson[item.key]?.status === "approved").length

  return <DetailPageLayout title={`Workflow run #${instanceId}`} subtitle={instance ? `${instance.definitionJson.name} · ${completed}/${ordered.length} approved · ${instance.status}` : "Loading..."}
    actions={<Link href="/dashboard/workflow-instances"><Button variant="outline">All runs</Button></Link>}
  >
    {instance && <WorkflowInstanceGraph instance={instance} selected={key} onSelect={(value) => { setSelected(value); setAdoptJson("") }} />}
    {instance && <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
      <div className="space-y-2">
        {ordered.map((item) => {
          const status = instance.nodesJson[item.key]?.status || "pending"
          return <button key={item.key} onClick={() => { setSelected(item.key); setAdoptJson("") }} className={`w-full rounded-lg border p-3 text-left text-sm ${key === item.key ? "border-primary bg-muted/40" : ""}`}>
            <div className="flex items-center justify-between gap-2"><span className="font-medium">{item.key}</span><Badge variant="outline">{status}</Badge></div>
          </button>
        })}
      </div>
      <div className="flex flex-col gap-5">
        <Card><CardHeader><CardTitle className="flex items-center justify-between">{key}<Badge>{node?.status || "pending"}</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy || !["pending", "failed", "invalidated"].includes(node?.status || "")} onClick={() => void command("run")}>Run</Button>
              <Button disabled={busy || node?.status !== "waiting_approval"} onClick={() => void command("approve")}>Approve and continue</Button>
              <Button variant="outline" disabled={busy || !["approved", "failed", "waiting_approval"].includes(node?.status || "")} onClick={() => void command("rerun")}>Rerun here</Button>
              <Button variant="outline" disabled={busy || !["approved", "failed", "waiting_approval"].includes(node?.status || "")} onClick={async () => { const fork = await command("fork"); if (fork) navigate(`/dashboard/workflow-instances/${fork.id}`) }}>Fork run</Button>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(node?.autoAdvance)} disabled={busy || node?.status === "running"} onChange={(event) => void setAuto(event.target.checked)} />Auto approve after verification</label>
            <div className="flex gap-2"><Input value={model} onChange={(event) => setModel(event.target.value)} placeholder="Model for future calls" disabled={node?.status === "running"} /><Button variant="outline" disabled={busy || node?.status === "running" || !model.trim()} onClick={() => void saveModel()}>Set model</Button></div>
            {attempt && <div className="flex gap-3 text-xs text-muted-foreground"><span>Attempt #{attempt.ordinal}</span>{attempt.taskId > 0 && <Link href={`/dashboard/sys-task/${attempt.taskId}`}>Task #{attempt.taskId}</Link>}{conversationId > 0 && <Link href={`/dashboard/conversation/${conversationId}`}>Conversation #{conversationId}</Link>}</div>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
        {attempt && <Card><CardHeader><CardTitle>Input and verified output</CardTitle></CardHeader><CardContent className="grid gap-3 lg:grid-cols-2">
          <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(attempt.inputJson, null, 2)}</pre>
          <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{attempt.errorLog || JSON.stringify(attempt.outputJson, null, 2)}</pre>
        </CardContent></Card>}
        {conversationId > 0 && <Card><CardHeader><CardTitle>Agent conversation</CardTitle></CardHeader><CardContent><div className="h-[480px]"><ConversationThread messages={(messages?.items || []) as ConversationMessage[]} input={input} onInputChange={setInput} onSend={() => void send()} canSend={Boolean(input.trim()) && !busy && node?.status === "waiting_approval"} inputEnabled={node?.status === "waiting_approval"} isSending={busy} /></div></CardContent></Card>}
        {node?.status === "waiting_approval" && <Card><CardHeader><CardTitle>Adopt a validated output</CardTitle></CardHeader><CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Conversation replies remain drafts. Paste this node&apos;s complete structured output to validate and adopt it.</p>
          <Button variant="ghost" size="sm" onClick={() => {
            const target = instance.definitionJson.nodes.find((item) => item.key === key)?.output_mapping?.[""]
            setAdoptJson(JSON.stringify((target ? attempt?.outputJson?.[target] : attempt?.outputJson) || {}, null, 2))
          }}>Use verified output</Button>
          <Textarea className="min-h-40 font-mono text-xs" value={adoptJson} onChange={(event) => setAdoptJson(event.target.value)} />
          <Button variant="outline" disabled={busy} onClick={() => { try { void command("adopt", { output: JSON.parse(adoptJson) }) } catch { setError("Output must be valid JSON") } }}>Validate and adopt</Button>
        </CardContent></Card>}
      </div>
    </div>}
  </DetailPageLayout>
}
