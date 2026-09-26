import { useCallback, useEffect, useRef } from "react"
import { showTaskStartedToast } from "@/components/task/task-started-toast"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { useAsyncAction } from "@/hooks/use-async-action"
import { apiClient } from "@/lib/api"
import { getJsonObject } from "@/types/json"
import { toast } from "sonner"
import { useTaskSystem } from "@/components/providers/task-provider"
import { type TaskState } from "@/types/task"

type TaskActionOptions<T> = {
    fallbackSuccessMessage?: string
    errorMessage?: string
    onTaskStarted?: (taskId: number) => void | Promise<void>
    onTaskCompleted?: (taskState: TaskState, taskId: number) => void | Promise<void>
    onTaskFailed?: (taskState: TaskState, taskId: number) => void | Promise<void>
    onTaskSettled?: (taskState: TaskState, taskId: number) => void | Promise<void>
    onSuccess?: (res: T) => void | Promise<void>
}

type TaskRunPayload = {
    args?: unknown[]
    kwargs?: Record<string, unknown>
    displayName?: string
}

export function useTaskAction() {
    const navigate = useWorkspaceNavigate()
    const { run, isLoading } = useAsyncAction()
    const { subscribe } = useTaskSystem()
    const taskUnsubscribersRef = useRef(new Set<() => void>())

    useEffect(() => {
        const unsubscribers = taskUnsubscribersRef.current
        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe())
            unsubscribers.clear()
        }
    }, [])

    const subscribeToTaskCompletion = useCallback((
        taskId: number,
        options?: TaskActionOptions<unknown>,
    ) => {
        if (!options || (!options.onTaskCompleted && !options.onTaskFailed && !options.onTaskSettled)) {
            return
        }

        const unsubscribe = subscribe(taskId, (taskState) => {
            if (taskState.status !== "completed" && taskState.status !== "failed") {
                return
            }

            unsubscribe()
            taskUnsubscribersRef.current.delete(unsubscribe)

            void (async () => {
                if (taskState.status === "completed") {
                    await options.onTaskCompleted?.(taskState, taskId)
                } else {
                    await options.onTaskFailed?.(taskState, taskId)
                }
                await options.onTaskSettled?.(taskState, taskId)
            })()
        })

        taskUnsubscribersRef.current.add(unsubscribe)
    }, [subscribe])

    const runTask = useCallback(async <T = unknown>(
        action: () => Promise<T>,
        options?: TaskActionOptions<T>
    ) => {
        return run(action, {
            errorMessage: options?.errorMessage || "Task execution failed",
            onSuccess: async (res) => {
                const data = getJsonObject(res)
                const taskId = typeof data?.taskId === "number" ? data.taskId : typeof data?.taskId === "string" ? parseInt(data.taskId) : undefined
                
                if (taskId) {
                    showTaskStartedToast(taskId, () => navigate(`/sys-task/${taskId}`))
                    subscribeToTaskCompletion(taskId, options as TaskActionOptions<unknown>)
                    if (options?.onTaskStarted) {
                        await options.onTaskStarted(taskId)
                    }
                } else if (options?.fallbackSuccessMessage) {
                    toast.success(options.fallbackSuccessMessage)
                }
                
                if (options?.onSuccess) {
                    await options.onSuccess(res)
                }
            }
        })
    }, [run, navigate, subscribeToTaskCompletion])

    const runNamedTask = useCallback((
        taskName: string,
        payload: TaskRunPayload = {},
        options?: TaskActionOptions<unknown>,
    ) => {
        return runTask(
            () => apiClient.post(`/sys/tasks/run/${taskName}`, payload),
            options,
        )
    }, [runTask])

    return { runTask, runNamedTask, isLoading }
}
