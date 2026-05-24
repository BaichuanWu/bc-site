"use client"

import { MarkdownEditor } from "@/components/common/markdown-editor"
import { MarkdownDialogContent } from "@/components/common/markdown-dialog-content"
import { Button } from "@/components/ui/button"
import {
    Dialog,
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
import { Textarea } from "@/components/ui/textarea"
import { knowledgeDocumentTemplates } from "@/lib/markdown-templates"
import {
    buildKnowledgeDocKey,
    type DocumentFormState,
} from "@/lib/knowledge"

type Option = {
    label: string
    value: string
}

export function KnowledgeDocumentDialog({
    open,
    isEditing,
    isSaving,
    form,
    domainOptions,
    statusOptions,
    onOpenChange,
    onFormChange,
    onCancel,
    onSave,
}: {
    open: boolean
    isEditing: boolean
    isSaving: boolean
    form: DocumentFormState
    domainOptions: Option[]
    statusOptions: Option[]
    onOpenChange: (open: boolean) => void
    onFormChange: (updater: (prev: DocumentFormState) => DocumentFormState) => void
    onCancel: () => void
    onSave: () => void
}) {
    return (
        <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
            <MarkdownDialogContent>
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>{isEditing ? "Edit Knowledge Document" : "Create Knowledge Document"}</DialogTitle>
                    <DialogDescription>
                        This is the durable layer that later powers retrieval, synthesis, and long-term memory.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input
                                value={form.title}
                                onChange={(e) =>
                                    onFormChange((prev) => ({
                                        ...prev,
                                        title: e.target.value,
                                        docKey: prev.docKey || buildKnowledgeDocKey(prev.namespace, e.target.value),
                                    }))
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Namespace</Label>
                            <Input
                                value={form.namespace}
                                onChange={(e) =>
                                    onFormChange((prev) => ({
                                        ...prev,
                                        namespace: e.target.value,
                                        docKey: buildKnowledgeDocKey(e.target.value, prev.title),
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4">
                        <div className="grid gap-2">
                            <Label>Domain</Label>
                            <Select value={form.domain} onValueChange={(value) => onFormChange((prev) => ({ ...prev, domain: value }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{domainOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Doc Type</Label>
                            <Input value={form.docType} onChange={(e) => onFormChange((prev) => ({ ...prev, docType: e.target.value }))} />
                        </div>
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

                    <div className="grid gap-2">
                        <Label>Doc Key</Label>
                        <Input value={form.docKey} onChange={(e) => onFormChange((prev) => ({ ...prev, docKey: e.target.value }))} className="font-mono text-xs" />
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
                            templates={knowledgeDocumentTemplates}
                        />
                    </div>
                </div>
                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Knowledge Document"}</Button>
                </DialogFooter>
            </MarkdownDialogContent>
        </Dialog>
    )
}
