"use client"

import * as React from "react"
import Link from "next/link"
import useSWR from "swr"
import { BookOpen } from "lucide-react"

import { DataTable, type Column } from "@/components/common/data-table"
import { ListPageShell } from "@/components/common/list-page-shell"
import { NumberedPagination } from "@/components/common/numbered-pagination"
import { SearchFilterGroup, type SearchFilterItem, type FilterClause } from "@/components/common/query-filters"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { fetcher } from "@/lib/api"
import type { BrowserPage, DatasetClassification } from "@/lib/wqb-classification"

const PAGE_SIZE = 20
const scopeFilters: SearchFilterItem[] = [
  { key: "keyword", label: "Descriptions" },
  { key: "classificationName", label: "Class name" },
  { key: "region", label: "Region" }, { key: "delay", label: "Delay", type: "number" },
  { key: "universe", label: "Universe" }, { key: "datasetId", label: "Dataset" },
]
const classificationColumns: Column<DatasetClassification>[] = [
  { key: "classificationName", title: "Class", width: 220, render: (_, row) => <Link className="text-primary hover:underline" href={`/dashboard/wqb/dataset-classifications/${row.id}`}>{row.classificationName}</Link> },
  { key: "region", title: "Region", width: 90 },
  { key: "datasetId", title: "Dataset", width: 180 },
  { key: "informationMeaning", title: "Meaning", width: 350, truncate: true },
  { key: "commonalityDescription", title: "Commonality", width: 300, truncate: true },
  { key: "datafieldIds", title: "Fields", width: 90, render: (_, row) => row.datafieldIds?.length ?? "—" },
]

function queryParams(filters: Record<string, FilterClause>, page: number) {
  const params = new URLSearchParams({ offset: String(page * PAGE_SIZE), limit: String(PAGE_SIZE) })
  for (const [key, clause] of Object.entries(filters)) {
    const value = clause.eq ?? clause.like ?? clause.ilike ?? (Array.isArray(clause.in) ? clause.in[0] : clause.in)
    if (typeof value === "string" && value.trim()) params.set(key, value.trim())
    if (typeof value === "number") params.set(key, String(value))
  }
  return params
}

export function ClassificationList() {
  const path = "dataset-classifications"
  const title = "Dataset Classifications"
  const route = `/dashboard/wqb/${path}`
  useWorkspaceTabTitle(route, title)
  const [filters, setFilters] = React.useState<Record<string, FilterClause>>({})
  const [page, setPage] = React.useState(0)
  const { data, error, isLoading } = useSWR<BrowserPage<DatasetClassification>>(
    `/quants/wqb/${path}?${queryParams(filters, page)}`, fetcher,
  )
  const total = data?.total ?? 0
  return <ListPageShell title={title} icon={BookOpen}>
    <SearchFilterGroup title="Filter" items={scopeFilters}
      onSearch={(next) => { setFilters(next); setPage(0) }} />
    {error ? <p role="alert" className="text-sm text-destructive">Could not load {title.toLowerCase()}.</p> : null}
    {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DataTable items={data?.items ?? []} columns={classificationColumns} />}
    <NumberedPagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
  </ListPageShell>
}
