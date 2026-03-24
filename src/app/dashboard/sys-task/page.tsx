'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useTask } from '@/hooks/use-task'
import { useStream } from '@/hooks/use-stream'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { PlayIcon, RotateCcwIcon, Loader2Icon, ActivityIcon, ServerIcon } from 'lucide-react'

interface TaskProgress {
    step?: number
    message?: string
    [key: string]: any
}

interface TaskUpdate {
    task_id: number
    progress?: TaskProgress
    status?: 'completed' | 'failed'
    error?: string
    timestamp?: string
}

interface TaskItemProps {
    task: any
    update?: TaskUpdate
}

const TaskItem: React.FC<TaskItemProps> = ({ task, update }) => {
    const id = task.id
    const name = task.name
    const status = update?.status || (task.state === 10 ? 'running' : task.state === 20 ? 'completed' : task.state === 30 ? 'failed' : 'pending')
    const progress = update?.progress

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'running': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20'
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
        }
    }

    return (
        <Card className="mb-4 overflow-hidden border-l-4 transition-all hover:shadow-md" style={{ borderLeftColor: status === 'running' ? 'rgb(59 130 246)' : 'transparent' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-md font-semibold flex items-center gap-2">
                        {name}
                        {status === 'running' && <ActivityIcon className="h-3 w-3 text-blue-500 animate-pulse" />}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono">ID: {id}</CardDescription>
                </div>
                <Badge variant="outline" className={getStatusColor(status)}>
                    {status === 'running' && <Loader2Icon className="mr-1.5 h-3 w-3 animate-spin" />}
                    {status}
                </Badge>
            </CardHeader>
            <CardContent>
                {(progress || status === 'running') && (
                    <div className="space-y-3 mt-1">
                        <div className="flex justify-between text-xs font-medium text-muted-foreground">
                            <span className="truncate mr-4">{progress?.message || 'In progress...'}</span>
                            <span>{progress?.step ? `${progress.step * 10}%` : '0%'}</span>
                        </div>
                        <div className="w-full bg-secondary/50 h-1.5 rounded-full overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-700 ease-in-out"
                                style={{ width: `${(progress?.step || 0) * 10}%` }}
                            />
                        </div>
                    </div>
                )}
                {update?.error && <p className="text-xs text-destructive mt-2 bg-destructive/10 p-2 rounded">{update.error}</p>}
                {status === 'completed' && !progress && <p className="text-xs text-muted-foreground mt-2 italic">Finished at {update?.timestamp ? new Date(update.timestamp).toLocaleTimeString() : 'Recently'}</p>}
            </CardContent>
        </Card>
    )
}

export default function SystemTaskPage() {
    const [initialTasks, setInitialTasks] = useState<any[]>([])
    const [streamUpdates, setStreamUpdates] = useState<Record<number, TaskUpdate>>({})
    const { run, status: startStatus } = useTask()

    // Build URL for the stream (only monitor running ones)
    const streamUrl = useMemo(() => {
        const params = new URLSearchParams({ state: '10', min_interval: '1.0' })
        return `/api/v1/sys/task/stream?${params.toString()}`
    }, [])

    const { status: streamStatus, listen } = useStream(streamUrl)

    const handleTaskUpdate = useCallback((data: TaskUpdate) => {
        setStreamUpdates(prev => ({
            ...prev,
            [data.task_id]: { ...prev[data.task_id], ...data }
        }))
    }, [])

    useEffect(() => {
        const unlisten = listen('task_update', handleTaskUpdate)
        return () => unlisten()
    }, [listen, handleTaskUpdate])

    const fetchTasks = async () => {
        try {
            const data: any = await apiClient.get('/sys/active')
            setInitialTasks(data)
        } catch (err) {
            console.error('Failed to fetch tasks:', err)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [])

    const handleRunTask = async () => {
        const id = await run('example_task', { demo: true })
        if (id) {
            setInitialTasks(prev => [{ id, name: 'example_task', state: 10 }, ...prev])
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">System Monitor</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className={`h-2 w-2 rounded-full ${streamStatus === 'open' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                        <span className="flex items-center gap-1">
                            <ServerIcon className="h-3 w-3" />
                            Redis Stream {streamStatus === 'open' ? 'Active' : 'Connecting...'}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={fetchTasks} className="h-9">
                        <RotateCcwIcon className="mr-2 h-4 w-4" />
                        Sync DB
                    </Button>
                    <Button size="sm" onClick={handleRunTask} disabled={startStatus === 'pending'} className="h-9 shadow-sm">
                        {startStatus === 'pending' ? (
                            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <PlayIcon className="mr-2 h-4 w-4" />
                        )}
                        Trigger Task
                    </Button>
                </div>
            </div>

            <div className="grid gap-1">
                {initialTasks.length === 0 && Object.keys(streamUpdates).length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/30">
                        <ActivityIcon className="mx-auto h-10 w-10 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground">System Idle</h3>
                        <p className="text-sm text-muted-foreground/70">No active background tasks detected.</p>
                    </div>
                ) : (
                    initialTasks.map(task => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            update={streamUpdates[task.id]}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
