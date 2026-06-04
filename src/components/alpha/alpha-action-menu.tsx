"use client"

import * as React from "react"
import { FileText, MoreHorizontal, Play, Send, Edit, Search, TreePine, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"

type Alpha = {
    id: string | number
    wqbAlphaId: string
    expression: string
    description?: string
    state: number
    parentId?: string | number
    ancestorId?: string | number
}

interface AlphaActionMenuProps {
    alpha: Alpha
    onSuccess?: () => void
}

import { useTaskAction } from "@/hooks/use-task-action"

export function AlphaActionMenu({ alpha, onSuccess }: AlphaActionMenuProps) {
    const navigate = useWorkspaceNavigate()
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const [editedExpression, setEditedExpression] = React.useState(alpha.expression)
    const { runTask, runNamedTask, isLoading } = useTaskAction()

    const handleAction = async (
        action: string,
        taskName: string,
        kwargs: Record<string, unknown>,
        options?: {
            onTaskCompleted?: () => void | Promise<void>
        },
    ) => {
        const handleTaskCompleted = options?.onTaskCompleted ?? onSuccess

        await runNamedTask(
            taskName,
            { kwargs },
            {
                fallbackSuccessMessage: `${action} task created`,
                errorMessage: `Failed to ${action.toLowerCase()}`,
                onTaskCompleted: handleTaskCompleted
            }
        )
    }

    const handleEditAndSimulate = async () => {
        await runTask(
            async () => {
                await apiClient.put(`/quants/wqb/alpha`, {
                    id: alpha.id,
                    expression: editedExpression,
                    state: 1
                })
                return await apiClient.post(`/sys/tasks/run/alpha_simulate`, {
                    kwargs: { alphaIds: [alpha.id] }
                })
            },
            {
                fallbackSuccessMessage: "Alpha updated and simulation started",
                errorMessage: "Failed to update and simulate",
                onSuccess: () => {
                    setIsEditDialogOpen(false)
                    onSuccess?.()
                },
                onTaskCompleted: onSuccess,
            }
        )
    }

    // State conditions (assuming state 10 is Simulated, 20+ is Submitted/Active)
    const isSimulated = alpha.state >= 10
    const isSubmitted = alpha.state >= 20
    const isPending = alpha.state === 5

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading || isPending}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    <DropdownMenuItem onClick={() => handleAction("Simulate", "alpha_simulate", { alphaIds: [alpha.id] })}>
                        <Play className="mr-2 h-4 w-4" /> Simulate
                    </DropdownMenuItem>

                    {isSimulated && (
                        <DropdownMenuItem onClick={() => handleAction("Batch Neutralizations", "simulate_neutralizations_task", { alphaId: alpha.id })}>
                            <Zap className="mr-2 h-4 w-4" /> All Neutralizations
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit & Simulate
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {isSimulated && (
                        <DropdownMenuItem
                            onClick={() => handleAction(
                                "Generate Description",
                                "generate_alpha_description_task",
                                { alphaId: alpha.id },
                            )}
                        >
                            <FileText className="mr-2 h-4 w-4" /> Generate Description
                        </DropdownMenuItem>
                    )}

                    {isSimulated && (
                        <DropdownMenuItem
                            onClick={async () => {
                                await runNamedTask(
                                    "update_alpha_pc_task",
                                    { kwargs: { query: { id: alpha.id } } },
                                    {
                                        fallbackSuccessMessage: "Query PC task created",
                                        errorMessage: "Failed to query pc",
                                        onTaskCompleted: async () => {
                                            await onSuccess?.()
                                        },
                                    }
                                )
                            }}
                        >
                            <Search className="mr-2 h-4 w-4" /> Query PC
                        </DropdownMenuItem>
                    )}

                    {!isSubmitted && isSimulated && (
                        <DropdownMenuItem
                            onClick={() => handleAction(
                                "Submit",
                                "submit_alpha_task",
                                { alphaId: alpha.id },
                                {
                                    onTaskCompleted: async () => {
                                        await onSuccess?.()
                                    },
                                },
                            )}
                        >
                            <Send className="mr-2 h-4 w-4" /> Submit to WQB
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => {
                        const params = new URLSearchParams()
                        if (alpha.id) params.set("ids", String(alpha.id))
                        if (alpha.parentId) params.append("ids", String(alpha.parentId))
                        if (alpha.ancestorId) params.append("ids", String(alpha.ancestorId))
                        navigate("/dashboard/wqb/alpha/analysis", params.toString())
                    }}>
                        <TreePine className="mr-2 h-4 w-4" /> Analysis Tree
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Edit & Simulate Alpha</DialogTitle>
                        <DialogDescription>
                            Modify the expression below and trigger a new simulation.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            value={editedExpression}
                            onChange={(e) => setEditedExpression(e.target.value)}
                            className="min-h-[200px] font-mono text-xs"
                            placeholder="Enter alpha expression..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditAndSimulate} disabled={isLoading}>
                            {isLoading && <Play className="mr-2 h-4 w-4 animate-spin" />}
                            Update & Simulate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
