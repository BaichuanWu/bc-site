export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'idle'

export interface TaskProgress {
    step?: string | number
    message?: string
    percent?: number
    [key: string]: unknown
}

export type WorkflowNodeEventData = {
    key: string
    // api-casing-ignore-next-line: Task workflow event payload mirrors workflow DSL node fields.
    agent_id?: number | null
    // api-casing-ignore-next-line: Task workflow event payload mirrors workflow runtime fields.
    agent_version_id?: number | null
    // api-casing-ignore-next-line: Task workflow event payload mirrors backend runtime fields.
    conversation_id?: number | null
    conversationId?: number | null
    kind?: string | null
    status?: string | null
    input?: unknown
    output?: unknown
    error?: string | null
    // api-casing-ignore-next-line: Task event payload comes from backend runtime timestamps.
    start_time?: string | null
    // api-casing-ignore-next-line: Task event payload comes from backend runtime timestamps.
    end_time?: string | null
    // api-casing-ignore-next-line: Task event payload comes from backend runtime metrics.
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
