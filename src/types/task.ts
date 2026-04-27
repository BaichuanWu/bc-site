export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'idle'

export interface TaskProgress {
    step?: string | number
    message?: string
    percent?: number
    [key: string]: unknown
}

export type WorkflowNodeEventData = {
    key: string
    agent_id?: number | null
    agent_version_id?: number | null
    kind?: string | null
    status?: string | null
    input?: unknown
    output?: unknown
    messages?: Array<Record<string, unknown>>
    error?: string | null
    start_time?: string | null
    end_time?: string | null
    duration_ms?: number | null
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
    sequence?: number | null
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
