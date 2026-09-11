"use client"
import { useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { KnowledgeRelated, TaskTrace, SourceContext } from "./related"
import { WorkspaceLink as Link } from "@/components/workspace/workspace-link"
import useSWR from "swr"
import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { Button } from "@/components/ui/button"
import { ValueView } from "@/components/wqb-knowledge/value-view"
import { fetcher } from "@/lib/api"
import { knowledgeKinds, maturityNames, evidenceSummary, type Knowledge, type Evidence, type CursorPage } from "@/lib/wqb-knowledge"

function EvidenceDetail({ id }: { id: number }) {
  const { data, error } = useSWR<Record<string, unknown>>(`/quants/wqb/knowledge/evidence/${id}`, fetcher)
  if (error) return <p role="alert">证据暂时无法读取。</p>
  if (!data) return <p>正在读取实例…</p>
  return <div className="space-y-4 rounded-md bg-muted/30 p-4"><ValueView value={data.example || data.fact} /><ValueView value={data.comparisons} /><ValueView value={data.recordedSamples} /><ValueView value={data.gaps} />{data.experimentId != null && <Experiment id={Number(data.experimentId)} />}</div>
}
function Experiment({ id }: { id: number }) {
  const { data } = useSWR<Record<string, unknown>>(`/quants/wqb/knowledge/experiments/${id}`, fetcher)
  const experiment = data?.experiment as { taskId?: number } | undefined
  return <div className="space-y-3"><h3 className="font-medium">研究当前方案（评估采用上方固定执行记录）</h3><ValueView value={data} />{experiment?.taskId && <TaskTrace id={experiment.taskId} />}</div>
}
export default function KnowledgeDetail() {
  const { id } = useParams<{ id: string }>()
  const search = useSearchParams()
  const [version, setVersion] = useState(Number(search.get("version")) || 0)
  const [cursor, setCursor] = useState(0)
  const [evidenceCursor, setEvidenceCursor] = useState(0)
  const [expanded, setExpanded] = useState<number | null>(null)
  const { data, error } = useSWR<Knowledge>(`/quants/wqb/knowledge/${id}?version=${version}`, fetcher)
  const { data: examples } = useSWR<CursorPage<{ evidence: Evidence; role: string; adaptations: unknown }>>(`/quants/wqb/knowledge/${id}/examples?version=${version}&cursor=${cursor}`, fetcher)
  const { data: groups } = useSWR<{ assessments: unknown[]; items: { settings: unknown; sampleCount: number; metricRanges: unknown }[] }>(`/quants/wqb/knowledge/${id}/effects?version=${version}&cursor=${cursor}`, fetcher)
  const { data: evidence } = useSWR<CursorPage<Evidence>>(`/quants/wqb/knowledge/${id}/evidence?version=${version}&cursor=${evidenceCursor}`, fetcher)
  return <DetailPageLayout title={data?.revision.title || "知识详情"} subtitle={data ? `${knowledgeKinds[data.kind]} · v${data.revision.version} · ${maturityNames[data.revision.maturity]}` : "读取知识与实际效果"} actions={<Link href="/dashboard/wqb/knowledge">返回知识列表</Link>}>
    {error ? <p role="alert">知识或指定版本不存在，或服务暂不可用。</p> : !data ? <p>正在读取…</p> : <>
      <section className="space-y-3 rounded-lg border p-5"><h2 className="font-semibold">知识内容</h2><p className="whitespace-pre-wrap">{data.revision.statement}</p><ValueView value={Object.fromEntries(Object.entries(data.revision.content || {}).filter(([key, value]) => key !== "legacyRecord" && (key === "sourceDocument" || value !== data.revision.content?.sourceDocument)))} /></section>
      <section className="space-y-3 rounded-lg border p-5"><h2 className="font-semibold">适用条件与边界</h2><ValueView value={data.revision.applicability} /><ValueView value={data.revision.boundaries} /></section>
      <section className="space-y-3 rounded-lg border p-5"><h2 className="font-semibold">应用表现与具体实例</h2><p className="text-sm text-muted-foreground">以下范围仅覆盖本页实例，按完整设置分组。不同条件不混算；条件不完整的样本单独展示。数值范围不代表因果改善。</p>
        {groups?.items.map((group, index) => <div className="grid gap-4 rounded border p-4 md:grid-cols-2" key={index}><div><p>本页样本 {group.sampleCount}</p><ValueView value={group.settings} /></div><ValueView value={group.metricRanges} /></div>)}
        <ValueView value={groups?.assessments} />
        {!examples ? <p>正在读取实例…</p> : !examples.items.length && <p>当前版本尚无关联应用实例，可切换历史版本查看。</p>}
        {examples?.items.map(entry => <div className="space-y-2 border-t pt-3" key={entry.evidence.id}><Button variant="outline" onClick={() => setExpanded(expanded === entry.evidence.id ? null : entry.evidence.id)}>查看实例 #{entry.evidence.evidenceId}</Button>{expanded === entry.evidence.id && <><h3>已有调整记录</h3><ValueView value={entry.adaptations} /><EvidenceDetail id={entry.evidence.id} /></>}</div>)}
        <Button variant="outline" disabled={!cursor} onClick={() => setCursor(0)}>实例首页</Button><Button variant="outline" disabled={!examples?.nextCursor} onClick={() => setCursor(examples?.nextCursor || 0)}>下一页实例</Button>
      </section>
      <section className="space-y-3 rounded-lg border p-5"><h2 className="font-semibold">实际应用与证据</h2><p>{evidenceSummary(data)}</p><p className="text-sm text-muted-foreground">统计限定当前所选版本；背景实例不代表验证通过。更新时间：{data.effects.asOf}</p><ValueView value={data.effects.gaps} />
        {evidence?.items.map(item => <div key={item.id} className="space-y-3 border-t pt-3"><Button variant="outline" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>{item.effect === "CONTRADICTS" ? "反证" : item.effect === "SUPPORTS" ? "支持证据" : "背景实例"} · {item.evidenceType} #{item.evidenceId}</Button>{expanded === item.id && <EvidenceDetail id={item.id} />}</div>)}
        <Button variant="outline" disabled={!evidenceCursor} onClick={() => setEvidenceCursor(0)}>证据首页</Button><Button variant="outline" disabled={!evidence?.nextCursor} onClick={() => setEvidenceCursor(evidence?.nextCursor || 0)}>下一页证据</Button>
      </section>
      <KnowledgeRelated key={`relations-${id}-${version}`} id={id} version={version} section="relations" />
      <KnowledgeRelated key={`usage-${id}-${version}`} id={id} version={version} section="usage" />
      <KnowledgeRelated key={`imports-${id}-${version}`} id={id} version={version} section="imports" />
      {data.sourceContextAvailable && <SourceContext key={`source-${id}-${version}`} id={id} version={version} />}
      <section className="space-y-3 rounded-lg border p-5"><h2 className="font-semibold">历史版本</h2><label>查看版本 <input className="ml-2 w-24 rounded border bg-background p-2" aria-label="历史版本" type="number" min={1} max={data.currentVersion} value={version || data.revision.version} onChange={e => { setVersion(Number(e.target.value)); setCursor(0); setEvidenceCursor(0); setExpanded(null) }} /></label><p className="text-sm text-muted-foreground">知识历史版本保留当时内容和关联证据，缺失的历史过程不会补造。</p></section>
    </>}
  </DetailPageLayout>
}
