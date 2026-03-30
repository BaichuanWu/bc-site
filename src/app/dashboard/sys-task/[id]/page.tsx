'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
    ActivityIcon, 
    ArrowLeftIcon, 
    BotIcon,
    CheckCircle2Icon, 
    ChevronDownIcon,
    ChevronRightIcon, 
    CircleIcon, 
    ClockIcon, 
    CodeIcon,
    DatabaseIcon, 
    InfoIcon, 
    Loader2Icon, 
    MessageSquareIcon,
    PlayIcon, 
    SquareIcon, 
    TerminalIcon,
    UserIcon,
    XCircleIcon
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TASK_EVENT_TYPE, TASK_STATE } from "@/lib/constants"
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { 
    Sheet, 
    SheetContent, 
    SheetDescription, 
    SheetHeader, 
    SheetTitle, 
    SheetTrigger 
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { apiClient } from '@/lib/api'

import { JsonNode } from '@/components/common/json-node'
import { DialogueTranscript } from '@/components/task/dialogue-transcript'
import { useTask } from '@/hooks/use-task'
import { TaskProgressBar } from '@/components/common/task-progress-bar'
import { type TaskStatus } from '@/types/task'
import { 
    mapStatusToServerState, 
    mapStatusToName, 
    mapServerStateToStatus, 
    getStatusColor 
} from '@/lib/task-utils'

// --- Main Page ---

export default function TaskDetailPage() {
    const params = useParams()
    const router = useRouter()
    const task_id = params.id as string
    
    const [loading, setLoading] = useState(true)
    const { 
        status, 
        progress, 
        events, 
        snapshot, 
        setInitialState 
    } = useTask(parseInt(task_id))

    const [task, setTask] = useState<any>(null)

    const getEventTitle = useCallback((event: any) => {
        if (event.typ === TASK_EVENT_TYPE.RESULT) return 'Final Result'
        return event.payload?.step || event.payload?.node || 'Unknown Step'
    }, [])

    const getEventStatus = useCallback((event: any) => {
        if (event.typ === TASK_EVENT_TYPE.RESULT) return TASK_STATE.SUCCESS
        return event.payload?.status || 0
    }, [])

    const getEventSummary = useCallback((event: any) => {
        if (event.message) return event.message
        if (event.typ === TASK_EVENT_TYPE.RESULT) return 'Final workflow output'
        return `Audit trail for ${event.payload?.step || 'step'}`
    }, [])

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
            snapshot: snapshot ?? task.snapshot
        }
    }, [task, status, progress, snapshot])

    const displayEvents = events

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const [taskRes, eventsRes] = await Promise.all([
                    apiClient.get(`/sys/task/${task_id}`),
                    apiClient.get(`/sys/task/${task_id}/events`)
                ])
                const t = taskRes as any
                const evs = eventsRes as any
                setTask(t)
                
                // Seed the global provider so other components (like breadcrumbs) know the state
                setInitialState(parseInt(task_id), {
                    status: mapServerStateToStatus(t.state),
                    progress: { percent: t.progress, message: t.message },
                    snapshot: t.snapshot,
                    events: evs
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
        return <div className="p-20 text-center">Task Not Found</div>
    }

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
            <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6 pb-24 animate-in fade-in duration-500">
                    {/* Header */}
                    <div className="flex items-center gap-4 border-b pb-6">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-muted transition-colors">
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
                                            displayEvents.map((event: any, idx: number) => (
                                                <div key={event.id} className="relative group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 40}ms` }}>
                                                    {(() => {
                                                        const eventStatus = getEventStatus(event)
                                                        const eventTitle = getEventTitle(event)
                                                        const isResultEvent = event.typ === TASK_EVENT_TYPE.RESULT
                                                        const resultData = event.payload?.result
                                                        return (
                                                            <>
                                                    {/* dot */}
                                                    <div className={cn(
                                                        "absolute -left-[31px] top-6 h-2 w-2 rounded-full ring-4 ring-background z-10 transition-all group-hover:scale-125",
                                                        eventStatus === TASK_STATE.SUCCESS ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" :
                                                        eventStatus === TASK_STATE.RUNNING ? "bg-blue-500 animate-pulse" :
                                                        eventStatus === TASK_STATE.ERROR ? "bg-red-500" : "bg-muted"
                                                    )} />

                                                    <Sheet>
                                                        <SheetTrigger asChild>
                                                            <div className="p-4 rounded-2xl bg-card/50 hover:bg-card border border-transparent hover:border-border hover:shadow-2xl hover:shadow-primary/5 cursor-pointer transition-all">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-sm font-black tracking-tight uppercase">
                                                                            {eventTitle}
                                                                        </span>
                                                                        <Badge variant="outline" className={cn(
                                                                            "text-[8px] h-3.5 font-black uppercase tracking-widest",
                                                                            eventStatus === TASK_STATE.SUCCESS ? "text-green-500 border-green-500/30 bg-green-500/5" :
                                                                            eventStatus === TASK_STATE.RUNNING ? "text-blue-500 border-blue-500/30 bg-blue-500/5" :
                                                                            "text-muted-foreground border-muted/30"
                                                                        )}>
                                                                            {mapStatusToName(mapServerStateToStatus(eventStatus))}
                                                                        </Badge>
                                                                    </div>
                                                                    <span className="text-[9px] font-mono opacity-40">
                                                                        {event.createTime ? new Date(event.createTime).toLocaleTimeString() : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[11px] text-muted-foreground line-clamp-1 opacity-70">
                                                                        {getEventSummary(event)}
                                                                    </p>
                                                                    <ChevronRightIcon className="h-3.5 w-3.5 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                                                </div>
                                                            </div>
                                                        </SheetTrigger>
                                                        <SheetContent side="right" className="sm:max-w-[80vw] w-full flex flex-col p-0 overflow-hidden border-l border-border shadow-2xl bg-background/95 backdrop-blur-xl">
                                                            <SheetHeader className="p-8 border-b border-border bg-muted/5">
                                                                <div className="flex items-center gap-6">
                                                                    <div className={cn(
                                                                        "h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-2xl",
                                                                        eventStatus === TASK_STATE.SUCCESS ? "bg-green-600" : "bg-blue-600"
                                                                    )}>
                                                                        <ActivityIcon className="h-8 w-8" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <SheetTitle className="text-3xl font-black italic uppercase tracking-tighter">
                                                                            {eventTitle}
                                                                        </SheetTitle>
                                                                        <SheetDescription className="text-xs font-mono opacity-50 flex items-center gap-2 uppercase tracking-widest">
                                                                            <span className={cn("h-1.5 w-1.5 rounded-full", eventStatus === TASK_STATE.SUCCESS ? "bg-green-500" : "bg-blue-500")} />
                                                                            {mapStatusToName(mapServerStateToStatus(eventStatus))} • {event.createTime ? new Date(event.createTime).toLocaleString() : 'N/A'}
                                                                        </SheetDescription>
                                                                    </div>
                                                                </div>
                                                            </SheetHeader>
                                                            
                                                            <ScrollArea className="flex-1 min-h-0">
                                                                <div className="p-8 max-w-full mx-auto">
                                                                    {!isResultEvent && (
                                                                        <DialogueTranscript messages={event.payload?.messages || []} />
                                                                    )}

                                                                    {isResultEvent && resultData && (
                                                                        <div className="space-y-6">
                                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30 text-center">Final Output</h4>
                                                                            <div className="bg-muted/10 p-6 rounded-3xl border border-border shadow-2xl">
                                                                                <JsonNode data={resultData} depth={0} />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {/* Only show raw data if it's NOT an agent node (no messages) or if user explicitly needs it */}
                                                                    {event.payload?.data && typeof event.payload.data === 'object' && Object.keys(event.payload.data).length > 0 && (!event.payload?.messages || event.payload?.messages.length === 0) && (
                                                                        <div className="mt-16 pt-16 border-t border-white/5 space-y-6">
                                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30 text-center">Process Artifacts</h4>
                                                                            <div className="bg-muted/10 p-6 rounded-3xl border border-border shadow-2xl">
                                                                                <JsonNode data={event.payload.data} depth={0} />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </ScrollArea>
                                                        </SheetContent>
                                                    </Sheet>
                                                            </>
                                                        )
                                                    })()}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
