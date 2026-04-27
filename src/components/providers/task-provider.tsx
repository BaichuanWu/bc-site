"use client"

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { getJsonObject } from "@/types/json"

import { type TaskEventRecord, type TaskState } from "@/types/task"
import { mapServerStateToStatus } from "@/lib/task-utils"

type TaskUpdatePayload = {
    id?: number
    state?: number
    message?: string
    progress?: number
    snapshot?: unknown
    errorLog?: string | null
    event?: TaskEventRecord
}

interface TaskContextType {
    sessionId: string
    getTaskState: (taskId: number) => TaskState | undefined
    subscribe: (taskId: number, onUpdate?: (state: TaskState) => void) => () => void
    runTask: (taskName: string, context: Record<string, unknown>) => Promise<number | undefined>
    setInitialState: (taskId: number, state: Partial<TaskState>) => void
}

const TaskContext = createContext<TaskContextType | null>(null)

const getTaskEventMergeKey = (event: TaskEventRecord) => {
    if (event.eventId !== null && event.eventId !== undefined) {
        return `event:${event.eventId}`
    }

    if (event.sequence !== null && event.sequence !== undefined) {
        return [
            event.taskId,
            event.type,
            event.sequence,
            event.timestamp || "na",
        ].join(":")
    }

    return [
        event.taskId,
        event.type,
        event.timestamp || "na",
        event.message || "",
    ].join(":")
}

const mergeTaskEvents = (existingEvents: TaskEventRecord[], incomingEvents: TaskEventRecord[]) => {
    const unique = new Map<string | number, TaskEventRecord>()

    for (const event of [...existingEvents, ...incomingEvents]) {
        const key = getTaskEventMergeKey(event)
        unique.set(key, event)
    }

    return Array.from(unique.values()).sort(
        (a, b) => {
            const timeDelta =
                new Date(a.timestamp || 0).getTime() -
                new Date(b.timestamp || 0).getTime()
            if (timeDelta !== 0) return timeDelta
            return (a.sequence ?? 0) - (b.sequence ?? 0)
        }
    )
}

export const useTaskSystem = () => {
    const context = useContext(TaskContext)
    if (!context) throw new Error("useTaskSystem must be used within TaskProvider")
    return context
}

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
    const [sessionId] = useState(() => {
        const key = "bc-task-session-id";
        if (typeof window === 'undefined') return "server-side";
        
        const existing = sessionStorage.getItem(key);
        if (existing) return existing;
        
        const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
            ? crypto.randomUUID() 
            : Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        
        sessionStorage.setItem(key, newId);
        return newId;
    })
    const [taskStates, setTaskStates] = useState<Record<number, TaskState>>({})
    const taskStatesRef = useRef<Record<number, TaskState>>({})
    
    // Sync ref for access in stable callbacks
    useEffect(() => {
        taskStatesRef.current = taskStates
    }, [taskStates])

    const listenersRef = useRef<Record<number, Set<(state: TaskState) => void>>>({})
    const subscriptionCountRef = useRef<Record<number, number>>({})
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
    const retryCountRef = useRef(0)

    // Batching logic for remote subscriptions
    const pendingUpdatesRef = useRef<Array<{ taskId: number, action: 'subscribe' | 'unsubscribe' }>>([])
    const batchTimerRef = useRef<NodeJS.Timeout | null>(null)

    const updateRemoteSubscription = useCallback(async (taskIds: number[], action: 'subscribe' | 'unsubscribe') => {
        try {
            console.log(`[TaskProvider] ${action} tasks:`, taskIds)
            await apiClient.post('/sys/tasks/subscription', {
                sessionId: sessionId,
                taskIds: taskIds,
                action
            })
        } catch (err) {
            console.error(`Failed to ${action} tasks`, taskIds, err)
        }
    }, [sessionId])

    const flushUpdates = useCallback(async () => {
        if (batchTimerRef.current) clearTimeout(batchTimerRef.current)
        batchTimerRef.current = null

        const updates = [...pendingUpdatesRef.current]
        pendingUpdatesRef.current = []

        if (updates.length === 0) return

        // Consolidate updates: Only keep the last action for each taskId
        const consolidatedMap = new Map<number, 'subscribe' | 'unsubscribe'>()
        updates.forEach(u => consolidatedMap.set(u.taskId, u.action))

        const toSubscribe: number[] = []
        const toUnsubscribe: number[] = []

        consolidatedMap.forEach((action, taskId) => {
            if (action === 'subscribe') toSubscribe.push(taskId)
            else toUnsubscribe.push(taskId)
        })

        if (toSubscribe.length > 0) {
            await updateRemoteSubscription(toSubscribe, 'subscribe')
        }
        if (toUnsubscribe.length > 0) {
            await updateRemoteSubscription(toUnsubscribe, 'unsubscribe')
        }
    }, [updateRemoteSubscription])

    const queueUpdate = useCallback((taskId: number, action: 'subscribe' | 'unsubscribe') => {
        pendingUpdatesRef.current.push({ taskId, action })
        if (!batchTimerRef.current) {
            batchTimerRef.current = setTimeout(flushUpdates, 50)
        }
    }, [flushUpdates])

    // SSE Connection Logic
    const connect = useCallback(function connectSse() {
        if (eventSourceRef.current) eventSourceRef.current.close()
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)

        const url = `/api/v1/sys/tasks/stream/session/${sessionId}`
        console.log(`[TaskProvider] Establishing SSE Connection: ${url}`)
        const es = new EventSource(url)
        eventSourceRef.current = es

        es.onopen = () => {
            console.log("[TaskProvider] SSE Connection Established")
            retryCountRef.current = 0
            
            // If there's an active connection, we should probably re-subscribe all active tasks
            // to handle cases where the backend might have lost the session state.
            const activeTasks = Object.keys(subscriptionCountRef.current)
                .map(Number)
                .filter(tid => (subscriptionCountRef.current[tid] || 0) > 0)
            
            if (activeTasks.length > 0) {
                console.log("[TaskProvider] Re-subscribing active tasks after reconnect:", activeTasks)
                updateRemoteSubscription(activeTasks, 'subscribe')
            }
        }

        es.onmessage = (event) => {
            // Heartbeat or general messages
            if (event.data === ': heartbeat') return
        }

        es.addEventListener('task_update', (event: MessageEvent<string>) => {
            try {
                const data = JSON.parse(event.data) as TaskUpdatePayload
                const tid = data.id
                if (!tid) return

                setTaskStates(prev => {
                    const existing = prev[tid] || {
                        id: tid,
                        status: 'idle',
                        progress: null,
                        snapshot: null,
                        events: [],
                        error: null,
                        lastUpdated: 0
                    }

                    let newState: TaskState = { ...existing }

                    if (data.event) {
                        const eventData = data.event
                        if (!eventData) return prev
                        newState.events = mergeTaskEvents(existing.events as TaskEventRecord[], [
                            eventData,
                        ])
                        if (typeof eventData.progress === 'number') {
                            newState.progress = {
                                message: eventData.message || existing.progress?.message,
                                percent: eventData.progress,
                            }
                        } else if (eventData.message) {
                            newState.progress = {
                                ...(existing.progress || {}),
                                message: eventData.message,
                            }
                        }
                        if (eventData.snapshot !== undefined) {
                            newState.snapshot = eventData.snapshot
                        }
                        if (eventData.type === 'task.result') {
                            newState = {
                                ...newState,
                                status: 'completed',
                                progress: {
                                    message: eventData.message || existing.progress?.message,
                                    percent: 100,
                                },
                                snapshot: eventData.snapshot ?? newState.snapshot,
                                lastUpdated: Date.now(),
                            }
                            if (existing.status !== 'completed') {
                                toast.success(`Task ${tid} completed`)
                            }
                        } else if (eventData.type === 'task.failed' || eventData.type === 'task.stopped') {
                            const errorMessage = eventData.message || existing.error || "Task failed"
                            newState = {
                                ...newState,
                                status: 'failed',
                                error: errorMessage,
                                lastUpdated: Date.now(),
                            }
                            if (existing.status !== 'failed') {
                                toast.error(`Task ${tid} failed`, { description: errorMessage })
                            }
                        } else {
                            newState = {
                                ...newState,
                                status: existing.status === 'pending' ? 'pending' : 'running',
                                lastUpdated: Date.now(),
                            }
                        }
                    } else {
                        newState = {
                            ...newState,
                            status: mapServerStateToStatus(data.state ?? 0),
                            progress: {
                                message: data.message,
                                percent: data.progress,
                            },
                            snapshot: data.snapshot || newState.snapshot,
                            error: data.errorLog || newState.error,
                            lastUpdated: Date.now()
                        }
                    }

                    // Notify listeners
                    listenersRef.current[tid]?.forEach(cb => cb(newState))

                    // Optional: Global status toast
                    if (!data.event) {
                        if (newState.status === 'completed' && existing.status !== 'completed') {
                            toast.success(`Task ${tid} completed`)
                        } else if (newState.status === 'failed' && existing.status !== 'failed') {
                            toast.error(`Task ${tid} failed`, { description: newState.error || undefined })
                        }
                    }

                    return { ...prev, [tid]: newState }
                })

            } catch (err) {
                console.error("[TaskProvider] SSE Parse Error", err)
            }
        })

        es.onerror = (e) => {
            console.error("[TaskProvider] SSE Connection Error", e)
            es.close()
            
            // Reconnect with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000)
            retryCountRef.current++
            
            console.log(`[TaskProvider] Reconnecting in ${delay}ms... (Attempt ${retryCountRef.current})`)
            reconnectTimerRef.current = setTimeout(() => {
                void connectSse()
            }, delay)
        }

        return () => {
            es.close()
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
        }
    }, [sessionId, updateRemoteSubscription])

    useEffect(() => {
        const cleanup = connect()
        return cleanup
    }, [connect])

    const setInitialState = useCallback((taskId: number, state: Partial<TaskState>) => {
        setTaskStates(prev => {
            const current = prev[taskId] || {
                id: taskId,
                status: 'idle',
                progress: null,
                snapshot: null,
                events: [],
                error: null,
                lastUpdated: Date.now(),
            }
            return {
                ...prev,
                [taskId]: {
                    ...current,
                    ...state,
                    events: state.events
                        ? mergeTaskEvents(current.events as TaskEventRecord[], state.events as TaskEventRecord[])
                        : current.events,
                }
            }
        })
    }, [])

    const subscribe = useCallback((taskId: number, onUpdate?: (state: TaskState) => void) => {
        const count = (subscriptionCountRef.current[taskId] || 0) + 1
        subscriptionCountRef.current[taskId] = count

        if (count === 1) {
            queueUpdate(taskId, 'subscribe')
        }

        if (onUpdate) {
            if (!listenersRef.current[taskId]) listenersRef.current[taskId] = new Set()
            listenersRef.current[taskId].add(onUpdate)
            
            // Immediately notify with current state if exists
            const current = taskStatesRef.current[taskId]
            if (current) onUpdate(current)
        }
        
        return () => {
            const newCount = (subscriptionCountRef.current[taskId] || 1) - 1
            subscriptionCountRef.current[taskId] = newCount
            
            if (onUpdate) {
                listenersRef.current[taskId]?.delete(onUpdate)
            }

            if (newCount === 0) {
                queueUpdate(taskId, 'unsubscribe')
            }
        }
    }, [queueUpdate])

    const getTaskState = useCallback((taskId: number) => taskStates[taskId], [taskStates])

    const runTask = async (taskName: string, context: Record<string, unknown>) => {
        const res = await apiClient.post(`/sys/tasks/run/${taskName}`, context)
        const data = getJsonObject(res)
        const taskId = data?.taskId
        return typeof taskId === "number" ? taskId : undefined
    }

    return (
        <TaskContext.Provider value={{ sessionId, getTaskState, subscribe, runTask, setInitialState }}>
            {children}
        </TaskContext.Provider>
    )
}
