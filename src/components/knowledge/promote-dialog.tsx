"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { PromoteFormState } from "@/lib/knowledge"

type Option = {
    label: string
    value: string
}

export function KnowledgePromoteDialog({
    open,
    isPromoting,
    form,
    statusOptions,
    onOpenChange,
    onFormChange,
    onPromote,
}: {
    open: boolean
    isPromoting: boolean
    form: PromoteFormState
    statusOptions: Option[]
    onOpenChange: (open: boolean) => void
    onFormChange: (updater: (prev: PromoteFormState) => PromoteFormState) => void
    onPromote: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Promote Raw Knowledge</DialogTitle>
                    <DialogDescription>
                        Turn a raw note into a durable knowledge document without losing its provenance.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input value={form.title} onChange={(e) => onFormChange((prev) => ({ ...prev, title: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Namespace</Label>
                            <Input value={form.namespace} onChange={(e) => onFormChange((prev) => ({ ...prev, namespace: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Doc Type</Label>
                            <Input value={form.docTyp} onChange={(e) => onFormChange((prev) => ({ ...prev, docTyp: e.target.value }))} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Doc Key</Label>
                        <Input value={form.docKey} onChange={(e) => onFormChange((prev) => ({ ...prev, docKey: e.target.value }))} className="font-mono text-xs" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label>Version</Label>
                            <Input value={form.version} onChange={(e) => onFormChange((prev) => ({ ...prev, version: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(value) => onFormChange((prev) => ({ ...prev, status: value }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Confidence</Label>
                            <Input value={form.confidence} onChange={(e) => onFormChange((prev) => ({ ...prev, confidence: e.target.value }))} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={onPromote} disabled={isPromoting}>{isPromoting ? "Promoting..." : "Promote to Document"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
