export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'idle'

export interface TaskProgress {
    step?: string | number
    message?: string
    percent?: number
    [key: string]: unknown
}

export type TaskEventData = {
    key?: string | null
    agentId?: number | null
    agentVersionId?: number | null
    conversationId?: number | null
    kind?: string | null
    status?: string | null
    input?: unknown
    output?: unknown
    error?: string | null
    startTime?: string | null
    endTime?: string | null
    durationMs?: number | null
    [key: string]: unknown
}

export type TaskEventType =
    | 'task.started'
    | 'task.updated'
    | 'task.checkpoint'
    | 'task.result'
    | 'task.failed'
    | 'task.stopped'

export interface TaskEventRecord {
    taskId: number
    eventId?: number | null
    sessionId?: string | null
    type: TaskEventType
    timestamp: string
    message?: string | null
    progress?: number | null
    snapshot?: unknown
    data?: Record<string, unknown> | null
}

export interface TaskState {
    id: number
    status: TaskStatus
    progress: TaskProgress | null
    snapshot: unknown
    events: TaskEventRecord[]
    error: string | null
    lastUpdated: number
}
