'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface RunWorkflowDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workflowName: string
    title: string
}

export function RunWorkflowDialog({
    open,
    onOpenChange,
    workflowName,
    title
}: RunWorkflowDialogProps) {
    const [region, setRegion] = React.useState("USA")
    const [datasetId, setDatasetId] = React.useState("top_v1")
    const [universe, setUniverse] = React.useState("TOP3000")
    const [delay, setDelay] = React.useState("1")
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleRun = async () => {
        try {
            setIsSubmitting(true)
            const payload = {
                kwargs: {
                    config: {
                        region,
                        dataset_id: datasetId,
                        universe,
                        delay: parseInt(delay) || 1
                    }
                }
            }
            const res: any = await apiClient.post(`/sys/run/${workflowName}`, payload)
            toast.success("Workflow started successfully!", {
                description: `Task ID: ${res.task_id}`
            })
            onOpenChange(false)
        } catch (e) {
            toast.error("Failed to start workflow")
            console.error(e)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Run {title}</DialogTitle>
                    <DialogDescription>
                        Configure the execution parameters for this AI workflow.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="region">Region</Label>
                        <Select value={region} onValueChange={setRegion}>
                            <SelectTrigger id="region">
                                <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USA">USA</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="ASI">ASI</SelectItem>
                                <SelectItem value="CHN">CHN</SelectItem>
                                <SelectItem value="JPN">JPN</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="datasetId">Dataset ID</Label>
                        <Input 
                            id="datasetId" 
                            value={datasetId} 
                            onChange={(e) => setDatasetId(e.target.value)} 
                            placeholder="e.g. top_v1"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="universe">Universe</Label>
                        <Input 
                            id="universe" 
                            value={universe} 
                            onChange={(e) => setUniverse(e.target.value)} 
                            placeholder="e.g. TOP3000"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="delay">Delay (Days)</Label>
                        <Input 
                            id="delay" 
                            type="number" 
                            value={delay} 
                            onChange={(e) => setDelay(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleRun} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Execute Task
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
