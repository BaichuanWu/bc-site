"use client"

import * as React from "react"
import Link from "next/link"
import useSWR from "swr"

import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient, fetcher } from "@/lib/api"
import type { WorkflowInstance } from "@/lib/workflow-instances"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"

type Definition = { id: number; name: string; title: string }

export default function WorkflowInstancesPage() {
  const navigate = useWorkspaceNavigate()
  const { data: instances, mutate } = useSWR<WorkflowInstance[]>("/workflow-instances", fetcher)
  const { data: definition } = useSWR<Definition>("/workflow-definition/active/wqb.interactive_alpha", fetcher)
  const [datasetId, setDatasetId] = React.useState("")
  const [region, setRegion] = React.useState("USA")
  const [universe, setUniverse] = React.useState("TOP3000")
  const [delay, setDelay] = React.useState(1)
  const [llmId, setLlmId] = React.useState(1)
  const [model, setModel] = React.useState("")
  const [autoAdvance, setAutoAdvance] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState("")

  async function start() {
    if (!definition || !datasetId.trim()) return
    setBusy(true)
    setError("")
    try {
      const created = await apiClient.post("/workflow-instances", {
        definitionId: definition.id,
        input: { datasetId: datasetId.trim(), region, universe, delay },
        config: { autoAdvance, llmOverrides: { llmId, ...(model ? { model } : {}) } },
      }) as WorkflowInstance
      await mutate()
      navigate(`/dashboard/workflow-instances/${created.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start workflow")
    } finally {
      setBusy(false)
    }
  }

  return <DetailPageLayout title="Workflow runs" subtitle="Explore Alpha workflows with step-by-step review.">
    <Card>
      <CardHeader><CardTitle>New Alpha exploration</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">Dataset ID<Input value={datasetId} onChange={(event) => setDatasetId(event.target.value)} /></label>
          <label className="text-sm">Region<Input value={region} onChange={(event) => setRegion(event.target.value)} /></label>
          <label className="text-sm">Universe<Input value={universe} onChange={(event) => setUniverse(event.target.value)} /></label>
          <label className="text-sm">Delay<Input type="number" value={delay} onChange={(event) => setDelay(Number(event.target.value))} /></label>
          <label className="text-sm">LLM ID<Input type="number" value={llmId} onChange={(event) => setLlmId(Number(event.target.value))} /></label>
          <label className="text-sm">Model override<Input value={model} onChange={(event) => setModel(event.target.value)} placeholder="Provider default" /></label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoAdvance} onChange={(event) => setAutoAdvance(event.target.checked)} />Auto approve verified steps</label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button disabled={!definition || !datasetId.trim() || busy} onClick={() => void start()}>Create run</Button>
      </CardContent>
    </Card>
    <div className="space-y-2">
      {(instances || []).map((instance) => <Link key={instance.id} href={`/dashboard/workflow-instances/${instance.id}`} className="block rounded-lg border p-4 hover:bg-muted/50">
        <div className="flex justify-between"><span className="font-medium">#{instance.id} · {instance.definitionJson.name}</span><span className="text-sm">{instance.status}</span></div>
        <div className="text-xs text-muted-foreground">Dataset {String(instance.inputJson.datasetId || "-")} · revision {instance.revision}</div>
      </Link>)}
    </div>
  </DetailPageLayout>
}
