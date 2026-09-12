"use client"

import * as React from "react"
import { BookOpen } from "lucide-react"

import { CrudLayout } from "@/components/common/crud-layout"
import { type Column } from "@/components/common/data-table"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { Badge } from "@/components/ui/badge"
import { WorkspaceLink } from "@/components/workspace/workspace-link"
import {
  evidenceSummary,
  knowledgeKinds,
  maturityNames,
  type Knowledge,
} from "@/lib/wqb-knowledge"

function PerformancePreview({ item }: { item: Knowledge }) {
  const groups = item.effects.performancePreview || []
  return (
    <div className="space-y-1 text-xs">
      {groups.slice(0, 2).map((group, index) => (
        <p key={index}>
          {String(group.settings.region || "未知市场")} · Sharpe {group.sharpeMin ?? "缺失"}～{group.sharpeMax ?? "缺失"}
          <span className="text-muted-foreground">（{group.scopeComplete ? "同设置样本" : "条件缺失样本"} {group.sampleCount}）</span>
        </p>
      ))}
      {groups.length > 2 ? <p className="text-muted-foreground">另有 {groups.length - 2} 组，可在详情查看</p> : null}
      {item.effects.performancePreviewTruncated ? <p className="text-muted-foreground">仅预览前 20 个历史快照</p> : null}
      {groups.length === 0 ? <p className="text-muted-foreground">暂无可比较表现</p> : null}
    </div>
  )
}

export default function KnowledgePage() {
  const filterItems = React.useMemo<SearchFilterItem[]>(() => [
    { key: "text", label: "知识内容", type: "text" },
    {
      key: "kind",
      label: "知识类型",
      type: "text",
      options: Object.entries(knowledgeKinds).map(([value, label]) => ({ value, label })),
    },
    {
      key: "maturity",
      label: "证据成熟度",
      type: "text",
      options: Object.entries(maturityNames).map(([value, label]) => ({ value, label })),
    },
  ], [])

  const columns = React.useMemo<Column<Knowledge>[]>(() => [
    { key: "id", title: "ID", width: 76, sortable: true, className: "text-muted-foreground font-medium" },
    {
      key: "revision.title",
      title: "知识",
      width: 360,
      fixed: "left",
      render: (_, item) => (
        <div className="min-w-0">
          <WorkspaceLink className="font-medium text-primary hover:underline" href={`/dashboard/wqb/knowledge/${item.id}`}>
            {item.revision.title}
          </WorkspaceLink>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.revision.statement}</p>
        </div>
      ),
    },
    {
      key: "kind", title: "类型", width: 130, sortable: true,
      render: (_, item) => <Badge variant="outline">{knowledgeKinds[item.kind] || item.kind}</Badge>,
    },
    {
      key: "revision.version", title: "版本", width: 80, align: "center", sortable: true,
      render: (_, item) => `v${item.revision.version}`,
    },
    {
      key: "effects.performancePreview", title: "实际效果", width: 340,
      render: (_, item) => <PerformancePreview item={item} />,
    },
    {
      key: "effects.evidence", title: "应用与证据", width: 250,
      render: (_, item) => (
        <div className="space-y-1 text-xs">
          <p>{evidenceSummary(item)}</p>
          <p className="text-muted-foreground">历史应用 {item.effects.applicationCount} · 已记录采用 {item.effects.usage.APPLIED || 0} 次</p>
        </div>
      ),
    },
    {
      key: "revision.maturity", title: "成熟度", width: 140, sortable: true,
      render: (_, item) => <Badge>{maturityNames[item.revision.maturity] || item.revision.maturity}</Badge>,
    },
  ], [])

  return (
    <CrudLayout<Knowledge>
      icon={BookOpen}
      title="WQB 知识与实际效果"
      endpoint="/quants/wqb/knowledge"
      filterItems={filterItems}
      storageKey="wqb-knowledge-page-filters"
      columns={columns}
      pageSizeOptions={[20, 50, 100]}
      defaultPageSize={20}
    />
  )
}
