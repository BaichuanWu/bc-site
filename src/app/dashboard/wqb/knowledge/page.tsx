"use client"

import * as React from "react"
import Link from "next/link"
import useSWR from "swr"
import { BookOpen } from "lucide-react"

import { DataTable, type Column } from "@/components/common/data-table"
import { NumberedPagination } from "@/components/common/numbered-pagination"
import { ListPageShell } from "@/components/common/list-page-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { fetcher } from "@/lib/api"
import type { WqbKnowledge, WqbKnowledgePage } from "@/lib/wqb-knowledge"

const PAGE_SIZE = 20

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
    render: (_, item) => <Link className="block truncate hover:underline" href={`/dashboard/wqb/knowledge/${item.id}`}>{item.content || "Open detail"}</Link>,
  },
]

export default function WqbKnowledgePage() {
  useWorkspaceTabTitle("/dashboard/wqb/knowledge", "WQB Knowledge")
  const [search, setSearch] = React.useState("")
  const [text, setText] = React.useState("")
  const [state, setState] = React.useState("all")
  const [page, setPage] = React.useState(0)
  const params = new URLSearchParams({ offset: String(page * PAGE_SIZE), limit: String(PAGE_SIZE) })
  if (text) params.set("text", text)
  if (state !== "all") params.set("state", state)
  const { data, error, isLoading } = useSWR<WqbKnowledgePage>(`/quants/wqb/knowledge?${params}`, fetcher)
  const total = data?.total ?? 0

  function submitSearch(event: React.FormEvent) {
    event.preventDefault()
    setPage(0)
    setText(search.trim())
  }

  return <ListPageShell title="WQB Knowledge" icon={BookOpen}>
    <div className="flex flex-wrap items-end gap-3">
      <form onSubmit={submitSearch} className="flex min-w-64 flex-1 gap-2">
        <Input aria-label="Search knowledge" placeholder="Search content" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Button type="submit" variant="outline">Search</Button>
      </form>
      <Select value={state} onValueChange={(value) => { setState(value); setPage(0) }}>
        <SelectTrigger aria-label="Knowledge state" className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All states</SelectItem>
          <SelectItem value="10">Final</SelectItem>
          <SelectItem value="0">Draft</SelectItem>
        </SelectContent>
      </Select>
    </div>
    {error ? <p role="alert" className="text-sm text-destructive">Could not load WQB knowledge.</p> : null}
    {isLoading ? <p className="text-sm text-muted-foreground">Loading knowledge…</p> : <DataTable items={data?.items ?? []} columns={columns} />}
    <NumberedPagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
  </ListPageShell>
}
