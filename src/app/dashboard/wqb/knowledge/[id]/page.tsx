"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { fetcher } from "@/lib/api"
import type { WqbKnowledge } from "@/lib/wqb-knowledge"

export default function WqbKnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, error, isLoading } = useSWR<WqbKnowledge>(/^\d+$/.test(id) ? `/quants/wqb/knowledge/${id}` : null, fetcher)
  useWorkspaceTabTitle(`/dashboard/wqb/knowledge/${id}`, data?.topic || `Knowledge #${id}`)

  const scope = data ? [
    ["Region", data.region], ["Delay", data.delay], ["Universe", data.universe],
    ["Category", data.category], ["Dataset", data.dataset], ["Datafield", data.datafield],
  ] : []

  return <DetailPageLayout
    title={data?.topic || `Knowledge #${id}`}
    subtitle={data ? `Batch ${data.batchNo} · Record #${data.id}` : undefined}
    badge={data ? <Badge variant={data.state === 10 ? "secondary" : "outline"}>{data.state === 10 ? "Final" : "Draft"}</Badge> : undefined}
    actions={<Button variant="outline" asChild><Link href="/dashboard/wqb/knowledge">All knowledge</Link></Button>}
    side={data ? <Card><CardHeader><CardTitle>Scope</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
      {scope.map(([label, value]) => <div key={label} className="flex justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="break-all text-right">{value ?? "—"}</span></div>)}
      <div className="flex justify-between"><span className="text-muted-foreground">Length</span><span>{data.contentLength.toLocaleString()} chars</span></div>
    </CardContent></Card> : undefined}
  >
    {isLoading ? <p className="text-sm text-muted-foreground">Loading knowledge…</p> : null}
    {error || (!isLoading && !data) ? <p role="alert" className="text-sm text-destructive">Knowledge record could not be found.</p> : null}
    {data ? <Card><CardHeader><CardTitle>Content</CardTitle></CardHeader><CardContent className="prose prose-sm dark:prose-invert max-w-none break-words"><ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content}</ReactMarkdown></CardContent></Card> : null}
  </DetailPageLayout>
}
