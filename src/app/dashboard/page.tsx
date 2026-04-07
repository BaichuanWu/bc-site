"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Activity, FileText, Lightbulb, Zap, Rocket, BarChart3, Sparkles, RefreshCcw } from "lucide-react"

import { PageShell } from "@/components/common/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetcher } from "@/lib/api"
import { showTaskStartedToast } from "@/components/task/task-started-toast"
import { useTaskSystem } from "@/components/providers/task-provider"

type OverviewStats = {
    today_submitted: {
        ra: number
        sa: number
        total: number
    }
    rate_limit: {
        limit: number
        remaining: number
        reset_seconds: number
        updated_at: string
    }
    last_fetch_time?: string
}

export default function DashboardOverviewPage() {
    const router = useRouter()
    const { runTask } = useTaskSystem()
    const { data: stats, isLoading, mutate } = useSWR<OverviewStats>("/quants/wqb/overview-stats", fetcher)
    const [isRefreshing, setIsRefreshing] = React.useState(false)

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true)
            const taskId = await runTask("fetch_wqb_alpha_task", {
                args: [],
                kwargs: {}
            })
            
            if (taskId !== undefined) {
                showTaskStartedToast(taskId, () => router.push(`/dashboard/sys-task/${taskId}`))
            }

            // Refresh counts after a short delay
            setTimeout(() => mutate(), 2000)
        } catch (error) {
            console.error(error)
        } finally {
            setIsRefreshing(false)
        }
    }

    const formatLocalTime = (isoString?: string) => {
        if (!isoString) return "N/A"
        try {
            return new Date(isoString).toLocaleString("zh-CN", {
                timeZone: "Asia/Shanghai",
                hour12: false,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            })
        } catch (e) {
            return isoString
        }
    }

    return (
        <PageShell>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                    <div className="text-muted-foreground flex items-center gap-2 mt-1">
                        <span>Welcome back to your quantitative workspace.</span>
                        {stats?.last_fetch_time && (
                            <span className="text-xs border-l pl-2 border-border/60 text-muted-foreground/60 flex items-center gap-1">
                                <RefreshCcw className="h-3 w-3" />
                                Last sync: {formatLocalTime(stats.last_fetch_time)}
                            </span>
                        )}
                    </div>
                </div>
                <Button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    Refresh WQB Data
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            WQB Quota
                        </CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "..." : `${stats?.rate_limit?.remaining ?? 0} / ${stats?.rate_limit?.limit ?? 0}`}
                        </div>
                        <div className="flex flex-col gap-1 mt-1">
                            <p className="text-xs text-muted-foreground">
                                Remaining backtests for today
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 italic">
                                Last updated: {formatLocalTime(stats?.rate_limit?.updated_at)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            RA Submitted
                        </CardTitle>
                        <Rocket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "..." : (stats?.today_submitted?.ra ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Regular Alphas today
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            SA Submitted
                        </CardTitle>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "..." : (stats?.today_submitted?.sa ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Super Alphas today
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Today
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? "..." : (stats?.today_submitted?.total ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Combined alpha submissions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional charts could go here */}
        </PageShell>
    )
}
