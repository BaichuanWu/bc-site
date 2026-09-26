"use client"

import * as React from "react"

import { MarkdownDialogContent } from "@/components/common/markdown-dialog-content"
import { MarkdownEditor } from "@/components/common/markdown-editor"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import { knowledgeDocumentTemplates } from "@/lib/markdown-templates"
import type {
    AcceptCandidateFormState,
    CandidateFormState,
    KnowledgeNamespaceRecord,
    MergeCandidateFormState,
    NamespaceFormState,
    QuickPublishFormState,
} from "@/lib/knowledge"

type Option = {
    label: string
    value: string
}

export function NamespacePicker({
    namespaces,
    value,
    onChange,
}: {
    namespaces: KnowledgeNamespaceRecord[]
    value: string[]
    onChange: (value: string[]) => void
}) {
    const selected = new Set(value)
    return (
        <div className="grid max-h-44 gap-2 overflow-y-auto rounded-md border p-2">
            {namespaces.length === 0 ? (
                <div className="text-sm text-muted-foreground">No active namespaces.</div>
            ) : null}
            {namespaces.map((namespace) => {
                const namespaceKey = namespace.namespaceKey
                return (
                    <label key={namespaceKey} className="flex items-start gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted">
                        <Checkbox
                            checked={selected.has(namespaceKey)}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    onChange([...value, namespaceKey])
                                    return
                                }
                                onChange(value.filter((item) => item !== namespaceKey))
                            }}
                        />
                        <span className="min-w-0">
                            <span className="block font-mono text-xs">{namespaceKey}</span>
                            <span className="block truncate text-xs text-muted-foreground">{namespace.title || namespace.description}</span>
                        </span>
                    </label>
                )
            })}
        </div>
    )
}

export function KnowledgeNamespaceDialog({
    open,
    isEditing,
    isSaving,
    form,
    statusOptions,
    onOpenChange,
    onFormChange,
    onCancel,
    onSave,
}: {
    open: boolean
    isEditing: boolean
    isSaving: boolean
    form: NamespaceFormState
    statusOptions: Option[]
    onOpenChange: (open: boolean) => void
    onFormChange: (updater: (prev: NamespaceFormState) => NamespaceFormState) => void
    onCancel: () => void
    onSave: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Namespace" : "Create Namespace"}</DialogTitle>
                    <DialogDescription>Namespaces are controlled semantic coordinates used by documents and agents.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label>Namespace Key</Label>
                        <Input className="font-mono text-xs" value={form.namespaceKey} onChange={(event) => onFormChange((prev) => ({ ...prev, namespaceKey: event.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input value={form.title} onChange={(event) => onFormChange((prev) => ({ ...prev, title: event.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea value={form.description} onChange={(event) => onFormChange((prev) => ({ ...prev, description: event.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select value={form.status} onValueChange={(status) => onFormChange((prev) => ({ ...prev, status }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Namespace"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function KnowledgeCandidateDraftDialog({
    open,
    isSaving,
    form,
    activeNamespaces,
    onOpenChange,
    onFormChange,
    onCancel,
    onSave,
}: {
    open: boolean
    isSaving: boolean
    form: CandidateFormState
    activeNamespaces: KnowledgeNamespaceRecord[]
    onOpenChange: (open: boolean) => void
    onFormChange: (updater: (prev: CandidateFormState) => CandidateFormState) => void
    onCancel: () => void
    onSave: () => void
}) {
    return (
        <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
            <MarkdownDialogContent>
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle>Create Candidate</DialogTitle>
                    <DialogDescription>Draft a reviewable candidate from source input.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={form.title} onChange={(event) => onFormChange((prev) => ({ ...prev, title: event.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Doc Type</Label>
                            <Input value={form.docTyp} onChange={(event) => onFormChange((prev) => ({ ...prev, docTyp: event.target.value }))} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Proposed Namespaces</Label>
                        <NamespacePicker namespaces={activeNamespaces} value={form.proposedNamespaceKeys} onChange={(proposedNamespaceKeys) => onFormChange((prev) => ({ ...prev, proposedNamespaceKeys }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Target Doc Key</Label>
                            <Input className="font-mono text-xs" value={form.targetDocKey} onChange={(event) => onFormChange((prev) => ({ ...prev, targetDocKey: event.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Confidence</Label>
                            <Input value={form.confidence} onChange={(event) => onFormChange((prev) => ({ ...prev, confidence: event.target.value }))} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Proposed New Namespaces JSON</Label>
                            <Textarea className="min-h-24 font-mono text-xs" value={form.proposedNewNamespaces} onChange={(event) => onFormChange((prev) => ({ ...prev, proposedNewNamespaces: event.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Metadata JSON</Label>
                            <Textarea className="min-h-24 font-mono text-xs" value={form.metadataJson} onChange={(event) => onFormChange((prev) => ({ ...prev, metadataJson: event.target.value }))} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Summary</Label>
                        <Textarea value={form.summary} onChange={(event) => onFormChange((prev) => ({ ...prev, summary: event.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Content</Label>
                        <MarkdownEditor value={form.content} onChange={(content) => onFormChange((prev) => ({ ...prev, content }))} className="h-[320px]" templates={knowledgeDocumentTemplates} />
                    </div>
                </div>
                <DialogFooter className="border-t px-6 py-4">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onSave} disabled={isSaving}>{isSaving ? "Saving..." : "Create Candidate"}</Button>
                </DialogFooter>
            </MarkdownDialogContent>
        </Dialog>
    )
}

export function AcceptCandidateDialog({
    open,
    isSaving,
    form,
    statusOptions,
    activeNamespaces,
    onOpenChange,
    onFormChange,
    onCancel,
    onAccept,
}: {
    open: boolean
    isSaving: boolean
    form: AcceptCandidateFormState
    statusOptions: Option[]
    activeNamespaces: KnowledgeNamespaceRecord[]
    onOpenChange: (open: boolean) => void
    onFormChange: (updater: (prev: AcceptCandidateFormState) => AcceptCandidateFormState) => void
    onCancel: () => void
    onAccept: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Accept Candidate</DialogTitle>
                    <DialogDescription>Accepting creates a new document version and regenerates chunks.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label>Accepted Namespaces</Label>
                        <NamespacePicker namespaces={activeNamespaces} value={form.namespaceKeys} onChange={(namespaceKeys) => onFormChange((prev) => ({ ...prev, namespaceKeys }))} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Doc Key</Label>
                        <Input className="font-mono text-xs" value={form.docKey} onChange={(event) => onFormChange((prev) => ({ ...prev, docKey: event.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Version</Label>
                            <Input value={form.version} onChange={(event) => onFormChange((prev) => ({ ...prev, version: event.target.value }))} placeholder="auto" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(status) => onFormChange((prev) => ({ ...prev, status }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Metadata Patch JSON</Label>
                        <Textarea className="min-h-24 font-mono text-xs" value={form.metadataPatch} onChange={(event) => onFormChange((prev) => ({ ...prev, metadataPatch: event.target.value }))} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onAccept} disabled={isSaving || form.namespaceKeys.length === 0}>{isSaving ? "Accepting..." : "Accept Candidate"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function QuickPublishSourceDialog({
    open,
    isSaving,
    form,
    statusOptions,
    activeNamespaces,
    onOpenChange,
    onFormChange,
    onCancel,
    onPublish,
}: {
    open: boolean
    isSaving: boolean
    form: QuickPublishFormState
    statusOptions: Option[]
    activeNamespaces: KnowledgeNamespaceRecord[]
    onOpenChange: (open: boolean) => void
    onFormChange: (updater: (prev: QuickPublishFormState) => QuickPublishFormState) => void
    onCancel: () => void
    onPublish: () => void
}) {
    return (
        <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
            <MarkdownDialogContent>
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle>Quick Publish Source</DialogTitle>
                    <DialogDescription>Create a candidate, accept it, regenerate chunks, and request index sync in one governed action.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={form.title} onChange={(event) => onFormChange((prev) => ({ ...prev, title: event.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Doc Type</Label>
                            <Input value={form.docTyp} onChange={(event) => onFormChange((prev) => ({ ...prev, docTyp: event.target.value }))} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Accepted Namespaces</Label>
                        <NamespacePicker namespaces={activeNamespaces} value={form.namespaceKeys} onChange={(namespaceKeys) => onFormChange((prev) => ({ ...prev, namespaceKeys }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Doc Key</Label>
                            <Input className="font-mono text-xs" value={form.docKey} onChange={(event) => onFormChange((prev) => ({ ...prev, docKey: event.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Version</Label>
                            <Input value={form.version} onChange={(event) => onFormChange((prev) => ({ ...prev, version: event.target.value }))} placeholder="auto" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(status) => onFormChange((prev) => ({ ...prev, status }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Confidence</Label>
                            <Input value={form.confidence} onChange={(event) => onFormChange((prev) => ({ ...prev, confidence: event.target.value }))} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Summary</Label>
                        <Textarea value={form.summary} onChange={(event) => onFormChange((prev) => ({ ...prev, summary: event.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Content</Label>
                        <MarkdownEditor value={form.content} onChange={(content) => onFormChange((prev) => ({ ...prev, content }))} className="h-[320px]" templates={knowledgeDocumentTemplates} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Metadata JSON</Label>
                        <Textarea className="min-h-24 font-mono text-xs" value={form.metadata} onChange={(event) => onFormChange((prev) => ({ ...prev, metadata: event.target.value }))} />
                    </div>
                </div>
                <DialogFooter className="border-t px-6 py-4">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onPublish} disabled={isSaving || form.namespaceKeys.length === 0}>{isSaving ? "Publishing..." : "Quick Publish"}</Button>
                </DialogFooter>
            </MarkdownDialogContent>
        </Dialog>
    )
}

export function SimpleReasonDialog({
    open,
    title,
    description,
    actionLabel,
    isSaving,
    reason,
    onReasonChange,
    onOpenChange,
    onCancel,
    onAction,
}: {
    open: boolean
    title: string
    description: string
    actionLabel: string
    isSaving: boolean
    reason: string
    onReasonChange: (reason: string) => void
    onOpenChange: (open: boolean) => void
    onCancel: () => void
    onAction: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-2 py-2">
                    <Label>Reason</Label>
                    <Textarea value={reason} onChange={(event) => onReasonChange(event.target.value)} />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onAction} disabled={isSaving}>{isSaving ? "Saving..." : actionLabel}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function MergeCandidateDialog({
    open,
    isSaving,
    form,
    onOpenChange,
    onFormChange,
    onCancel,
    onMerge,
}: {
    open: boolean
    isSaving: boolean
    form: MergeCandidateFormState
    onOpenChange: (open: boolean) => void
    onFormChange: (updater: (prev: MergeCandidateFormState) => MergeCandidateFormState) => void
    onCancel: () => void
    onMerge: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Merge Candidate</DialogTitle>
                    <DialogDescription>Mark this candidate as merged into another candidate or document.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Target Candidate ID</Label>
                            <Input value={form.targetCandidateId} onChange={(event) => onFormChange((prev) => ({ ...prev, targetCandidateId: event.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Target Doc Key</Label>
                            <Input className="font-mono text-xs" value={form.targetDocKey} onChange={(event) => onFormChange((prev) => ({ ...prev, targetDocKey: event.target.value }))} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Reason</Label>
                        <Textarea value={form.reason} onChange={(event) => onFormChange((prev) => ({ ...prev, reason: event.target.value }))} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onMerge} disabled={isSaving}>{isSaving ? "Merging..." : "Merge Candidate"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
