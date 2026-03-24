import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'

export interface TaskProgress {
    step?: number
    message?: string
    [key: string]: any
}

export interface TaskUpdate {
    task_id: number
    progress?: TaskProgress
    status?: 'completed' | 'failed'
    error?: string
}

export const useTask = (taskId?: number) => {
    const [progress, setProgress] = useState<TaskProgress | null>(null)
    const [status, setStatus] = useState<'pending' | 'running' | 'completed' | 'failed' | 'idle'>('idle')
    const [error, setError] = useState<string | null>(null)
    const [currentTaskId, setCurrentTaskId] = useState<number | undefined>(taskId)

    const connect = useCallback((id: number) => {
        const streamUrl = `/api/v1/sys/stream/${id}`
        const eventSource = new EventSource(streamUrl)

        setStatus('running')
        setError(null)

        const handleUpdate = (event: MessageEvent) => {
            try {
                const data: TaskUpdate = JSON.parse(event.data)
                if (data.progress) {
                    setProgress(data.progress)
                }
                if (data.status) {
                    setStatus(data.status)
                    if (data.status === 'completed' || data.status === 'failed') {
                        if (data.error) setError(data.error)
                        eventSource.close()
                    }
                }
            } catch (err) {
                console.error('Failed to parse SSE message:', err)
            }
        }

        eventSource.addEventListener('task_update', handleUpdate as any)
        eventSource.onmessage = handleUpdate

        eventSource.onerror = (err) => {
            console.error('SSE connection error:', err)
            setError('Connection lost')
            setStatus('failed')
            eventSource.close()
        }

        return () => {
            eventSource.close()
        }
    }, [])

    useEffect(() => {
        if (currentTaskId) {
            const cleanup = connect(currentTaskId)
            return cleanup
        }
    }, [currentTaskId, connect])

    const run = async (taskName: string, context: any = {}) => {
        try {
            setStatus('pending')
            const response: any = await apiClient.post(`/sys/run/${taskName}`, context)
            if (response.task_id) {
                setCurrentTaskId(response.task_id)
                return response.task_id
            }
        } catch (err: any) {
            setError(err.message || 'Failed to start task')
            setStatus('failed')
        }
    }

    return {
        run,
        progress,
        status,
        error,
        taskId: currentTaskId
    }
}
