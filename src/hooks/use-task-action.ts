import { useCallback } from "react"
import { showTaskStartedToast } from "@/components/task/task-started-toast"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { useAsyncAction } from "@/hooks/use-async-action"
import { getJsonObject } from "@/types/json"
import { toast } from "sonner"

export function useTaskAction() {
    const navigate = useWorkspaceNavigate()
    const { run, isLoading } = useAsyncAction()

    const runTask = useCallback(async <T = any>(
        action: () => Promise<T>,
        options?: { 
            fallbackSuccessMessage?: string
            errorMessage?: string
            onSuccess?: (res: T) => void | Promise<void>
        }
    ) => {
        return run(action, {
            errorMessage: options?.errorMessage || "Task execution failed",
            onSuccess: async (res) => {
                const data = getJsonObject(res)
                const taskId = typeof data?.task_id === "number" ? data.task_id : typeof data?.task_id === "string" ? parseInt(data.task_id) : undefined
                
                if (taskId) {
                    showTaskStartedToast(taskId, () => navigate(`/sys-task/${taskId}`))
                } else if (options?.fallbackSuccessMessage) {
                    toast.success(options.fallbackSuccessMessage)
                }
                
                if (options?.onSuccess) {
                    await options.onSuccess(res)
                }
            }
        })
    }, [run, navigate])

    return { runTask, isLoading }
}
