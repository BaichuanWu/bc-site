export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'idle'

export interface TaskProgress {
    step?: string | number
    message?: string
    percent?: number
    [key: string]: unknown
}

export interface TaskState {
    id: number
    status: TaskStatus
    progress: TaskProgress | null
    snapshot: unknown
    events: unknown[]
    error: string | null
    lastUpdated: number
}
