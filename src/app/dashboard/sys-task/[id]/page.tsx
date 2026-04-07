'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { 
    ActivityIcon, 
    ArrowLeftIcon, 
    AlertTriangleIcon,
    ClockIcon, 
    DatabaseIcon, 
    Loader2Icon
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TASK_STATE } from "@/lib/constants"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import { normalizeCrudListResponse } from '@/lib/crud-response'

import { JsonNode } from '@/components/common/json-node'
import { PageShell } from '@/components/common/page-shell'
import { TaskEventViewer, type TaskEventRecord } from '@/components/task/task-event-viewer'
import { useTask } from '@/hooks/use-task'
import { TaskProgressBar } from '@/components/common/task-progress-bar'
import { type TaskStatus } from '@/types/task'
import { useWorkspaceNavigate } from '@/hooks/use-workspace-navigate'
import { useWorkspaceTabTitle } from '@/hooks/use-workspace-tab-title'
import { 
    mapStatusToServerState, 
    mapStatusToName, 
    mapServerStateToStatus, 
    getStatusColor 
} from '@/lib/task-utils'

type TaskDetailRecord = {
    id: number
    name: string
    state: number
    stateName: string
    progress: number
    message?: string
    createTime?: string
    snapshot?: unknown
    context?: unknown
    errorLog?: string | null
}

// --- Main Page ---

export default function TaskDetailPage() {
    const params = useParams()
    const navigate = useWorkspaceNavigate()
    const task_id = params.id as string
    
    const [loading, setLoading] = useState(true)
    const { 
        status, 
        progress, 
        error,
        events, 
        snapshot, 
        setInitialState 
    } = useTask(parseInt(task_id))

    const [task, setTask] = useState<TaskDetailRecord | null>(null)

    // Sync task state from hook back to local 'task' for UI compatibility
    const displayTask = useMemo(() => {
        if (!task) return null

        // Determine the effective status: if SSE is idle, fall back to initial task state
        const effectiveStatus: TaskStatus = (status === 'idle') ? mapServerStateToStatus(task.state) : status

        return {
            ...task,
            state: mapStatusToServerState(effectiveStatus),
            stateName: mapStatusToName(effectiveStatus),
            progress: effectiveStatus === 'completed' ? 100 : (progress?.percent ?? task.progress),
            snapshot: snapshot ?? task.snapshot,
            errorLog: error ?? task.errorLog ?? null,
        }
    }, [task, status, progress, snapshot, error])

    const displayEvents = events as TaskEventRecord[]

    useWorkspaceTabTitle(
        `/dashboard/sys-task/${task_id}`,
        displayTask?.name ? `Task: ${displayTask.name}` : `Task: ${task_id}`,
    )

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const [taskRes, eventsRes] = await Promise.all([
                    apiClient.get(`/sys/task/${task_id}`),
                    apiClient.get(`/sys/task/${task_id}/events`)
                ])
                const t = taskRes as unknown as TaskDetailRecord
                const evs = normalizeCrudListResponse<TaskEventRecord>(eventsRes)
                setTask(t)
                
                // Seed the global provider so other components (like breadcrumbs) know the state
                setInitialState(parseInt(task_id), {
                    status: mapServerStateToStatus(t.state),
                    progress: { percent: t.progress, message: t.message },
                    snapshot: t.snapshot,
                    events: evs,
                    error: t.errorLog || null,
                })
            } catch (err) {
                console.error("Failed to fetch task:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchTask()
    }, [task_id, setInitialState])

    if (loading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2Icon className="h-10 w-10 animate-spin text-blue-500" />
                    <p className="text-sm font-medium animate-pulse">Syncing with system orchestrator...</p>
                </div>
            </div>
        )
    }

    if (!displayTask) {
        return (
            <PageShell>
                <div className="py-20 text-center">Task Not Found</div>
            </PageShell>
        )
    }

    return (
        <div className="bg-background font-sans">
            <PageShell contentClassName="space-y-6 pb-24 animate-in fade-in duration-500">
                    {/* Header */}
                    <div className="flex items-center gap-4 border-b pb-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/dashboard/sys-task")}
                            className="rounded-full hover:bg-muted transition-colors"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                        </Button>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tight">{displayTask.name}</h1>
                                <Badge variant="outline" className={cn("px-2.5 py-0.5 font-bold uppercase tracking-wider text-[10px]", getStatusColor(displayTask.state))}>
                                    {displayTask.state === TASK_STATE.RUNNING && <Loader2Icon className="mr-1.5 h-3 w-3 animate-spin" />}
                                    {displayTask.stateName}
                                </Badge>
                            </div>
                            <div className="text-[11px] font-mono text-muted-foreground mt-1 opacity-80">
                                UUID: {task_id} • Created: {displayTask.createTime ? new Date(displayTask.createTime).toLocaleString() : 'N/A'}
                            </div>
                        </div>
                    </div>

                    {displayTask.errorLog ? (
                        <Card className="border border-destructive/30 bg-destructive/5 shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-destructive">
                                    <AlertTriangleIcon className="h-4 w-4" />
                                    Failure Reason
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="whitespace-pre-wrap break-words rounded-xl bg-background/70 p-4 text-xs text-destructive">
                                    {displayTask.errorLog}
                                </pre>
                            </CardContent>
                        </Card>
                    ) : null}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Progress & Metadata */}
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm border border-white/5 overflow-hidden">
                                <CardHeader className="pb-3 border-b border-white/5 bg-muted/5">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest opacity-60">System Context</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] uppercase font-bold tracking-tighter opacity-40">Progress</span>
                                            <span className="text-2xl font-black tracking-tighter text-primary">{displayTask.progress}%</span>
                                        </div>
                                        <TaskProgressBar 
                                            taskId={parseInt(task_id)} 
                                            initialData={{ 
                                                progress: { percent: displayTask.progress }, 
                                                status: mapServerStateToStatus(displayTask.state) 
                                            }}
                                            showStatus={false}
                                            showProgressValue={false}
                                        />
                                    </div>
                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 opacity-60">
                                                <DatabaseIcon className="h-3.5 w-3.5" />
                                                <span className="text-[11px] font-medium">Snapshot Size</span>
                                            </div>
                                            <span className="text-[11px] font-mono font-bold">{(JSON.stringify(displayTask.snapshot || {}).length / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 opacity-60">
                                                <ClockIcon className="h-3.5 w-3.5" />
                                                <span className="text-[11px] font-medium">Auto Refresh</span>
                                            </div>
                                            <Badge variant="secondary" className="text-[9px] h-4 font-black bg-green-500/10 text-green-500 border-none uppercase">Live</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-muted/5 overflow-hidden border border-white/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-tighter opacity-40">Input Parameters</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="p-4 border-y border-border bg-muted/10">
                                        <JsonNode data={displayTask.context} depth={0} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right: Timeline */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="flex items-center gap-2">
                                    <ActivityIcon className="h-4 w-4 text-primary" />
                                    <h2 className="text-sm font-black uppercase tracking-widest opacity-80">Execution Roadmap</h2>
                                </div>
                                <span className="text-[10px] font-mono opacity-40">{displayEvents.length} audit points</span>
                            </div>
                                                       <ScrollArea className="h-[calc(100vh-250px)] min-h-[400px] border rounded-3xl bg-muted/5 relative">
                                <div className="p-8 relative">
                                    <div className="absolute left-[39px] top-8 bottom-8 w-px bg-muted/50" />
                                    <div className="space-y-2">
                                        {displayEvents.length === 0 ? (
                                            <div className="py-20 text-center italic text-xs text-muted-foreground">
                                                Waiting for orchestration heartbeat...
                                            </div>
                                        ) : (
                                            displayEvents.map((event: TaskEventRecord, idx: number) => (
                                                <div key={event.id} className="relative group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 40}ms` }}>
                                                    <TaskEventViewer event={event} />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
            </PageShell>
        </div>
    )
}
