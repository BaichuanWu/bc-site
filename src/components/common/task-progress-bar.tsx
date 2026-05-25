"use client"

import React from "react"
import { useTask, type TaskInitialData } from "@/hooks/use-task"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { getProgressPercentFromMessage } from "@/lib/task-progress"

interface TaskProgressBarProps {
    taskId: number
    initialData?: TaskInitialData
    className?: string
    showStatus?: boolean
    showProgressValue?: boolean
}

export const TaskProgressBar = ({
    taskId,
    initialData,
    className,
    showStatus = true,
    showProgressValue = true
}: TaskProgressBarProps) => {
    const { progress, status, error } = useTask(taskId, initialData)

    const message = progress?.message || (status === 'pending' ? 'Waiting...' : '')
    const percentFromMessage = getProgressPercentFromMessage(message)
    const percent = status === 'completed' ? 100 : (percentFromMessage ?? progress?.percent ?? 0)

    return (
        <div className={cn("space-y-2 w-full", className)}>
            <div className="flex items-center justify-between text-xs transition-all animate-in fade-in">
                <div className="flex items-center gap-2 text-muted-foreground font-medium truncate">
                    {showStatus && status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                    {showStatus && status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                    {showStatus && status === 'failed' && <AlertCircle className="h-3 w-3 text-destructive" />}
                    <span className="truncate">{message}</span>
                </div>
                {showProgressValue && (
                    <span className={cn(
                        "font-mono tabular-nums",
                        status === 'completed' ? "text-green-500" : "text-primary"
                    )}>
                        {percent}%
                    </span>
                )}
            </div>
            
            <Progress 
                value={percent} 
                className={cn(
                    "h-1.5 transition-all duration-500",
                    status === 'completed' && "bg-green-100 dark:bg-green-950/30",
                    status === 'failed' && "bg-red-100 dark:bg-red-950/30"
                )}
                // We'll need to pass variant-like styles via className since our Progress is basic
            />

            {error && (
                <p className="text-[10px] text-destructive mt-1 animate-in slide-in-from-top-1">
                    Error: {error}
                </p>
            )}
        </div>
    )
}
