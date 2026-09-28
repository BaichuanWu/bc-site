"use client"

import * as React from "react"
import Link from "next/link"
import useSWR from "swr"
import { BookOpen } from "lucide-react"

import { DataTable, type Column } from "@/components/common/data-table"
import { ListPageShell } from "@/components/common/list-page-shell"
import { NumberedPagination } from "@/components/common/numbered-pagination"
import { SearchFilterGroup, type SearchFilterItem, type FilterClause } from "@/components/common/query-filters"
import { Badge } from "@/components/ui/badge"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { fetcher } from "@/lib/api"
import type { BrowserPage, DatasetClassification, ExplorationReceipt } from "@/lib/wqb-exploration"

const PAGE_SIZE = 20
const scopeFilters: SearchFilterItem[] = [
  { key: "instrumentType", label: "Instrument Type" }, { key: "region", label: "Region" },
  { key: "delay", label: "Delay", type: "number" }, { key: "universe", label: "Universe" },
  { key: "category", label: "Category" }, { key: "dataset", label: "Dataset" },
]
const receiptColumns: Column<ExplorationReceipt>[] = [
  { key: "id", title: "ID", width: 80, render: (_, row) => <Link className="text-primary hover:underline" href={`/dashboard/wqb/exploration-receipts/${row.id}`}>#{row.id}</Link> },
  { key: "stage", title: "Stage", width: 120, render: (value) => <Badge variant="outline">{String(value)}</Badge> },
  { key: "region", title: "Region", width: 90 }, { key: "dataset", title: "Dataset", width: 180, truncate: true },
  { key: "directionIds", title: "Directions", width: 200, render: (_, row) => row.directionIds.join(", ") || "—" },
  { key: "note", title: "Note", width: 500, truncate: true, render: (_, row) => <Link className="block truncate hover:underline" href={`/dashboard/wqb/exploration-receipts/${row.id}`}>{row.note}</Link> },
]
const classificationColumns: Column<DatasetClassification>[] = [
  { key: "id", title: "ID", width: 80, render: (_, row) => <Link className="text-primary hover:underline" href={`/dashboard/wqb/dataset-classifications/${row.id}`}>#{row.id}</Link> },
  { key: "version", title: "Version", width: 90 },
  { key: "status", title: "Status", width: 110, render: (value) => <Badge variant="outline">{String(value)}</Badge> },
  { key: "region", title: "Region", width: 90 }, { key: "dataset", title: "Dataset", width: 200, truncate: true },
  { key: "category", title: "Category", width: 170, truncate: true },
  { key: "inventoryTotal", title: "Fields", width: 90 },
  { key: "categories", title: "Concept cards", width: 350, truncate: true, render: (_, row) => row.categories.map((card) => card.label).join(", ") || "—" },
]

function queryParams(filters: Record<string, FilterClause>, page: number) {
  const params = new URLSearchParams({ offset: String(page * PAGE_SIZE), limit: String(PAGE_SIZE) })
  for (const [key, clause] of Object.entries(filters)) {
    const value = clause.eq
    if (typeof value === "string" && value.trim()) params.set(key, value.trim())
    if (typeof value === "number") params.set(key, String(value))
  }
  return params
}

export function ExplorationList({ kind }: { kind: "receipts" | "classifications" }) {
  const receipt = kind === "receipts"
  const path = receipt ? "exploration-receipts" : "dataset-classifications"
  const title = receipt ? "Exploration Receipts" : "Dataset Classifications"
  const route = `/dashboard/wqb/${path}`
  useWorkspaceTabTitle(route, title)
  const [filters, setFilters] = React.useState<Record<string, FilterClause>>({})
  const [page, setPage] = React.useState(0)
  const { data, error, isLoading } = useSWR<BrowserPage<ExplorationReceipt | DatasetClassification>>(
    `/quants/wqb/${path}?${queryParams(filters, page)}`, fetcher,
  )
  const total = data?.total ?? 0
  return <ListPageShell title={title} icon={BookOpen}>
    <SearchFilterGroup title="Filter" items={[...scopeFilters, receipt
      ? { key: "stage", label: "Stage" } : { key: "status", label: "Status" }]}
      onSearch={(next) => { setFilters(next); setPage(0) }} />
    {error ? <p role="alert" className="text-sm text-destructive">Could not load {title.toLowerCase()}.</p> : null}
    {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : <DataTable items={data?.items ?? []} columns={receipt ? receiptColumns as Column<ExplorationReceipt | DatasetClassification>[] : classificationColumns as Column<ExplorationReceipt | DatasetClassification>[]} />}
    <NumberedPagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
  </ListPageShell>
}
