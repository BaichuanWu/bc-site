"use client"
import { useState } from "react"
import useSWR from "swr"
import { WorkspaceLink } from "@/components/workspace/workspace-link"
import { Button } from "@/components/ui/button"
import { ValueView } from "./value-view"
import { fetcher } from "@/lib/api"
import type { CursorPage } from "@/lib/wqb-knowledge"

type RelatedRecord = { id: number; relationKind?: string; relatedKnowledge?: { id: number; version: number; title: string }; taskId?: number; decision?: string; rationale?: string; outcome?: unknown }
export function KnowledgeRelated({ id, version, section }: { id: string; version: number; section: "relations" | "usage" | "imports" }) {
  const [cursor, setCursor] = useState(0)
  const { data, error } = useSWR<CursorPage<RelatedRecord>>(`/quants/wqb/knowledge/${id}/${section}?version=${version}&cursor=${cursor}`, fetcher)
  return <section className="space-y-3 rounded-lg border p-5"><h2 className="font-semibold">{section === "relations" ? "关联知识与版本变化" : section === "usage" ? "实际采用记录" : "历史来源映射"}</h2>
    {error ? <p role="alert">关联信息暂时无法读取。</p> : !data ? <p>正在读取…</p> : !data.items.length ? <p className="text-muted-foreground">未记录相关信息。</p> : data.items.map(row => <div key={row.id} className="border-t pt-3">{row.relatedKnowledge ? <><span className="mr-2 text-sm text-muted-foreground">{row.relationKind === "HAS_APPLICATION" ? "应用实例" : row.relationKind === "SUPERSEDES" ? "版本修订" : row.relationKind}</span><WorkspaceLink className="text-primary hover:underline" href={`/dashboard/wqb/knowledge/${row.relatedKnowledge.id}?version=${row.relatedKnowledge.version}`}>{row.relatedKnowledge.title} · v{row.relatedKnowledge.version}</WorkspaceLink></> : <><ValueView value={row} />{section === "usage" && <UsageExample id={row.id} />}</>}</div>)}
    <div className="flex gap-2"><Button variant="outline" disabled={!cursor} onClick={() => setCursor(0)}>首页</Button><Button variant="outline" disabled={!data?.nextCursor} onClick={() => setCursor(data?.nextCursor || 0)}>下一页</Button></div>
  </section>
}

export function TaskTrace({ id }: { id: number }) {
  const [cursor, setCursor] = useState(0)
  const { data, error } = useSWR<{ task: { agentId: string; skillId: string; status: string }; items: { id: number; eventKind: string; createTime: string; detail: unknown }[]; nextCursor: number | null }>(`/quants/wqb/knowledge/tasks/${id}?cursor=${cursor}`, fetcher)
  return <details className="rounded border p-4"><summary>Agent 执行记录 · 任务 #{id}</summary>{error ? <p>执行记录读取失败。</p> : !data ? <p>正在读取…</p> : <div className="mt-3 space-y-3"><p>{data.task.agentId} · {data.task.skillId} · {data.task.status}</p>{data.items.map(event => <details key={event.id}><summary>{event.createTime} · {event.eventKind}</summary><ValueView value={event.detail} /></details>)}<Button variant="outline" disabled={!cursor} onClick={() => setCursor(0)}>时间线首页</Button><Button variant="outline" disabled={!data.nextCursor} onClick={() => setCursor(data.nextCursor || 0)}>下一页事件</Button></div>}</details>
}

function UsageExample({ id }: { id: number }) {
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const { data, error } = useSWR<{ items: unknown[]; gaps: string[]; nextCursor: number | null }>(open ? `/quants/wqb/knowledge/applications/${id}?cursor=${cursor}` : null, fetcher)
  return <div className="mt-3 space-y-3"><Button variant="outline" onClick={() => setOpen(!open)}>查看本次采用的实际评估与执行样本</Button>{open && (error ? <p role="alert">应用详情读取失败。</p> : !data ? <p>正在读取…</p> : <><ValueView value={data.items} /><ValueView value={data.gaps} /><Button variant="outline" disabled={!data.nextCursor} onClick={() => setCursor(data.nextCursor || 0)}>下一页评估</Button></>)}</div>
}

export function SourceContext({ id, version }: { id: string; version: number }) {
  const [open, setOpen] = useState(false)
  const { data, error } = useSWR<{ sourceContext: unknown; notice: string }>(open ? `/quants/wqb/knowledge/${id}/provenance?version=${version}` : null, fetcher)
  return <section className="space-y-3 rounded-lg border p-5"><Button variant="outline" onClick={() => setOpen(!open)}>展开原始来源上下文</Button>{open && (error ? <p>来源上下文读取失败。</p> : !data ? <p>正在读取…</p> : <><p className="text-sm text-muted-foreground">{data.notice}</p><ValueView value={data.sourceContext} /></>)}</section>
}
