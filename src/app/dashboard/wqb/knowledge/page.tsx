"use client"

import * as React from "react"
import Link from "next/link"
import useSWR from "swr"
import { BookOpen } from "lucide-react"

import { DataTable, type Column } from "@/components/common/data-table"
import { NumberedPagination } from "@/components/common/numbered-pagination"
import { ListPageShell } from "@/components/common/list-page-shell"
import { SearchFilterGroup, type FilterClause, type SearchFilterItem } from "@/components/common/query-filters"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { fetcher } from "@/lib/api"
import { knowledgeHref, knowledgeKindLabel, knowledgeDocumentRoleLabel, knowledgeScope, type WqbKnowledgeHit, type WqbKnowledgePage } from "@/lib/wqb-knowledge"

const PAGE_SIZE = 20
const filterItems: SearchFilterItem[] = [
  { key: "text", label: "Content" },
  { key: "kind", label: "内容类型", options: [{ label: "可复用知识", value: "KNOWLEDGE" }, { label: "文档", value: "DOCUMENT" }] },
  { key: "documentRole", label: "文档用途" },
  { key: "region", label: "Region" },
  { key: "delay", label: "Delay", type: "number" },
  { key: "universe", label: "Universe" },
  { key: "category", label: "Category" },
  { key: "dataset", label: "Dataset" },
  { key: "datafield", label: "Field" },
  { key: "topic", label: "Topic" },
]

const columns: Column<WqbKnowledgeHit & { id: string }>[] = [
  { key: "title", title: "Title", width: 220, truncate: true, render: (_, item) => <Link className="font-medium text-primary hover:underline" href={knowledgeHref(item.reference)}>{item.title}</Link> },
  { key: "identity", title: "Identity", width: 220, truncate: true },
  { key: "kind", title: "内容类型", width: 110, render: (_, item) => knowledgeKindLabel(item.metadata.kind) },
  { key: "topic", title: "主题", width: 170, truncate: true, render: (_, item) => String(item.metadata.topic || "—") },
  { key: "documentRole", title: "文档用途", width: 190, truncate: true, render: (_, item) => knowledgeDocumentRoleLabel(item.metadata.documentRole) },
  { key: "scope", title: "适用范围", width: 220, truncate: true, render: (_, item) => knowledgeScope(item.metadata) },
  { key: "excerpt", title: "Preview", width: 420, truncate: true, render: (_, item) => <Link href={knowledgeHref(item.reference)}>{item.excerpt}</Link> },
]

export default function WqbKnowledgePage() {
  useWorkspaceTabTitle("/dashboard/wqb/knowledge", "WQB Knowledge")
  const [filters, setFilters] = React.useState<Record<string, FilterClause>>({})
  const [page, setPage] = React.useState(0)
  const params = new URLSearchParams({ offset: String(page * PAGE_SIZE), limit: String(PAGE_SIZE) })
  for (const key of ["text", "kind", "documentRole", "region", "delay", "universe", "category", "dataset", "datafield", "topic"]) {
    const clause = filters[key]
    if (key === "kind" && Array.isArray(clause?.in) && clause.in.length > 1) continue
    const value = clause?.eq ?? clause?.like ?? clause?.ilike ?? (Array.isArray(clause?.in) ? clause.in[0] : clause?.in)
    if (typeof value === "string" && value.trim()) params.set(key, value.trim())
    if (typeof value === "number") params.set(key, String(value))
  }
  const { data, error, isLoading } = useSWR<WqbKnowledgePage>(`/quants/wqb/knowledge?${params}`, fetcher)
  const total = data?.total ?? 0

  return <ListPageShell title="WQB Knowledge" icon={BookOpen}>
    <SearchFilterGroup title="Filter" items={filterItems} onSearch={(next) => { setFilters(next); setPage(0) }} />
    {error ? <p role="alert" className="text-sm text-destructive">Could not load WQB knowledge.</p> : null}
    {isLoading ? <p className="text-sm text-muted-foreground">Loading knowledge…</p> : <DataTable items={(data?.items ?? []).map((item) => ({ ...item, id: item.reference }))} columns={columns} />}
    <NumberedPagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
  </ListPageShell>
}
