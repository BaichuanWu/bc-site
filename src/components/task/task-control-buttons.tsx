"use client"

import { Loader2Icon, RotateCcwIcon, StopCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAsyncAction } from "@/hooks/use-async-action"
import { apiClient } from "@/lib/api"
import { TASK_STATE } from "@/lib/constants"
import { cn } from "@/lib/utils"

type TaskControlButtonsProps = {
    taskId: number | string
    state: number
    onRefresh?: () => void | Promise<void>
    className?: string
}

export function TaskControlButtons({
    taskId,
    state,
    onRefresh,
    className,
}: TaskControlButtonsProps) {
    const recoverAction = useAsyncAction()
    const stopAction = useAsyncAction()

    const canStop = state === TASK_STATE.RUNNING
    const recoverableStates: number[] = [
        TASK_STATE.RUNNING,
        TASK_STATE.ERROR,
        TASK_STATE.FAILED,
    ]
    const canRecover = recoverableStates.includes(state)

    if (!canStop && !canRecover) return null

    const handleStop = async () => {
        await stopAction.run(
            async () => apiClient.post(`/sys/tasks/stop/${taskId}`),
            {
                successMessage: "Task stop signal sent",
                errorMessage: "Failed to stop task",
                onSuccess: async () => {
                    await onRefresh?.()
                },
            },
        )
    }

    const handleRecover = async () => {
        await recoverAction.run(
            async () => apiClient.post(`/sys/tasks/recover/${taskId}`),
            {
                successMessage: "Task resumed from last checkpoint",
                errorMessage: "Failed to resume task",
                onSuccess: async () => {
                    await onRefresh?.()
                },
            },
        )
    }

    return (
        <div className={cn("flex shrink-0 items-center gap-2", className)}>
            {canStop ? (
                <Button
                    variant="destructive"
                    onClick={handleStop}
                    disabled={stopAction.isLoading || recoverAction.isLoading}
                    className="gap-2 rounded-full"
                >
                    {stopAction.isLoading ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                        <StopCircleIcon className="h-4 w-4" />
                    )}
                    {stopAction.isLoading ? "Stopping..." : "Stop Task"}
                </Button>
            ) : null}
            {canRecover ? (
                <Button
                    onClick={handleRecover}
                    disabled={recoverAction.isLoading || stopAction.isLoading}
                    className="gap-2 rounded-full"
                >
                    {recoverAction.isLoading ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                        <RotateCcwIcon className="h-4 w-4" />
                    )}
                    Resume From Checkpoint
                </Button>
            ) : null}
        </div>
    )
}
