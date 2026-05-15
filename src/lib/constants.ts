/**
 * Standardized Task Event Types (aligned with SystemTaskEventModel)
 */
export const TASK_EVENT_TYPE = {
    CHECKPOINT: 1,
    PROGRESS: 2,
    RESULT: 3,
    ERROR: 4,
} as const;

/**
 * Standardized Task States (aligned with SystemTaskModel)
 */
export const TASK_STATE = {
    INITIAL: 0,
    PENDING: 2,
    RUNNING: 10,
    ERROR: 15,
    SUCCESS: 20,
    FAILED: 30,
} as const;

export const CONVERSATION_SOURCE = {
    NONE: 0,
    AGENT: 10,
} as const;
