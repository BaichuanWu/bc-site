"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import MarkdownPreview from "@uiw/react-markdown-preview"
import { useTheme } from "next-themes"
import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { fetcher } from "@/lib/api"
import type { ExplorationReceipt } from "@/lib/wqb-exploration"

function studyContent(receipt: ExplorationReceipt | undefined): string | null {
  if (receipt?.stage !== "SUCCESS_STUDY") return null
  const { format, markdown } = receipt.details
  return format === "text/markdown" && typeof markdown === "string" && markdown.trim() ? markdown : null
}

export default function Page() {
  const { id } = useParams<{ id: string }>()
  const { resolvedTheme } = useTheme()
  const { data, error, isLoading } = useSWR<ExplorationReceipt>(/^\d+$/.test(id) ? `/quants/wqb/exploration-receipts/${id}` : null, fetcher)
  const study = studyContent(data)
  const alphaId = data?.stage === "SUCCESS_STUDY" && typeof data.details.alphaId === "string" ? data.details.alphaId : null
  const finalExpression = data?.stage === "SUCCESS_STUDY" && typeof data.details.finalExpression === "string" ? data.details.finalExpression : null
  const evidenceIds = data?.stage === "SUCCESS_STUDY" && Array.isArray(data.details.evidenceReceiptIds)
    ? data.details.evidenceReceiptIds.filter((value): value is number => typeof value === "number" && Number.isInteger(value)) : []
  useWorkspaceTabTitle(`/dashboard/wqb/exploration-receipts/${id}`, data ? (alphaId ? `${alphaId} 学习案例` : `${data.stage} #${id}`) : `Receipt #${id}`)
  return <DetailPageLayout title={data ? (alphaId ? `${alphaId} · Alpha 学习案例` : `${data.stage} receipt #${id}`) : `Receipt #${id}`}
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
      {alphaId && finalExpression ? <Card><CardHeader><CardTitle>最终 Alpha · <code>{alphaId}</code></CardTitle></CardHeader>
        <CardContent><pre className="overflow-x-auto rounded bg-muted p-3 text-sm"><code>{finalExpression}</code></pre></CardContent>
      </Card> : null}
      {study ? <Card><CardHeader><CardTitle>经济学学习案例</CardTitle></CardHeader>
        <CardContent data-color-mode={resolvedTheme === "dark" ? "dark" : "light"} className="min-w-0 overflow-x-auto">
          <MarkdownPreview source={study} style={{ background: "transparent" }} />
        </CardContent>
      </Card> : null}
      <Card><CardHeader><CardTitle>Evidence</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        <p>Directions: {data.directionIds.join(", ") || "—"}</p><p>Research score: {data.researchScore ?? "—"}</p>
        <p>Knowledge: {data.knowledgeIds.length ? data.knowledgeIds.map((knowledgeId) => <Link key={knowledgeId} className="mr-3 text-primary hover:underline" href={`/dashboard/wqb/knowledge/${knowledgeId}`}>#{knowledgeId}</Link>) : "—"}</p>
        {evidenceIds.length ? <p>Receipts: {evidenceIds.map((receiptId) => <Link key={receiptId} className="mr-3 text-primary hover:underline" href={`/dashboard/wqb/exploration-receipts/${receiptId}`}>#{receiptId}</Link>)}</p> : null}
        {study ? <details><summary className="cursor-pointer">Raw details</summary><pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs">{JSON.stringify(data.details, null, 2)}</pre></details>
          : <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">{JSON.stringify(data.details, null, 2)}</pre>}
      </CardContent></Card>
    </> : null}
  </DetailPageLayout>
}
