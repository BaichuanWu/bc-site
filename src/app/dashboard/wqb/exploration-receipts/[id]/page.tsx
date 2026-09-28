"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { fetcher } from "@/lib/api"
import type { ExplorationReceipt } from "@/lib/wqb-exploration"

export default function Page() {
  const { id } = useParams<{ id: string }>()
  const { data, error, isLoading } = useSWR<ExplorationReceipt>(/^\d+$/.test(id) ? `/quants/wqb/exploration-receipts/${id}` : null, fetcher)
  useWorkspaceTabTitle(`/dashboard/wqb/exploration-receipts/${id}`, data ? `${data.stage} #${id}` : `Receipt #${id}`)
  return <DetailPageLayout title={data ? `${data.stage} receipt #${id}` : `Receipt #${id}`}
    badge={data ? <Badge variant="outline">{data.stage}</Badge> : undefined}
    actions={<Button variant="outline" asChild><Link href="/dashboard/wqb/exploration-receipts">All receipts</Link></Button>}
    side={data ? <Card><CardHeader><CardTitle>Scope</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
      {[["Instrument", data.instrumentType], ["Region", data.region], ["Delay", data.delay], ["Universe", data.universe], ["Category", data.category], ["Dataset", data.dataset], ["Key", data.receiptKey]].map(([label, value]) =>
        <div key={label} className="flex justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="break-all text-right">{value}</span></div>)}
    </CardContent></Card> : undefined}>
    {isLoading ? <p>Loading…</p> : null}
    {error || (!isLoading && !data) ? <p role="alert" className="text-destructive">Receipt not found.</p> : null}
    {data ? <>
      <Card><CardHeader><CardTitle>Note</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap break-words text-sm">{data.note}</CardContent></Card>
      <Card><CardHeader><CardTitle>Evidence</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        <p>Directions: {data.directionIds.join(", ") || "—"}</p><p>Research score: {data.researchScore ?? "—"}</p>
        <p>Knowledge: {data.knowledgeIds.length ? data.knowledgeIds.map((knowledgeId) => <Link key={knowledgeId} className="mr-3 text-primary hover:underline" href={`/dashboard/wqb/knowledge/${knowledgeId}`}>#{knowledgeId}</Link>) : "—"}</p>
        <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">{JSON.stringify(data.details, null, 2)}</pre>
      </CardContent></Card>
    </> : null}
  </DetailPageLayout>
}
