"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { DataTable, type Column } from "@/components/common/data-table"
import { NumberedPagination } from "@/components/common/numbered-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { fetcher } from "@/lib/api"
import type { DatasetClassification, FieldDecision } from "@/lib/wqb-exploration"
import * as React from "react"

const PAGE_SIZE = 50
const columns: Column<FieldDecision & { id: string }>[] = [
  { key: "fieldId", title: "Field", width: 240, truncate: true },
  { key: "status", title: "Status", width: 120, render: (value) => <Badge variant="outline">{String(value)}</Badge> },
  { key: "explanation", title: "Explanation", width: 420, truncate: true },
  { key: "mappings", title: "Mappings", width: 420, render: (_, row) => <pre className="max-w-lg whitespace-pre-wrap break-words text-xs">{JSON.stringify(row.mappings, null, 2)}</pre> },
]
export default function Page() {
  const { id } = useParams<{ id: string }>()
  const [page, setPage] = React.useState(0)
  const { data, error, isLoading } = useSWR<DatasetClassification>(/^\d+$/.test(id) ? `/quants/wqb/dataset-classifications/${id}?offset=${page * PAGE_SIZE}&limit=${PAGE_SIZE}` : null, fetcher)
  useWorkspaceTabTitle(`/dashboard/wqb/dataset-classifications/${id}`, data ? `${data.dataset} v${data.version}` : `Classification #${id}`)
  return <DetailPageLayout title={data ? `${data.dataset} v${data.version}` : `Classification #${id}`}
    badge={data ? <Badge variant="outline">{data.status}</Badge> : undefined}
    actions={<Button variant="outline" asChild><Link href="/dashboard/wqb/dataset-classifications">All classifications</Link></Button>}
    side={data ? <Card><CardHeader><CardTitle>Scope and coverage</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
      {[["Instrument", data.instrumentType], ["Region", data.region], ["Delay", data.delay], ["Universe", data.universe], ["Category", data.category], ["Dataset", data.dataset], ["Inventory", data.inventoryTotal], ["Decided", data.decidedCount], ["Vocabulary", data.vocabularyVersion]].map(([label, value]) =>
        <div key={label} className="flex justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="break-all text-right">{value}</span></div>)}
    </CardContent></Card> : undefined}>
    {isLoading ? <p>Loading…</p> : null}
    {error || (!isLoading && !data) ? <p role="alert" className="text-destructive">Classification not found.</p> : null}
    {data ? <>
      <Card><CardHeader><CardTitle>Category cards</CardTitle></CardHeader><CardContent className="space-y-3">
        {data.categories.map((card) => <div key={card.id} className="rounded border p-3 text-sm"><div className="font-medium">{card.label}</div><div className="text-muted-foreground">{card.conceptIds.join(", ")} · {card.measurementObject}</div><p className="mt-2 whitespace-pre-wrap">{card.note}</p></div>)}
        {!data.categories.length ? <p className="text-sm text-muted-foreground">No category cards.</p> : null}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Field decisions</CardTitle></CardHeader><CardContent className="space-y-3">
        <DataTable items={(data.items ?? []).map((item) => ({ ...item, id: item.fieldId }))} columns={columns} />
        <NumberedPagination page={page} total={data.decidedCount ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </CardContent></Card>
    </> : null}
  </DetailPageLayout>
}
