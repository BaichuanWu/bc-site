"use client"

import * as React from "react"
import { Calculator, LineChart, RefreshCcw } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { CrudLayout } from "@/components/common/crud-layout"
import { type Column } from "@/components/common/data-table"
import { normalizeCrudListResponse } from "@/lib/crud-response"
import { formatDateTime } from "@/lib/date-utils"
import { Badge } from "@/components/ui/badge"
import { resolveInitialFilterState, type SearchFilterItem } from "@/components/common/query-filters"
import { AlphaActionMenu } from "@/components/alpha/alpha-action-menu"
import { AlphaDiagnoseCell, type AlphaDiagnostics } from "@/components/alpha/alpha-diagnose-cell"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { useTaskAction } from "@/hooks/use-task-action"
import { useSWRConfig } from "swr"
import {
    type WqbPnlProfile,
} from "@/lib/wqb-pnl-profile"
import { AnnualSharpes, RecentFlatPeriod } from "@/components/alpha/pnl-profile-cell"
import { formatNeutralization, WQB_REGION_OPTIONS } from "@/lib/wqb-platform"

type Alpha = {
    id: string | number
    wqbAlphaId: string
    wqbUrl?: string
    expression: string
    description?: string
    sharpe: number
    fitness: number
    margin: number
    turnover: number
    wqbTypName: string
    state: number
    settings?: { simulationMode?: string }
    isPnlValid?: boolean
    sc: number
    pc: number
    pcUpdateTime?: string
    raBlockCount: number
    ppaBlockCount: number
    diagnostics: AlphaDiagnostics
    pnlProfile?: WqbPnlProfile
    region: string
    universe: string
    delay: number
    parentId?: string | number
    ancestorId?: string | number
}

type AlphaListResponse = {
    items?: Alpha[]
    total?: number
    [key: string]: unknown
}

const getStateBadge = (state: number, isPnlValid?: boolean) => {
    if (isPnlValid === false) {
        return <Badge variant="destructive">{getStateName(state)}</Badge>
    }

    return <Badge variant={getStateVariant(state)} className={getStateClassName(state)}>{getStateName(state)}</Badge>
}

const getStateName = (state: number) => {
    switch (state) {
        case 0: return "Initialized"
        case 5: return "Simulating"
        case 8: return "Failed"
        case 10: return "Simulated"
        case 20: return "Submitted"
        case 40: return "Active"
        default: return `Unknown (${state})`
    }
}

const getStateVariant = (state: number) => {
    if (state === 0) return "outline"
    if (state === 5) return "secondary"
    if (state === 8) return "destructive"
    return "default"
}

const getStateClassName = (state: number) => {
    if (state === 5) return "bg-yellow-500 hover:bg-yellow-600 text-white"
    if (state === 10) return "bg-blue-500 hover:bg-blue-600"
    if (state === 20) return "bg-green-500 hover:bg-green-600"
    return undefined
}

export default function AlphaPage() {
    const [currentFilters, setCurrentFilters] = React.useState<Record<string, unknown>>(() => {
        const initial = resolveInitialFilterState("alpha-page-filters")
        const profileFilters = { ...initial }
        delete profileFilters.trendScore
        delete profileFilters.intergrityScore
        return profileFilters
    })
    useWorkspaceTabTitle("/dashboard/wqb/alpha", "WQB Alphas")
    const { runNamedTask } = useTaskAction()
    const { mutate } = useSWRConfig()
    const hasActiveQuery = React.useMemo(
        () => Object.keys(currentFilters).length > 0,
        [currentFilters]
    )

    const refreshAlphaList = React.useCallback(() => {
        void mutate(
            (key: unknown) =>
                typeof key === "string" && key.startsWith("/quants/wqb/alpha?"),
            undefined,
            { revalidate: true }
        )
    }, [mutate])

    const patchAlphaInCachedLists = React.useCallback((updatedAlpha: Alpha) => {
        void mutate(
            (key: unknown) =>
                typeof key === "string" && key.startsWith("/quants/wqb/alpha?"),
            (current: AlphaListResponse | undefined) => {
                if (!current || !Array.isArray(current.items)) return current

                let changed = false
                const nextItems = current.items.map((alpha) => {
                    if (String(alpha.id) !== String(updatedAlpha.id)) return alpha

                    changed = true
                    return {
                        ...alpha,
                        ...updatedAlpha,
                    }
                })

                if (!changed) return current
                return {
                    ...current,
                    items: nextItems,
                }
            },
            { revalidate: false }
        )
    }, [mutate])

    const refreshAlphaRow = React.useCallback(async (alphaId: string | number) => {
        const response = await apiClient.get("/quants/wqb/alpha", {
            params: {
                query: JSON.stringify({ id: alphaId }),
                offset: 0,
                limit: 1,
            },
        })
        const [updatedAlpha] = normalizeCrudListResponse<Alpha>(response)
        if (updatedAlpha) {
            patchAlphaInCachedLists(updatedAlpha)
        }
    }, [patchAlphaInCachedLists])

    const handleBatchSimulate = async () => {
        await runNamedTask(
            "simulate_batch_task",
            { kwargs: { query: currentFilters } },
            { fallbackSuccessMessage: "Batch simulation started", errorMessage: "Failed to start batch simulation" }
        )
    }

    const handleBatchUpdatePc = async () => {
        await runNamedTask(
            "update_alpha_pc_task",
            { kwargs: { query: currentFilters } },
            {
                fallbackSuccessMessage: "PC update task started",
                errorMessage: "Failed to start PC update",
                onTaskCompleted: refreshAlphaList,
            }
        )
    }

    const handleBatchCalcPnl = async () => {
        await runNamedTask(
            "calc_pnl_score_by_query",
            { kwargs: { query: currentFilters } },
            {
                fallbackSuccessMessage: "PnL profile refresh started",
                errorMessage: "Failed to refresh PnL profiles",
                onTaskCompleted: refreshAlphaList,
            }
        )
    }

    const filterItems: SearchFilterItem[] = React.useMemo(() => [
        {
            key: "wqbTyp",
            label: "WQB Typ",
            type: "number",
            options: [
                { label: "Regular (0)", value: 0 },
                { label: "Super (10)", value: 10 }
            ]
        },
        {
            key: "state",
            label: "State",
            type: "number",
            options: [
                { label: "Initialized (0)", value: 0 },
                { label: "Simulating (5)", value: 5 },
                { label: "Failed (8)", value: 8 },
                { label: "Simulated (10)", value: 10 },
                { label: "Submitted (20)", value: 20 },
                { label: "Active (20)", value: 40 },
            ]
        },
        { key: "sharpe", label: "Sharpe Constraints", type: "number" },
        { key: "fitness", label: "Fitness Score", type: "number" },
        { key: "margin", label: "Margin Filter", type: "number" },
        { key: "wqbAlphaId", label: "WQB ID", type: "text" },
        { key: "id", label: "ID", type: "number" },
        {
            key: "region",
            label: "Region",
            type: "text",
            options: WQB_REGION_OPTIONS,
        },
        { key: "operatorCount", label: "Operator Count", type: "number" },
        {
            key: "pnlProfile.status",
            label: "PnL Analysis",
            type: "text",
            options: [
                { label: "Analyzed", value: "ready" },
                { label: "Unavailable", value: "unavailable" },
            ],
        },
        { key: "pnlProfile.recentLongestFlatRun", label: "Recent Max Flat Obs.", type: "number" },
        { key: "pnlProfile.recentMinimumAnnualSharpe", label: "Min 3Y Annual Sharpe", type: "number" },
        { key: "sc", label: "Self Corr (SC)", type: "number" },
        { key: "bc", label: "batch Corr (BC)", type: "number" },
        { key: "pc", label: "Production Corr (PC)", type: "number" },
        { key: "raBlockCount", label: "RA Block Count", type: "number" },
        { key: "ppaBlockCount", label: "PPA Block Count", type: "number" },
        {
            key: "settings.neutralization",
            label: "Neutralization",
            type: "text",
            options: [
                { label: "MARKET", value: "MARKET" },
                { label: "INDUSTRY", value: "INDUSTRY" },
                { label: "SECTOR", value: "SECTOR" },
                { label: "SUBINDUSTRY", value: "SUBINDUSTRY" },
                { label: "FAST", value: "FAST" },
            ]
        },
        {
            key: "settings.language",
            label: "Language",
            type: "text",
            options: [
                { label: "PYTHON", value: "PYTHON" },
                { label: "FASTEXPR", value: "FASTEXPR" },
            ]
        },
    ], [])

    const columns: Column<Alpha>[] = React.useMemo(() => [
        { key: "id", title: "ID", width: 80, className: "text-slate-500 font-medium" },
        { 
            key: "wqbAlphaId", 
            title: "WQB ID", 
            width: 120, 
            className: "font-semibold", 
            fixed: 'left',
            render: (val, item) => {
                const isQuick = item.settings?.simulationMode === "QUICK"
                return item.wqbUrl ? (
                    <a
                        href={item.wqbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={isQuick
                            ? "text-yellow-600 hover:text-yellow-700 hover:underline dark:text-yellow-400 dark:hover:text-yellow-300"
                            : "text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"}
                        title={isQuick ? "QUICK backtest" : undefined}
                    >
                        {val as string}
                    </a>
                ) : (
                    <span className={isQuick ? "text-yellow-600 dark:text-yellow-400" : undefined} title={isQuick ? "QUICK backtest" : undefined}>
                        {val as string}
                    </span>
                )
            }
        },
        {
            key: "expression",
            title: "Expression",
            width: 300,
            truncate: true,
            className: "font-mono text-[10px] sm:text-xs",
        },
        {
            key: "description",
            title: "Description",
            width: 280,
            truncate: true,
            className: "text-xs text-muted-foreground",
        },
        { key: "region", title: "Region", width: 80, align: 'center', className: "font-bold text-blue-500/80" },
        { key: "universe", title: "Universe", width: 100, truncate: true },
        { key: "delay", title: "Delay", width: 70, align: 'center' },
        {
            key: "settings.neutralization",
            title: "Neutral",
            width: 110,
            align: 'center',
            render: (val) => {
                const value = val == null ? "" : String(val)
                return <span className="block w-full truncate cursor-help" title={value || undefined}>{formatNeutralization(value)}</span>
            },
        },
        { key: "sharpe", title: "Sharpe", width: 92, align: 'right', sortable: true, render: (val) => (Number(val) || 0).toFixed(2) },
        { key: "fitness", title: "Fitness", width: 92, align: 'right', sortable: true, render: (val) => (Number(val) || 0).toFixed(2) },
        { key: "turnover", title: "Turn", width: 92, align: 'right', sortable: true, render: (val) => (Number(val) || 0).toFixed(4) },
        { key: "margin", title: "Margin", width: 96, align: 'right', sortable: true, render: (val) => (Number(val) * 10000 || 0).toFixed(2) },
        { key: "wqbData.is.returns", title: "Returns", width: 96, align: 'right', render: (val) => val == null ? "-" : (Number(val) * 100).toFixed(2) },
        { key: "wqbData.is.drawdown", title: "Drawdown", width: 96, align: 'right', render: (val) => val == null ? "-" : (Number(val) * 100).toFixed(2) },
        { key: "operatorCount", title: "Ops", width: 84, align: 'right', sortable: true },
        { key: "raBlockCount", title: "RA Count", width: 96, align: 'right', sortable: true, render: (val) => val == null ? "-" : String(val) },
        { key: "ppaBlockCount", title: "PPA Count", width: 96, align: 'right', sortable: true, render: (val) => val == null ? "-" : String(val) },
        {
            key: "diagnostics",
            title: "Diagnose",
            width: 180,
            render: (_, item) => <AlphaDiagnoseCell alphaId={item.id} wqbAlphaId={item.wqbAlphaId} diagnostics={item.diagnostics} />,
        },
        {
            key: "pnlProfile.recentLongestFlatRun",
            title: "Recent Flat",
            width: 142,
            align: "right",
            sortable: true,
            render: (_, item) => <RecentFlatPeriod profile={item.pnlProfile} />,
        },
        {
            key: "pnlProfile.recentAnnualSharpes",
            title: "Annual Sharpe",
            width: 150,
            render: (_, item) => <AnnualSharpes profile={item.pnlProfile} />,
        },
        { key: "sc", title: "SC", width: 92, align: 'right', sortable: true, render: (val) => (Number(val) || 0).toFixed(4) },
        { key: "bc", title: "BC", width: 92, align: 'right', sortable: true, render: (val) => (Number(val) || 0).toFixed(4) },
        { 
            key: "pc", 
            title: "PC", 
            width: 108,
            align: 'right', 
            sortable: true, 
            render: (val, item) => (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 group/pc">
                                <span className="cursor-help border-b border-dotted border-muted-foreground/30">
                                    {(Number(val) || 0).toFixed(4)}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover/pc:opacity-100 transition-opacity"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        await runNamedTask(
                                            "update_alpha_pc_task",
                                            { kwargs: { query: { id: item.id } } },
                                            {
                                                fallbackSuccessMessage: "PC update task started",
                                                errorMessage: "Failed to start PC update",
                                                onTaskCompleted: async () => {
                                                    await refreshAlphaRow(item.id)
                                                },
                                            }
                                        )
                                    }}
                                >
                                    <RefreshCcw className="h-3.5 w-3.5 text-muted-foreground hover:text-indigo-600 transition-colors" />
                                </Button>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-[10px] font-mono">
                                Last Updated: {formatDateTime(item.pcUpdateTime, "Never")}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) 
        },
        {
            key: "wqbTyp",
            title: "Type",
            width: 110,
            render: (_, item) => <Badge variant="outline">{item.wqbTypName || 'Regular (0)'}</Badge>
        },
        {
            key: "state",
            title: "State",
            width: 120,
            render: (val, item) => getStateBadge(val as number, item.isPnlValid)
        },
        {
            key: "actions",
            title: "Actions",
            width: 80,
            fixed: 'right',
            render: (_, item) => <AlphaActionMenu alpha={item} onSuccess={() => refreshAlphaRow(item.id)} />
        }
    ], [refreshAlphaRow, runNamedTask])

    return (
        <CrudLayout<Alpha>
            icon={LineChart}
            title="WQB Alpha"
            endpoint="/quants/wqb/alpha"
            idKey="wqbAlphaId"
            headerActions={
                <>
                    <Button variant="outline" onClick={handleBatchCalcPnl} disabled={!hasActiveQuery}>
                        <Calculator className="mr-2 h-4 w-4" /> Calc PnL by Query
                    </Button>
                    <Button variant="outline" onClick={handleBatchUpdatePc} disabled={!hasActiveQuery}>
                        <RefreshCcw className="mr-2 h-4 w-4" /> Update PC by Query
                    </Button>
                </>
            }
            filterItems={filterItems}
            storageKey="alpha-page-filters"
            columns={columns}
            onFilterChange={setCurrentFilters}
            addButtonLabel="Simulate by Query"
            onAdd={handleBatchSimulate}
            pageSizeOptions={[20, 50, 100, 200]}
            defaultPageSize={50}
        />
    )
}
