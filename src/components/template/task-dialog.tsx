'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { TokenChip } from "./token-chip"
import { toast } from "sonner"
import { showTaskStartedToast } from "@/components/task/task-started-toast"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"

const FORM_FIELDS = [
    { name: 'instrumentType', label: 'Instrument Type' },
    { name: 'region', label: 'Region' },
    { name: 'universe', label: 'Universe' },
    { name: 'delay', label: 'Delay' },
    { name: 'decay', label: 'Decay' },
    { name: 'neutralization', label: 'Neutralization' },
    { name: 'truncation', label: 'Truncation' },
    { name: 'pasteurization', label: 'Pasteurization' },
    { name: 'testPeriod', label: 'Test Period' },
    { name: 'unitHandling', label: 'Unit Handling' },
    { name: 'nanHandling', label: 'NaN Handling' },
    { name: 'maxTrade', label: 'Max Trade' },
    { name: 'language', label: 'Language' },
    { name: 'visualization', label: 'Visualization' },
]

type Template = {
    id: string | number
    title: string
    description: string
    expression: string
}

const parseTemplate = (content: string) => {
    const parts: Array<{ type: 'text' | 'token'; text?: string; name?: string }> = []
    if (!content) return parts
    const re = /<([a-zA-Z0-9_:-]+)\/>/g
    let lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(content)) !== null) {
        const idx = m.index
        if (idx > lastIndex) parts.push({ type: 'text', text: content.slice(lastIndex, idx) })
        parts.push({ type: 'token', name: m[1] })
        lastIndex = re.lastIndex
    }
    if (lastIndex < content.length) parts.push({ type: 'text', text: content.slice(lastIndex) })
    return parts
}

export function TaskDialog({
    open,
    onOpenChange,
    template
}: {
    open: boolean,
    onOpenChange: (open: boolean) => void,
    template: Template | null
}) {
    const [bindings, setBindings] = React.useState<Record<string, string[]>>({})
    const [formData, setFormData] = React.useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const navigate = useWorkspaceNavigate()

    React.useEffect(() => {
        if (open) {
            setBindings({})
            setFormData({})
        }
    }, [open])

    const parts = React.useMemo(() => parseTemplate(template?.expression || ""), [template])

    const handleSaveBinding = (name: string, val: string[]) => {
        setBindings(prev => ({ ...prev, [name]: val }))
    }

    const handleFormChange = (name: string, val: string) => {
        setFormData(prev => ({ ...prev, [name]: val }))
    }

    const handleCreateTask = async () => {
        try {
            setIsSubmitting(true)
            const payload = {
                ...formData,
                fieldData: bindings,
                template_id: template?.id,
            }
            const res = await apiClient.post(`/quants/wqb/alpha-task`, payload)
            const taskId = res.data?.task_id
            
            if (taskId) {
                showTaskStartedToast(taskId, () => navigate(`/sys-task/${taskId}`))
            } else {
                toast.success("Task parameters saved and testing started!")
            }
            onOpenChange(false)
        } catch (e) {
            toast.error("Failed to submit task")
            console.error(e)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Task Parameters: {template?.title}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Expression Bindings</h3>
                        <div className="p-4 rounded-md border bg-muted/30 font-mono whitespace-pre-wrap leading-relaxed">
                            {parts.map((p, idx) => (
                                p.type === 'text'
                                    ? <span key={idx}>{p.text}</span>
                                    : <TokenChip key={idx} tokenName={p.name!} bindings={bindings} onSave={handleSaveBinding} />
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {FORM_FIELDS.map(f => (
                            <div key={f.name} className="grid gap-2">
                                <Label htmlFor={f.name}>{f.label}</Label>
                                <Input
                                    id={f.name}
                                    value={formData[f.name] || ""}
                                    onChange={(e) => handleFormChange(f.name, e.target.value)}
                                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreateTask} disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save & Test Bindings"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
