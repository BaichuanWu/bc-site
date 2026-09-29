"use client"

import * as React from "react"
import Link from "next/link"
import useSWR from "swr"
import { BookOpen } from "lucide-react"

import { DataTable, type Column } from "@/components/common/data-table"
import { NumberedPagination } from "@/components/common/numbered-pagination"
import { ListPageShell } from "@/components/common/list-page-shell"
import { SearchFilterGroup, type FilterClause, type SearchFilterItem } from "@/components/common/query-filters"
import { Badge } from "@/components/ui/badge"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { fetcher } from "@/lib/api"
import type { WqbKnowledge, WqbKnowledgePage } from "@/lib/wqb-knowledge"

const PAGE_SIZE = 20
const filterItems: SearchFilterItem[] = [
  { key: "text", label: "Content" },
  { key: "state", label: "State", options: [{ label: "Draft", value: 0 }, { label: "Final", value: 10 }] },
]

const columns: Column<WqbKnowledge>[] = [
  {
    key: "id", title: "ID", width: 90,
    render: (_, item) => <Link className="font-medium text-primary hover:underline" href={`/dashboard/wqb/knowledge/${item.id}`}>#{item.id}</Link>,
  },
  { key: "batchNo", title: "Batch", width: 170, truncate: true },
  { key: "topic", title: "Topic", width: 180, render: (value) => String(value || "—") },
  { key: "region", title: "Region", width: 100, render: (value) => String(value || "—") },
  { key: "dataset", title: "Dataset", width: 180, truncate: true, render: (value) => String(value || "—") },
  { key: "state", title: "State", width: 105, render: (_, item) => <Badge variant={item.state === 10 ? "secondary" : "outline"}>{item.state === 10 ? "Final" : "Draft"}</Badge> },
  {
    key: "content", title: "Preview", width: 420, truncate: true,
    render: (_, item) => <Link className="block truncate hover:underline" href={`/dashboard/wqb/knowledge/${item.id}`}>{item.contentSummary || item.content || "Open detail"}</Link>,
  },
]

export default function WqbKnowledgePage() {
  useWorkspaceTabTitle("/dashboard/wqb/knowledge", "WQB Knowledge")
  const [filters, setFilters] = React.useState<Record<string, FilterClause>>({})
  const [page, setPage] = React.useState(0)
  const params = new URLSearchParams({ offset: String(page * PAGE_SIZE), limit: String(PAGE_SIZE) })
  const text = filters.text?.eq ?? filters.text?.like ?? filters.text?.ilike
  if (typeof text === "string" && text.trim()) params.set("text", text.trim())
  const states = filters.state?.in
  if (Array.isArray(states) && states.length === 1) params.set("state", String(states[0]))
  const { data, error, isLoading } = useSWR<WqbKnowledgePage>(`/quants/wqb/knowledge?${params}`, fetcher)
  const total = data?.total ?? 0

  return <ListPageShell title="WQB Knowledge" icon={BookOpen}>
    <SearchFilterGroup title="Filter" items={filterItems} onSearch={(next) => { setFilters(next); setPage(0) }} />
    {error ? <p role="alert" className="text-sm text-destructive">Could not load WQB knowledge.</p> : null}
    {isLoading ? <p className="text-sm text-muted-foreground">Loading knowledge…</p> : <DataTable items={data?.items ?? []} columns={columns} />}
    <NumberedPagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
  </ListPageShell>
}
