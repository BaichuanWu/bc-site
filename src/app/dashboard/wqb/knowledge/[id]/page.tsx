"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { fetcher } from "@/lib/api"
import { decodeKnowledgeRouteSegment, knowledgeHref, knowledgeKindLabel, knowledgeDocumentRoleLabel, knowledgeScope, type WqbKnowledge } from "@/lib/wqb-knowledge"

const PAGE_CHARS = 20000

function KnowledgeDetail({ reference, route }: { reference: string; route: string }) {
  const [offset, setOffset] = useState(0)
  const [historyOffset, setHistoryOffset] = useState(0)
  const [pinnedReference, setPinnedReference] = useState<string | null>(null)
  const activeReference = pinnedReference || reference
  const { data, error, isLoading } = useSWR<WqbKnowledge>(
    `/quants/wqb/knowledge/${encodeURIComponent(activeReference)}?contentOffset=${offset}&maxChars=${PAGE_CHARS}&historyOffset=${historyOffset}&historyLimit=20`, fetcher,
  )
  useWorkspaceTabTitle(route, data?.title || "Knowledge")
  const contentChars = data ? Array.from(data.content).length : 0
  function nextContent(nextOffset: number) {
    if (data) setPinnedReference(data.reference)
    setOffset(nextOffset)
  }
  return <DetailPageLayout title={data?.title || "Knowledge"} subtitle={data?.identity}
    actions={<Button variant="outline" asChild><Link href="/dashboard/wqb/knowledge">All knowledge</Link></Button>}
    side={data ? <Card><CardHeader><CardTitle>Metadata</CardTitle></CardHeader><CardContent>
      <p className="text-sm">{data.sourceStatus} · Index {data.indexStatus}</p>
      <p className="text-sm">{knowledgeKindLabel(data.metadata.kind)} · {String(data.metadata.topic || "未声明主题")}</p>
      {data.metadata.documentRole ? <p className="text-sm">用途：{knowledgeDocumentRoleLabel(data.metadata.documentRole)}</p> : null}
      <p className="text-sm">适用范围：{knowledgeScope(data.metadata)}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(data.metadata, null, 2)}</pre>
    </CardContent></Card> : undefined}>
    {isLoading ? <p>Loading knowledge…</p> : null}
    {error ? <p role="alert" className="text-destructive">Knowledge could not be found.</p> : null}
    {data ? <>
      <Card><CardHeader><CardTitle>Content</CardTitle></CardHeader><CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content}</ReactMarkdown>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" disabled={offset === 0} onClick={() => nextContent(Math.max(0, offset - PAGE_CHARS))}>Previous content</Button>
          <span className="text-sm">{data.contentOffset.toLocaleString()}–{(data.contentOffset + contentChars).toLocaleString()} / {data.contentLength.toLocaleString()} chars</span>
          <Button variant="outline" disabled={!data.contentTruncated} onClick={() => nextContent(offset + contentChars)}>Next content</Button>
        </div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Versions ({data.revisionCount})</CardTitle></CardHeader><CardContent>
        <ul>{data.revisions.map((revision) => <li key={revision.reference}><Link className="text-primary hover:underline" href={knowledgeHref(revision.reference)}>{revision.title} · {revision.fingerprint.slice(0, 12)}</Link></li>)}</ul>
        <div className="mt-3 flex gap-3">
          <Button variant="outline" disabled={historyOffset === 0} onClick={() => setHistoryOffset(Math.max(0, historyOffset - 20))}>Previous versions</Button>
          <Button variant="outline" disabled={historyOffset + data.revisions.length >= data.revisionCount} onClick={() => setHistoryOffset(historyOffset + 20)}>Next versions</Button>
        </div>
      </CardContent></Card>
    </> : null}
  </DetailPageLayout>
}

export default function WqbKnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const segment = decodeKnowledgeRouteSegment(id)
  const reference = /^\d+$/.test(segment) ? `db:${segment.replace(/^0+(?=\d)/, "")}` : segment
  return <KnowledgeDetail key={reference} reference={reference} route={knowledgeHref(segment)} />
}
