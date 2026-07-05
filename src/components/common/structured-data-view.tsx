"use client"

import type * as React from "react"

import { Badge } from "@/components/ui/badge"
import { JsonNode } from "@/components/common/json-node"
import { cn } from "@/lib/utils"

type StructuredRenderer = {
  id: string
  match: (value: unknown) => boolean
  render: (value: unknown, depth: number) => React.ReactNode
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function isWqbAlphaItem(value: unknown) {
  if (!isRecord(value)) return false
  return Boolean(
    readString(value.expression) ||
      readString(value.alphaExpression) ||
      readString(value.alpha_expression) ||
      readString(value.wqbAlphaId) ||
      readString(value.wqb_alpha_id),
  )
}

function expressionOf(item: Record<string, unknown>) {
  return readString(item.expression) || readString(item.alphaExpression) || readString(item.alpha_expression) || ""
}

function alphaIdOf(item: Record<string, unknown>) {
  return item.id ?? item.alphaId ?? item.alpha_id ?? item.wqbAlphaId ?? item.wqb_alpha_id ?? ""
}

function metricBadges(item: Record<string, unknown>) {
  const metrics = ["sharpe", "fitness", "margin", "pc", "warnCount", "warn_count", "failCount", "fail_count"]
  return metrics
    .map((key) => [key, readNumber(item[key])] as const)
    .filter((entry): entry is readonly [string, number] => entry[1] !== null)
}

function WqbAlphaItemView({ item }: { item: Record<string, unknown> }) {
  const expression = expressionOf(item)
  return (
    <div className="space-y-2 rounded-md border bg-background/50 p-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="secondary" className="h-5 text-[10px] font-mono">
          #{String(alphaIdOf(item) || "alpha")}
        </Badge>
        {metricBadges(item).map(([key, value]) => (
          <Badge key={key} variant="outline" className="h-5 text-[10px]">
            {key.replace("_", " ")} {value}
          </Badge>
        ))}
      </div>
      {expression ? (
        <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words rounded border bg-muted/30 p-2 font-mono text-[11px]">
          {expression}
        </pre>
      ) : null}
      <details className="text-[11px]">
        <summary className="cursor-pointer text-muted-foreground">Raw data</summary>
        <div className="mt-2 rounded border bg-muted/20 p-2">
          <JsonNode data={item} depth={0} />
        </div>
      </details>
    </div>
  )
}

function isWqbAlphaList(value: unknown) {
  return Array.isArray(value) && value.length > 0 && value.every(isWqbAlphaItem)
}

function isValidationErrorList(value: unknown) {
  return Array.isArray(value) && value.some((item) => isRecord(item) && (item.code || item.message || item.path))
}

const renderers: StructuredRenderer[] = [
  {
    id: "wqb-alpha-list",
    match: isWqbAlphaList,
    render: (value) => (
      <div className="space-y-2">
        {(value as Record<string, unknown>[]).map((item, index) => (
          <WqbAlphaItemView key={`${String(alphaIdOf(item))}-${index}`} item={item} />
        ))}
      </div>
    ),
  },
  {
    id: "wqb-alpha-item",
    match: isWqbAlphaItem,
    render: (value) => <WqbAlphaItemView item={value as Record<string, unknown>} />,
  },
  {
    id: "validation-errors",
    match: isValidationErrorList,
    render: (value) => (
      <div className="space-y-2">
        {(value as Record<string, unknown>[]).map((item, index) => (
          <div key={index} className="rounded-md border border-destructive/20 bg-destructive/5 p-2 text-xs">
            <div className="font-semibold text-destructive">{String(item.code || item.result || "validation_error")}</div>
            <div className="mt-1 text-muted-foreground">{String(item.message || item.path || "")}</div>
          </div>
        ))}
      </div>
    ),
  },
]

function valueSummary(value: unknown) {
  if (Array.isArray(value)) return `${value.length} items`
  if (isRecord(value)) return `${Object.keys(value).length} fields`
  if (value === null) return "null"
  if (value === undefined) return "undefined"
  return String(value)
}

function StructuredObjectView({
  data,
  depth,
}: {
  data: Record<string, unknown>
  depth: number
}) {
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => (
        <details key={key} className="rounded-md border bg-background/40">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left">
            <span className="font-mono text-[11px] font-semibold">{key}</span>
            <span className="truncate text-[10px] text-muted-foreground">
              {valueSummary(value)}
            </span>
          </summary>
          <div className="max-h-80 overflow-auto border-t bg-muted/10 p-3">
            <StructuredDataView data={value} depth={depth + 1} />
          </div>
        </details>
      ))}
    </div>
  )
}

export function StructuredDataView({
  data,
  className,
  depth = 0,
}: {
  data: unknown
  className?: string
  depth?: number
}) {
  const renderer = renderers.find((candidate) => candidate.match(data))

  return (
    <div className={cn("text-[11px]", className)}>
      {renderer ? (
        renderer.render(data, depth)
      ) : isRecord(data) && depth < 2 ? (
        <StructuredObjectView data={data} depth={depth} />
      ) : (
        <JsonNode data={data} depth={0} />
      )}
    </div>
  )
}
