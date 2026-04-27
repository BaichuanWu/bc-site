"use client"

import * as React from "react"
import { useTaskSystem } from "@/components/providers/task-provider"

export function useTaskCompletionRefresh() {
    const { subscribe } = useTaskSystem()
    const taskUnsubscribersRef = React.useRef(new Set<() => void>())

    React.useEffect(() => {
        const unsubscribers = taskUnsubscribersRef.current
        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe())
            unsubscribers.clear()
        }
    }, [])

    return React.useCallback((taskId: number, onCompleted?: () => void) => {
        const unsubscribe = subscribe(taskId, (taskState) => {
            if (taskState.status !== "completed" && taskState.status !== "failed") {
                return
            }

            unsubscribe()
            taskUnsubscribersRef.current.delete(unsubscribe)

            if (taskState.status === "completed") {
                onCompleted?.()
            }
        })

        taskUnsubscribersRef.current.add(unsubscribe)
    }, [subscribe])
}
