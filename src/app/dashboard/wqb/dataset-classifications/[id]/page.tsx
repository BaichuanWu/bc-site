"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { DataTable, type Column } from "@/components/common/data-table"
import { NumberedPagination } from "@/components/common/numbered-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { fetcher } from "@/lib/api"
import type { DatasetClassification } from "@/lib/wqb-classification"

const PAGE_SIZE = 50
const columns: Column<{ id: string }>[] = [{ key: "id", title: "Platform field ID", width: 400 }]

export default function Page() {
  const { id } = useParams<{ id: string }>()
  const [page, setPage] = useState(0)
  const { data, error, isLoading } = useSWR<DatasetClassification>(/^\d+$/.test(id) ? `/quants/wqb/dataset-classifications/${id}?offset=${page * PAGE_SIZE}&limit=${PAGE_SIZE}` : null, fetcher)
  useWorkspaceTabTitle(`/dashboard/wqb/dataset-classifications/${id}`, data?.classificationName || `Classification #${id}`)
  return <DetailPageLayout title={data?.classificationName || `Classification #${id}`}
    actions={<Button variant="outline" asChild><Link href="/dashboard/wqb/dataset-classifications">All classifications</Link></Button>}
    side={data ? <Card><CardHeader><CardTitle>Scope</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
      {[["Region", data.region], ["Delay", data.delay], ["Universe", data.universe], ["Dataset", data.datasetId]].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><span>{label}</span><span>{value}</span></div>)}
    </CardContent></Card> : undefined}>
    {isLoading ? <p>Loading…</p> : null}
    {error ? <p role="alert" className="text-destructive">Classification not found.</p> : null}
    {data ? <>
      {[["Information meaning", data.informationMeaning], ["Commonality", data.commonalityDescription], ["Differences", data.differencesDescription]].map(([title, body]) => <Card key={title}><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap">{body}</CardContent></Card>)}
      <Card><CardHeader><CardTitle>Saved platform field IDs</CardTitle></CardHeader><CardContent>
        <DataTable items={(data.datafieldIds ?? []).map((fieldId) => ({ id: fieldId }))} columns={columns} />
        <NumberedPagination page={page} total={data.datafieldTotal ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </CardContent></Card>
    </> : null}
  </DetailPageLayout>
}
