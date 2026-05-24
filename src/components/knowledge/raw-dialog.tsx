"use client"

import {
    Dialog,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { MarkdownDialogContent } from "@/components/common/markdown-dialog-content"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { MarkdownEditor } from "@/components/common/markdown-editor"
import { knowledgeRawTemplates } from "@/lib/markdown-templates"
import type { RawFormState } from "@/lib/knowledge"

type Option = {
    label: string
    value: string
}

export function KnowledgeRawDialog({
    open,
    isEditing,
    isSaving,
    form,
    domainOptions,
    sourceTypeOptions,
    contentTypeOptions,
    statusOptions,
    onOpenChange,
    onFormChange,
    onCancel,
    onSave,
}: {
    open: boolean
    isEditing: boolean
    isSaving: boolean
    form: RawFormState
    domainOptions: Option[]
    sourceTypeOptions: Option[]
    contentTypeOptions: Option[]
    statusOptions: Option[]
    onOpenChange: (open: boolean) => void
    onFormChange: (updater: (prev: RawFormState) => RawFormState) => void
    onCancel: () => void
    onSave: () => void
}) {
    return (
        <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
            <MarkdownDialogContent>
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>{isEditing ? "Edit Raw Knowledge" : "Create Raw Knowledge"}</DialogTitle>
                    <DialogDescription>
                        Keep this layer lightweight. We can always curate and publish it later.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={form.title} onChange={(e) => onFormChange((prev) => ({ ...prev, title: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Namespace Hint</Label>
                            <Input value={form.namespaceHint} onChange={(e) => onFormChange((prev) => ({ ...prev, namespaceHint: e.target.value }))} placeholder="econ_intuition" />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="grid gap-2">
                            <Label>Domain</Label>
                            <Select value={form.domain} onValueChange={(value) => onFormChange((prev) => ({ ...prev, domain: value }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{domainOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Source Type</Label>
                            <Select value={form.sourceType} onValueChange={(value) => onFormChange((prev) => ({ ...prev, sourceType: value }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{sourceTypeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Content Type</Label>
                            <Select value={form.contentType} onValueChange={(value) => onFormChange((prev) => ({ ...prev, contentType: value }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{contentTypeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(value) => onFormChange((prev) => ({ ...prev, status: value }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Tags JSON</Label>
                            <Textarea value={form.tags} onChange={(e) => onFormChange((prev) => ({ ...prev, tags: e.target.value }))} className="min-h-[90px] font-mono text-xs" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Scope JSON</Label>
                            <Textarea value={form.scope} onChange={(e) => onFormChange((prev) => ({ ...prev, scope: e.target.value }))} className="min-h-[90px] font-mono text-xs" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label>Source Ref</Label>
                            <Input value={form.sourceRef} onChange={(e) => onFormChange((prev) => ({ ...prev, sourceRef: e.target.value }))} placeholder="book / url / task / alpha / note" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Related Object Type</Label>
                            <Input value={form.relatedObjectType} onChange={(e) => onFormChange((prev) => ({ ...prev, relatedObjectType: e.target.value }))} placeholder="task / alpha / article / experiment" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Related Object ID</Label>
                            <Input value={form.relatedObjectId} onChange={(e) => onFormChange((prev) => ({ ...prev, relatedObjectId: e.target.value }))} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Summary</Label>
                        <Textarea value={form.summary} onChange={(e) => onFormChange((prev) => ({ ...prev, summary: e.target.value }))} className="min-h-[110px]" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Content</Label>
                        <MarkdownEditor
                            value={form.content}
                            onChange={(value) => onFormChange((prev) => ({ ...prev, content: value }))}
                            className="h-[360px]"
                            templates={knowledgeRawTemplates}
                        />
                    </div>
                </div>
                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Raw Knowledge"}</Button>
                </DialogFooter>
            </MarkdownDialogContent>
        </Dialog>
    )
}
