import { useState, useEffect, useCallback, useRef } from 'react'
import { useTaskSystem } from '@/components/providers/task-provider'
import { type TaskEventRecord, type TaskProgress, type TaskStatus } from '@/types/task'

export interface TaskInitialData {
    progress?: TaskProgress | null
    status?: TaskStatus
    error?: string | null
    snapshot?: unknown
    events?: TaskEventRecord[]
}

export const useTask = (taskId?: number, initialData?: TaskInitialData) => {
    const { subscribe, getTaskState, runTask, setInitialState } = useTaskSystem()
    // Local state for the current ID being tracked
    const [currentTaskId, setCurrentTaskId] = useState<number | undefined>(taskId)
    
    // Seeded ref to prevent redundant initialization
    const seededRef = useRef<string | null>(null)

    // Derived state from the global provider
    const taskState = getTaskState(currentTaskId || -1)

    // Initial seeding
    useEffect(() => {
        if (taskId && initialData) {
            const dataKey = `${taskId}-${JSON.stringify(initialData)}`
            if (seededRef.current !== dataKey) {
                setInitialState(taskId, {
                    status: initialData.status,
                    progress: initialData.progress,
                    error: initialData.error,
                    snapshot: initialData.snapshot,
                    events: initialData.events,
                })
                seededRef.current = dataKey
            }
        }
    }, [taskId, initialData, setInitialState])

    // Subscription management
    useEffect(() => {
        if (!currentTaskId) return
        const unsubscribe = subscribe(currentTaskId)
        return unsubscribe
    }, [currentTaskId, subscribe])

    const run = useCallback(async (taskName: string, context: Record<string, unknown> = {}) => {
        try {
            const id = await runTask(taskName, context)
            if (id) {
                setCurrentTaskId(id)
                return id
            }
        } catch (err: unknown) {
            console.error('Failed to start task', err)
            throw err
        }
    }, [runTask])

    return {
        run,
        progress: taskState?.progress || initialData?.progress || null,
        status: taskState?.status || initialData?.status || 'idle',
        error: taskState?.error || initialData?.error || null,
        events: taskState?.events || [],
        snapshot: taskState?.snapshot || null,
        taskId: currentTaskId,
        setInitialState
    }
}
