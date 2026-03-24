"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, TrendingUp, BarChart3, Code2 } from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

type Alpha = {
    id: string | number
    wqbAlphaId: string
    expression: string
    sharpe: number
    fitness: number
    margin: number
    turnover: number
    pc: number
    state: number
    wqbData?: any
    wqbPnlData?: {
        records: any[]
        schema: { properties: { name: string }[] }
    }
}

import { Suspense } from "react"

export default function AlphaAnalysisPage() {
    return (
        <Suspense fallback={<div className="flex h-[400px] items-center justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <AnalysisContent />
        </Suspense>
    )
}

function AnalysisContent() {
    const searchParams = useSearchParams()
    const rawIds = searchParams.getAll("ids")

    // Handle both ?ids=1&ids=2 and ?ids=1,2
    const ids = React.useMemo(() => {
        const flattened = rawIds.flatMap(id => id.split(","))
        return Array.from(new Set(flattened)).filter(id => id && !isNaN(Number(id)))
    }, [rawIds])

    const [alphas, setAlphas] = React.useState<Alpha[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [chartData, setChartData] = React.useState<any[]>([])

    React.useEffect(() => {
        async function fetchAlphas() {
            if (ids.length === 0) {
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)

                // Single batch request is more efficient
                const res: any = await apiClient.get(`/quants/wqb/alpha`, {
                    params: { q: JSON.stringify({ id: { in_: ids.map(Number) } }) }
                })

                const fetchedAlphas = (res?.dataSource || res?.data_source || res?.data || (Array.isArray(res) ? res : [])) as Alpha[]
                setAlphas(fetchedAlphas || [])

                // Process PnL data for Recharts
                const dateMap: Record<string, any> = {}

                fetchedAlphas.forEach((alpha) => {
                    const records = alpha.wqbPnlData?.records || []
                    const schema = alpha.wqbPnlData?.schema?.properties || []

                    // Find indices for date and pnl
                    const dateIdx = schema.findIndex(p => p.name.toLowerCase() === 'date')
                    const pnlIdx = schema.findIndex(p => p.name.toLowerCase() === 'pnl' || p.name.toLowerCase() === 'cum_pnl')

                    if (dateIdx === -1 || pnlIdx === -1) {
                        console.warn(`Alpha ${alpha.id} missing pnl/date in schema:`, schema)
                        return
                    }

                    records.forEach((rec: any) => {
                        const dateStr = rec[dateIdx]
                        if (!dateStr) return

                        const date = new Date(dateStr).toISOString().split('T')[0]
                        if (!dateMap[date]) dateMap[date] = { date }
                        dateMap[date][`alpha_${alpha.id}`] = Number(rec[pnlIdx]) || 0
                    })
                })

                const sortedData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date))
                setChartData(sortedData)

            } catch (e) {
                console.error("Failed to fetch alphas for analysis", e)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAlphas()
    }, [ids.join(',')])

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (alphas.length === 0) {
        return (
            <div className="p-8 text-center pt-20">
                <h3 className="text-xl font-bold">No Alphas Found</h3>
                <p className="text-muted-foreground mt-2">Could not retrieve data for IDs: {ids.join(", ")}</p>
                <Button asChild className="mt-6" variant="outline">
                    <Link href="/dashboard/world-brain-quant/alpha">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Search Table
                    </Link>
                </Button>
            </div>
        )
    }

    const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"]

    return (
        <div className="space-y-6 pb-12 transition-colors duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="rounded-full">
                        <Link href="/dashboard/world-brain-quant/alpha">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                            Alpha Intelligence Analysis
                        </h1>
                        <p className="text-sm text-muted-foreground">Deep performance comparison of {alphas.length} selected variants.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Metric Comparison */}
                <Card className="lg:col-span-1 border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                            Metrics Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                                    <TableHead className="w-[100px]">Metric</TableHead>
                                    {alphas.map((a) => (
                                        <TableHead key={a.id} className="text-right">#{a.id}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {['sharpe', 'fitness', 'margin', 'turnover', 'pc'].map((metric) => (
                                    <TableRow key={metric} className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                                        <TableCell className="font-medium capitalize">{metric}</TableCell>
                                        {alphas.map((a) => (
                                            <TableCell key={a.id} className="text-right font-mono text-sm leading-none py-3">
                                                {(Number((a as any)[metric]) || 0).toFixed(metric === 'margin' || metric === 'turnover' || metric === 'pc' ? 4 : 2)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* PnL Chart */}
                <Card className="lg:col-span-2 border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/20 dark:bg-slate-800/20">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            Consolidated Returns
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.1} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => str.substring(5)}
                                        minTickGap={60}
                                        fontSize={11}
                                        tick={{ fill: '#888888' }}
                                    />
                                    <YAxis fontSize={11} tick={{ fill: '#888888' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--background)',
                                            borderColor: 'var(--border)',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            fontSize: '12px'
                                        }}
                                        itemStyle={{ padding: '2px 0' }}
                                    />
                                    <Legend iconType="circle" />
                                    {alphas.map((alpha, index) => (
                                        <Line
                                            key={alpha.id}
                                            type="monotone"
                                            dataKey={`alpha_${alpha.id}`}
                                            name={`#${alpha.id} (${alpha.wqbAlphaId || 'N/A'})`}
                                            stroke={COLORS[index % COLORS.length]}
                                            dot={false}
                                            strokeWidth={2.5}
                                            animationDuration={1500}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logic/Expressions */}
            <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Code2 className="h-5 w-5 text-purple-500" />
                        Alpha Generation Logic
                    </CardTitle>
                    <CardDescription>Tracing the expression changes across the family.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {alphas.map((alpha) => (
                        <div key={alpha.id} className="space-y-3 group border-b dark:border-slate-800 pb-6 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-blue-600 dark:text-blue-400">Alpha #{alpha.id}</span>
                                    <span className="text-sm font-medium opacity-70">ID: {alpha.wqbAlphaId}</span>
                                </div>
                                <Badge variant={alpha.state >= 20 ? 'default' : 'secondary'} className={alpha.state >= 20 ? 'bg-green-500/20 text-green-600 hover:bg-green-500/30 dark:text-green-400' : ''}>
                                    {alpha.state >= 20 ? 'Submitted' : 'Simulated'}
                                </Badge>
                            </div>
                            <div className="relative group/expr">
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <div className="text-[10px] font-mono opacity-30 select-none bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">FASTEXPR</div>
                                </div>
                                <pre className="rounded-xl bg-slate-50 dark:bg-slate-950 p-6 text-[11px] sm:text-xs font-mono overflow-x-auto border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-blue-100/90 group-hover/expr:border-blue-500/50 transition-all duration-300 shadow-xl leading-relaxed selection:bg-blue-500/30">
                                    {alpha.expression}
                                </pre>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
