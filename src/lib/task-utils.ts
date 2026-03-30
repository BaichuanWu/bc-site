import { TASK_STATE } from "./constants";
import { type TaskStatus } from "@/types/task";

/**
 * Maps frontend TaskStatus string to backend TASK_STATE integer
 */
export function mapStatusToServerState(status: TaskStatus): number {
    switch (status) {
        case 'pending': return TASK_STATE.PENDING;
        case 'running': return TASK_STATE.RUNNING;
        case 'completed': return TASK_STATE.SUCCESS;
        case 'failed': return TASK_STATE.FAILED;
        default: return TASK_STATE.INITIAL;
    }
}

/**
 * Maps frontend TaskStatus to a human-readable name
 */
export function mapStatusToName(status: TaskStatus): string {
    switch (status) {
        case 'pending': return 'Pending';
        case 'running': return 'Running';
        case 'completed': return 'Success';
        case 'failed': return 'Error';
        case 'idle': return 'Idle';
        default: return 'Unknown';
    }
}

/**
 * Maps backend TASK_STATE integer to frontend TaskStatus string
 */
export function mapServerStateToStatus(state: number): TaskStatus {
    switch (state) {
        case 0: return 'idle';
        case 2: return 'pending';
        case 10: return 'running';
        case 15: return 'failed'; // Error state
        case 20: return 'completed';
        case 30: return 'failed';
        default: return 'idle';
    }
}

/**
 * Returns the CSS class logic for task status badges
 */
export function getStatusColor(state: number): string {
    switch(state) {
        case TASK_STATE.RUNNING: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        case TASK_STATE.SUCCESS: return "bg-green-500/10 text-green-500 border-green-500/20";
        case TASK_STATE.FAILED: 
        case TASK_STATE.ERROR: return "bg-red-500/10 text-red-500 border-red-500/20";
        default: return "bg-muted text-muted-foreground";
    }
}
