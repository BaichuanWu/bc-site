"use client"
import { useState } from "react"
import { WorkspaceLink as Link } from "@/components/workspace/workspace-link"
import useSWR from "swr"
import { BookOpen } from "lucide-react"
import { ListPageShell } from "@/components/common/list-page-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetcher } from "@/lib/api"
import { knowledgeKinds, maturityNames, evidenceSummary, type Knowledge, type CursorPage } from "@/lib/wqb-knowledge"

export default function KnowledgePage() {
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState("")
  const [maturity, setMaturity] = useState("")
  const [cursor, setCursor] = useState(0)
  const params = new URLSearchParams({ query, kind, maturity, cursor: String(cursor) })
  const { data, error, isLoading } = useSWR<CursorPage<Knowledge>>(`/quants/wqb/knowledge?${params}`, fetcher)
  return <ListPageShell title="WQB 知识与实际效果" icon={BookOpen}>
    <p className="text-sm text-muted-foreground">每条知识关联真实应用及证据。应用表现不等于因果验证；历史信息不计作新研究产出。</p>
    <div className="flex gap-3"><Input aria-label="搜索知识" placeholder="搜索经济学逻辑、模板或优化方法" value={query} onChange={e => { setQuery(e.target.value); setCursor(0) }} />
      <select aria-label="知识类型" className="rounded-md border bg-background px-3" value={kind} onChange={e => { setKind(e.target.value); setCursor(0) }}><option value="">全部类型</option>{Object.entries(knowledgeKinds).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select><select aria-label="证据成熟度" className="rounded-md border bg-background px-3" value={maturity} onChange={e => { setMaturity(e.target.value); setCursor(0) }}><option value="">全部成熟度</option>{Object.entries(maturityNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></div>
    {error ? <p role="alert">知识读取失败，请检查服务连接后重试。</p> : isLoading ? <p role="status">正在读取知识…</p> : <div className="overflow-x-auto rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted"><tr>{["知识", "类型／版本", "应用与证据", "成熟度"].map(t => <th className="p-4" key={t}>{t}</th>)}</tr></thead><tbody>{data?.items.map(item => <tr className="border-t" key={item.id}>
      <td className="max-w-xl p-4"><Link className="font-medium text-primary hover:underline" href={`/dashboard/wqb/knowledge/${item.id}`}>{item.revision.title}</Link><p className="mt-1 line-clamp-2 text-muted-foreground">{item.revision.statement}</p></td>
      <td className="p-4">{knowledgeKinds[item.kind]} · v{item.revision.version}</td><td className="p-4">{item.effects.performancePreview?.slice(0, 2).map((group, index) => <p key={index}>{String(group.settings.region || "未知市场")} · Sharpe {group.sharpeMin ?? "缺失"}～{group.sharpeMax ?? "缺失"} <span className="text-muted-foreground">（{group.scopeComplete ? "同设置样本" : "条件缺失样本"} {group.sampleCount}）</span></p>)}{item.effects.performancePreview?.length > 2 && <p className="text-muted-foreground">另有 {item.effects.performancePreview.length - 2} 组，可在详情查看</p>}{item.effects.performancePreviewTruncated && <p className="text-muted-foreground">仅预览前 20 个历史快照</p>}{evidenceSummary(item)}<p className="text-muted-foreground">已关联历史应用 {item.effects.applicationCount} · 已记录采用 {item.effects.usage.APPLIED || 0} 次</p></td><td className="p-4">{maturityNames[item.revision.maturity]}</td>
    </tr>)}</tbody></table>{!data?.items.length && <p className="p-6">没有匹配知识。请调整筛选条件。</p>}</div>}
    <div className="flex gap-2"><Button variant="outline" disabled={!cursor} onClick={() => setCursor(0)}>返回首页</Button><Button variant="outline" disabled={!data?.nextCursor} onClick={() => setCursor(data?.nextCursor || 0)}>下一页</Button></div>
  </ListPageShell>
}
