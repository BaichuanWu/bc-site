"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Bot, CheckSquare, Loader2, Play, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/common/page-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { WorkspaceLink } from "@/components/workspace/workspace-link"
import { apiClient } from "@/lib/api"
import { getJsonArray, getJsonObject } from "@/types/json"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { useTaskAction } from "@/hooks/use-task-action"
import { toast } from "sonner"

type Alpha = {
    id: string | number
    wqbAlphaId: string
    wqbUrl?: string
    expression: string
    sharpe: number
    fitness: number
    margin: number
    turnover: number
    pc: number
    sc?: number
    bc?: number
    failCount?: number
    warnCount?: number
    operatorCount?: number
    isChecksInfo?: string[]
    trendScore?: number
    intergrityScore?: number
    parentId?: string | number
    ancestorId?: string | number
    description?: string
    region?: string
    universe?: string
    delay?: number
    wqbTypName?: string
    isPnlValid?: boolean
    state: number
    wqbData?: unknown
}

function sortRelatedAlphas(alphas: Alpha[], ancestorId: string | number | null) {
    return [...alphas].sort((left, right) => {
        if (ancestorId !== null) {
            const leftIsAncestor = String(left.id) === String(ancestorId)
            const rightIsAncestor = String(right.id) === String(ancestorId)
            if (leftIsAncestor !== rightIsAncestor) return leftIsAncestor ? -1 : 1
        }

        return (
            (Number(right.state) || 0) - (Number(left.state) || 0)
            || (Number(left.failCount) || 0) - (Number(right.failCount) || 0)
            || (Number(left.warnCount) || 0) - (Number(right.warnCount) || 0)
            || (Number(right.fitness) || 0) - (Number(left.fitness) || 0)
            || (Number(left.id) || 0) - (Number(right.id) || 0)
        )
    })
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

const getStateBadge = (state: number, isPnlValid?: boolean) => {
    if (isPnlValid === false) {
        return <Badge variant="destructive">{getStateName(state)}</Badge>
    }

    return <Badge variant={getStateVariant(state)} className={getStateClassName(state)}>{getStateName(state)}</Badge>
}

export default function AlphaAnalysisPage() {
    return (
        <React.Suspense fallback={<div className="flex h-[400px] items-center justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <AnalysisContent />
        </React.Suspense>
    )
}

function AnalysisContent() {
    const navigate = useWorkspaceNavigate()
    const { runTask, runNamedTask, isLoading: isTaskLoading } = useTaskAction()
    const searchParams = useSearchParams()
    const rawIds = searchParams.getAll("ids")
    const rawIdsKey = rawIds.join(",")
    const lineageOf = searchParams.get("lineageOf")

    // Handle both ?ids=1&ids=2 and ?ids=1,2
    const ids = React.useMemo(() => {
        const flattened = rawIdsKey.split(",")
        return Array.from(new Set(flattened)).filter(id => id && !isNaN(Number(id)))
    }, [rawIdsKey])
    const idNumbers = React.useMemo(() => ids.map(Number), [ids])

    const [alphas, setAlphas] = React.useState<Alpha[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [ancestorId, setAncestorId] = React.useState<string | number | null>(null)
    const [selectedAlphaIds, setSelectedAlphaIds] = React.useState<Array<string | number>>([])
    const [refreshKey, setRefreshKey] = React.useState(0)
    const selectedAlphaIdSet = React.useMemo(
        () => new Set(selectedAlphaIds.map((id) => String(id))),
        [selectedAlphaIds],
    )
    const untestedAlphaIds = React.useMemo(
        () => alphas.filter((alpha) => Number(alpha.state) < 10).map((alpha) => alpha.id),
        [alphas],
    )
    const toggleAlphaSelection = React.useCallback((alphaId: string | number) => {
        setSelectedAlphaIds((current) => {
            const key = String(alphaId)
            if (current.some((id) => String(id) === key)) {
                return current.filter((id) => String(id) !== key)
            }
            return [...current, alphaId]
        })
    }, [])
    const selectUntestedAlphas = React.useCallback(() => {
        setSelectedAlphaIds(untestedAlphaIds)
    }, [untestedAlphaIds])
    const simulateAlphaIds = React.useCallback(async (alphaIds: Array<string | number>) => {
        if (alphaIds.length === 0) {
            toast.info("No alpha selected for simulation.")
            return
        }
        await runNamedTask(
            "alpha_simulate",
            { kwargs: { alphaIds } },
            {
                fallbackSuccessMessage: "Alpha simulation started",
                errorMessage: "Failed to start alpha simulation",
                onTaskCompleted: async () => {
                    setRefreshKey((value) => value + 1)
                },
            },
        )
    }, [runNamedTask])
    const startEnhancementConversation = React.useCallback(async () => {
        const sourceAlphaId = lineageOf || (alphas[0] ? String(alphas[0].id) : "")
        if (!sourceAlphaId) return
        await runTask(
            () => apiClient.post(`/quants/wqb/alpha/${sourceAlphaId}/start-enhancement-conversation`),
            {
                errorMessage: "Failed to start enhancement conversation",
                onSuccess: async (res) => {
                    const data = getJsonObject(res)
                    const conversationId = data?.conversationId
                    if (typeof conversationId !== "number") return
                    navigate(`/dashboard/conversation/${conversationId}`, undefined, {
                        title: `Alpha enhancement #${sourceAlphaId}`,
                    })
                },
            },
        )
    }, [alphas, lineageOf, navigate, runTask])

    useWorkspaceTabTitle(
        "/dashboard/wqb/alpha/analysis",
        lineageOf ? "Related WQB Alphas" : ids.length > 0 ? `WQB Alpha Analysis (${ids.length})` : "WQB Alpha Analysis",
        { cachedSearch: searchParams.toString() },
    )

    React.useEffect(() => {
        async function fetchAlphas() {
            if (!lineageOf && idNumbers.length === 0) {
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)

                const res = lineageOf
                    ? await apiClient.get(`/quants/wqb/alpha/${lineageOf}/lineage`)
                    : await apiClient.get(`/quants/wqb/alpha`, {
                        params: { q: JSON.stringify({ id: { in_: idNumbers } }) }
                    })

                const responseObject = getJsonObject(res)
                const fetchedAlphas = (getJsonArray(responseObject?.dataSource) ?? []) as Alpha[]
                const resolvedAncestorId =
                    typeof responseObject?.ancestorId === "string" || typeof responseObject?.ancestorId === "number"
                        ? responseObject.ancestorId
                        : null
                const sortedAlphas = sortRelatedAlphas(fetchedAlphas || [], resolvedAncestorId)
                setAlphas(sortedAlphas)
                setAncestorId(resolvedAncestorId)

            } catch (error) {
                console.error("Failed to fetch alphas for analysis", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAlphas()
    }, [idNumbers, lineageOf, refreshKey])

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (alphas.length === 0) {
        return (
            <PageShell>
                <div className="pt-20 text-center">
                    <h3 className="text-xl font-bold">No Alphas Found</h3>
                    <p className="mt-2 text-muted-foreground">
                        {lineageOf ? `Could not retrieve related alphas for #${lineageOf}.` : `Could not retrieve data for IDs: ${ids.join(", ")}`}
                    </p>
                    <Button asChild className="mt-6" variant="outline">
                        <WorkspaceLink href="/dashboard/wqb/alpha">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Search Table
                        </WorkspaceLink>
                    </Button>
                </div>
            </PageShell>
        )
    }

    return (
        <PageShell contentClassName="space-y-6 pb-12 transition-colors duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="rounded-full">
                        <WorkspaceLink href="/dashboard/wqb/alpha">
                            <ArrowLeft className="h-5 w-5" />
                        </WorkspaceLink>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                            {lineageOf ? "Related WQB Alphas" : "WQB Alpha Intelligence Analysis"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {lineageOf
                                ? `Ancestor family with ${alphas.length} related alpha${alphas.length === 1 ? "" : "s"}.`
                                : `Deep performance comparison of ${alphas.length} selected variants.`}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={startEnhancementConversation} disabled={isTaskLoading || alphas.length === 0}>
                        <Bot className="mr-2 h-4 w-4" /> Enhance with Agent
                    </Button>
                    <Button variant="outline" onClick={selectUntestedAlphas} disabled={untestedAlphaIds.length === 0}>
                        <CheckSquare className="mr-2 h-4 w-4" /> Select Untested
                    </Button>
                    <Button variant="outline" onClick={() => void simulateAlphaIds(selectedAlphaIds)} disabled={isTaskLoading || selectedAlphaIds.length === 0}>
                        <Play className="mr-2 h-4 w-4" /> Simulate Selected
                    </Button>
                    <Button onClick={() => void simulateAlphaIds(untestedAlphaIds)} disabled={isTaskLoading || untestedAlphaIds.length === 0}>
                        <Play className="mr-2 h-4 w-4" /> Simulate Untested
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="h-5 w-5 text-blue-500" />
                        Related Alpha Entries
                    </CardTitle>
                    <CardDescription>{lineageOf ? "Ancestor alpha is pinned as the first row." : "Selected alpha entries."}</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableHead className="w-[52px]"></TableHead>
                                <TableHead className="w-[96px]">Role</TableHead>
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead className="w-[120px]">WQB ID</TableHead>
                                <TableHead className="w-[300px]">Expression</TableHead>
                                <TableHead className="w-[280px]">Description</TableHead>
                                <TableHead className="w-[80px] text-center">Region</TableHead>
                                <TableHead className="w-[100px]">Universe</TableHead>
                                <TableHead className="w-[70px] text-center">Delay</TableHead>
                                <TableHead className="text-right">Sharpe</TableHead>
                                <TableHead className="text-right">Fitness</TableHead>
                                <TableHead className="text-right">Turn</TableHead>
                                <TableHead className="text-right">Margin</TableHead>
                                <TableHead className="text-right">Ops</TableHead>
                                <TableHead className="text-right">Fails</TableHead>
                                <TableHead className="text-right">Warns</TableHead>
                                <TableHead className="w-[320px]">Checks</TableHead>
                                <TableHead className="text-right">Trend</TableHead>
                                <TableHead className="text-right">Integrity</TableHead>
                                <TableHead className="text-right">SC</TableHead>
                                <TableHead className="text-right">BC</TableHead>
                                <TableHead className="text-right">PC</TableHead>
                                <TableHead className="w-[110px]">Type</TableHead>
                                <TableHead className="w-[120px]">State</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {alphas.map((alpha, index) => {
                                const isAncestor = ancestorId !== null
                                    ? String(alpha.id) === String(ancestorId)
                                    : index === 0 && !alpha.ancestorId

                                return (
                                    <TableRow
                                        key={alpha.id}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedAlphaIdSet.has(String(alpha.id))}
                                                onCheckedChange={() => toggleAlphaSelection(alpha.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={isAncestor ? "default" : "outline"}>
                                                {isAncestor ? "Ancestor" : "Related"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">#{alpha.id}</TableCell>
                                        <TableCell className="font-mono text-xs font-semibold">
                                            {alpha.wqbUrl ? (
                                                <a
                                                    href={alpha.wqbUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                                    onClick={(event) => event.stopPropagation()}
                                                >
                                                    {alpha.wqbAlphaId || "-"}
                                                </a>
                                            ) : alpha.wqbAlphaId || "-"}
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate font-mono text-[10px] sm:text-xs">{alpha.expression}</TableCell>
                                        <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">{alpha.description || "-"}</TableCell>
                                        <TableCell className="text-center font-bold text-blue-500/80">{alpha.region || "-"}</TableCell>
                                        <TableCell className="max-w-[100px] truncate">{alpha.universe || "-"}</TableCell>
                                        <TableCell className="text-center">{alpha.delay ?? "-"}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{(Number(alpha.sharpe) || 0).toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{(Number(alpha.fitness) || 0).toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{(Number(alpha.turnover) || 0).toFixed(4)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{(Number(alpha.margin) * 10000 || 0).toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{Number(alpha.operatorCount) || 0}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{Number(alpha.failCount) || 0}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{Number(alpha.warnCount) || 0}</TableCell>
                                        <TableCell>
                                            <div className="flex max-w-[320px] flex-wrap gap-1">
                                                {(alpha.isChecksInfo || []).length > 0 ? (
                                                    (alpha.isChecksInfo || []).map((check, checkIndex) => (
                                                        <Badge
                                                            key={`${alpha.id}-${check}-${checkIndex}`}
                                                            variant="outline"
                                                            className="whitespace-normal break-all px-1.5 py-0 text-[10px] font-mono leading-4"
                                                        >
                                                            {check}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">{Number(alpha.trendScore) || 0}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{Number(alpha.intergrityScore) || 0}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{(Number(alpha.sc) || 0).toFixed(4)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{(Number(alpha.bc) || 0).toFixed(4)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{(Number(alpha.pc) || 0).toFixed(4)}</TableCell>
                                        <TableCell><Badge variant="outline">{alpha.wqbTypName || "Regular (0)"}</Badge></TableCell>
                                        <TableCell>
                                            {getStateBadge(alpha.state, alpha.isPnlValid)}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </PageShell>
    )
}
