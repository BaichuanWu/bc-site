"use client"

import * as React from "react"
import useSWR from "swr"
import { Droplets, ExternalLink, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/common/data-table"
import { ListPageShell } from "@/components/common/list-page-shell"
import { apiClient, fetcher } from "@/lib/api"
import { useAsyncAction } from "@/hooks/use-async-action"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { formatDateTime } from "@/lib/date-utils"

type OsmosisAlpha = {
  id: string | number
  wqbAlphaId: string
  wqbUrl?: string
  region: string
  delay: number
  universe: string
  osmosisPoints: number
  sharpe: number
  fitness: number
  margin: number
  turnover: number
  trendScore: number
  intergrityScore: number
  expression: string
  wqbSubmittedTime?: string
}

type OsmosisAlphaResponse = {
  dataSource?: OsmosisAlpha[]
  total?: number
}

const numberText = (value: unknown, digits = 2) => (Number(value) || 0).toFixed(digits)

export default function WqbOsmosisPage() {
  useWorkspaceTabTitle("/dashboard/wqb/osmosis", "Osmosis")
  const { run, isLoading } = useAsyncAction()
  const { data, isLoading: isFetching, mutate } = useSWR<OsmosisAlphaResponse>(
    "/quants/wqb/osmosis-alpha",
    fetcher,
  )

  const items = React.useMemo(() => data?.dataSource || [], [data?.dataSource])
  const totalPoints = React.useMemo(
    () => items.reduce((sum, item) => sum + Number(item.osmosisPoints || 0), 0),
    [items],
  )

  const handleRefresh = React.useCallback(() => {
    void mutate()
  }, [mutate])

  const handleUpdate = React.useCallback(async () => {
    await run(
      () => apiClient.post("/quants/wqb/osmosis-points/update"),
      {
        successMessage: "Osmosis points updated",
        errorMessage: "Failed to update osmosis points",
        onSuccess: async () => {
          await mutate()
        },
      },
    )
  }, [mutate, run])

  const columns = React.useMemo<Column<OsmosisAlpha>[]>(() => [
    { key: "id", title: "ID", width: 72, className: "text-muted-foreground font-medium" },
    {
      key: "wqbAlphaId",
      title: "WQB ID",
      width: 132,
      fixed: "left",
      className: "font-semibold",
      render: (value, item) => item.wqbUrl ? (
        <a
          href={item.wqbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
        >
          {String(value || "")}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : String(value || ""),
    },
    {
      key: "osmosisPoints",
      title: "Points",
      width: 96,
      align: "right",
      sortable: true,
      render: (value) => (
        <Badge variant="default" className="tabular-nums">
          {Number(value || 0).toLocaleString()}
        </Badge>
      ),
    },
    { key: "region", title: "Region", width: 84, align: "center", className: "font-semibold text-blue-500/90" },
    { key: "delay", title: "Delay", width: 72, align: "center" },
    { key: "universe", title: "Universe", width: 110, truncate: true },
    { key: "sharpe", title: "Sharpe", width: 92, align: "right", render: (value) => numberText(value, 2) },
    { key: "fitness", title: "Fitness", width: 92, align: "right", render: (value) => numberText(value, 2) },
    { key: "margin", title: "Margin", width: 96, align: "right", render: (value) => numberText(Number(value || 0) * 10000, 2) },
    { key: "turnover", title: "Turn", width: 88, align: "right", render: (value) => numberText(value, 4) },
    { key: "trendScore", title: "Trend", width: 88, align: "right" },
    { key: "intergrityScore", title: "Integrity", width: 96, align: "right" },
    {
      key: "wqbSubmittedTime",
      title: "Submitted",
      width: 168,
      render: (value) => formatDateTime(value as string | undefined, "Never"),
    },
    {
      key: "expression",
      title: "Expression",
      width: 360,
      truncate: true,
      className: "font-mono text-[11px]",
    },
  ], [])

  return (
    <ListPageShell
      title="WQB Osmosis"
      icon={Droplets}
      actions={
        <>
          <Button variant="outline" onClick={handleRefresh} disabled={isFetching || isLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            <Droplets className="mr-2 h-4 w-4" />
            Update Points
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border bg-card p-3">
          <div className="text-xs font-medium uppercase text-muted-foreground">Alphas</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{items.length}</div>
        </div>
        <div className="rounded-md border bg-card p-3">
          <div className="text-xs font-medium uppercase text-muted-foreground">Total Points</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{totalPoints.toLocaleString()}</div>
        </div>
        <div className="rounded-md border bg-card p-3">
          <div className="text-xs font-medium uppercase text-muted-foreground">Last Fetch</div>
          <div className="mt-1 text-sm font-medium">{isFetching ? "Loading" : formatDateTime(new Date().toISOString())}</div>
        </div>
      </div>
      <DataTable items={items} columns={columns} />
    </ListPageShell>
  )
}
