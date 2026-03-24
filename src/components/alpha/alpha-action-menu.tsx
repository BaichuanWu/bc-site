"use client"

import * as React from "react"
import { MoreHorizontal, Play, Send, Edit, Search, TreePine, Zap } from "lucide-react"

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

type Alpha = {
    id: string | number
    wqbAlphaId: string
    expression: string
    state: number
    parentId?: string | number
    ancestorId?: string | number
}

interface AlphaActionMenuProps {
    alpha: Alpha
    onSuccess?: () => void
}

import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function AlphaActionMenu({ alpha, onSuccess }: AlphaActionMenuProps) {
    const router = useRouter()
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const [editedExpression, setEditedExpression] = React.useState(alpha.expression)
    const [isLoading, setIsLoading] = React.useState(false)

    const handleAction = async (action: string, endpoint: string) => {
        try {
            setIsLoading(true)
            const res = await apiClient.post(endpoint)
            const taskId = res.data?.task_id
            toast.success(`${action} task created`, {
                description: taskId ? `Task ID: ${taskId}` : undefined
            })
            onSuccess?.()
        } catch (e) {
            toast.error(`Failed to ${action.toLowerCase()}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditAndSimulate = async () => {
        try {
            setIsLoading(true)
            // First update the alpha with new expression
            await apiClient.put(`/quants/wqb/alpha`, {
                id: alpha.id,
                expression: editedExpression,
                state: 1
            })

            // Then trigger simulation
            const res = await apiClient.post(`/quants/wqb/alpha/${alpha.id}/simulate`)

            toast.success("Alpha updated and simulation started", {
                description: `Task ID: ${res.data?.task_id}`
            })
            setIsEditDialogOpen(false)
            onSuccess?.()
        } catch (e) {
            toast.error("Failed to update and simulate")
        } finally {
            setIsLoading(false)
        }
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

                    <DropdownMenuItem onClick={() => handleAction("Simulate", `/quants/wqb/alpha/${alpha.id}/simulate`)}>
                        <Play className="mr-2 h-4 w-4" /> Simulate
                    </DropdownMenuItem>

                    {isSimulated && (
                        <DropdownMenuItem onClick={() => handleAction("Batch Neutralizations", `/quants/wqb/alpha/${alpha.id}/simulate-neutralizations`)}>
                            <Zap className="mr-2 h-4 w-4" /> All Neutralizations
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit & Simulate
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {isSimulated && (
                        <DropdownMenuItem onClick={() => handleAction("Query PC", `/quants/wqb/alpha/${alpha.id}/query-pc`)}>
                            <Search className="mr-2 h-4 w-4" /> Query PC
                        </DropdownMenuItem>
                    )}

                    {!isSubmitted && isSimulated && (
                        <DropdownMenuItem onClick={() => handleAction("Submit", `/quants/wqb/alpha/${alpha.id}/submit`)}>
                            <Send className="mr-2 h-4 w-4" /> Submit to WQB
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => {
                        const params = new URLSearchParams()
                        if (alpha.id) params.set("ids", String(alpha.id))
                        if (alpha.parentId) params.append("ids", String(alpha.parentId))
                        if (alpha.ancestorId) params.append("ids", String(alpha.ancestorId))
                        router.push(`/dashboard/world-brain-quant/alpha/analysis?${params.toString()}`)
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
