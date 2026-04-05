"use client"

import * as React from "react"
import useSWR from "swr"
import { BookOpen, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { apiClient } from "@/lib/api"
import { formatJsonText, parseJsonText } from "@/lib/json-utils"
import { useCrud } from "@/hooks/use-crud"
import { useDeleteAction } from "@/hooks/use-delete-action"
import { useMeta } from "@/hooks/use-meta"
import { CrudLayout } from "@/components/common/crud-layout"
import { ActionButtons } from "@/components/common/action-buttons"
import { ListPageShell } from "@/components/common/list-page-shell"
import { MarkdownEditor } from "@/components/common/markdown-editor"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { type Column } from "@/components/common/data-table"
import { type SearchFilterItem } from "@/components/common/query-filters"
import {
    knowledgeDocumentTemplates,
    knowledgeRawTemplates,
} from "@/lib/markdown-templates"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"

type KnowledgeOptionsResponse = {
    defaults?: {
        domain?: number
        source_type?: number
        content_type?: number
        raw_status?: number
        document_status?: number
        confidence?: string
    }
}

type KnowledgeRawRecord = {
    id: number
    title: string
    domain: number
    source_type: number
    content_type: number
    status: number
    namespace_hint?: string
    tags?: string[]
    scope?: Record<string, unknown>
    summary?: string
    content?: string
    source_ref?: string
    related_object_type?: string
    related_object_id?: number
    reviewed_time?: string
    update_time?: string
}

type KnowledgeDocumentRecord = {
    id: number
    title: string
    domain: number
    namespace: string
    doc_type: string
    doc_key: string
    version: string
    status: number
    tags?: string[]
    scope?: Record<string, unknown>
    summary?: string
    content?: string
    confidence?: string
    published_time?: string
    update_time?: string
}

type RawFormState = {
    title: string
    domain: string
    source_type: string
    content_type: string
    status: string
    namespace_hint: string
    tags: string
    scope: string
    summary: string
    content: string
    source_ref: string
    related_object_type: string
    related_object_id: string
}

type DocumentFormState = {
    title: string
    domain: string
    namespace: string
    doc_type: string
    doc_key: string
    version: string
    status: string
    tags: string
    scope: string
    summary: string
    content: string
    confidence: string
}

type PromoteFormState = {
    title: string
    namespace: string
    doc_type: string
    doc_key: string
    version: string
    status: string
    confidence: string
}

const EMPTY_RAW_FORM: RawFormState = {
    title: "",
    domain: "0",
    source_type: "0",
    content_type: "0",
    status: "0",
    namespace_hint: "",
    tags: "[]",
    scope: "{}",
    summary: "",
    content: "",
    source_ref: "",
    related_object_type: "",
    related_object_id: "",
}

const EMPTY_DOCUMENT_FORM: DocumentFormState = {
    title: "",
    domain: "0",
    namespace: "general",
    doc_type: "note",
    doc_key: "",
    version: "1.0.0",
    status: "0",
    tags: "[]",
    scope: "{}",
    summary: "",
    content: "",
    confidence: "medium",
}

const EMPTY_PROMOTE_FORM: PromoteFormState = {
    title: "",
    namespace: "general",
    doc_type: "note",
    doc_key: "",
    version: "1.0.0",
    status: "0",
    confidence: "medium",
}

function buildDocKey(namespace: string, title: string) {
    const slug = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    return `${namespace || "general"}:${slug || "knowledge-doc"}`
}

function preventDialogCloseWhileFullscreen(event: Event) {
    if (typeof document === "undefined") return
    if (document.documentElement.dataset.mdEditorFullscreen === "true") {
        event.preventDefault()
    }
}

function preventDialogEscapeWhileFullscreen(event: KeyboardEvent) {
    if (typeof document === "undefined") return
    if (document.documentElement.dataset.mdEditorFullscreen === "true") {
        event.preventDefault()
    }
}

export default function KnowledgePage() {
    const deleteAction = useDeleteAction()
    const { getOptions, getLabel } = useMeta()
    useWorkspaceTabTitle("/dashboard/knowledge", "Knowledge")
    const { data: options } = useSWR<KnowledgeOptionsResponse>("/knowledge/options", (url: string) =>
        apiClient.get(url).then((res) => res as KnowledgeOptionsResponse)
    )

    const rawCrud = useCrud<KnowledgeRawRecord>("/knowledge/raw")
    const documentCrud = useCrud<KnowledgeDocumentRecord>("/knowledge/document")

    const [rawForm, setRawForm] = React.useState<RawFormState>(EMPTY_RAW_FORM)
    const [documentForm, setDocumentForm] = React.useState<DocumentFormState>(EMPTY_DOCUMENT_FORM)
    const [promoteForm, setPromoteForm] = React.useState<PromoteFormState>(EMPTY_PROMOTE_FORM)
    const [promotingRaw, setPromotingRaw] = React.useState<KnowledgeRawRecord | null>(null)
    const [promoteOpen, setPromoteOpen] = React.useState(false)
    const [isPromoting, setIsPromoting] = React.useState(false)

    React.useEffect(() => {
        const defaults = options?.defaults
        if (!defaults) return
        setRawForm((prev) => ({
            ...prev,
            domain: String(defaults.domain ?? 0),
            source_type: String(defaults.source_type ?? 0),
            content_type: String(defaults.content_type ?? 0),
            status: String(defaults.raw_status ?? 0),
        }))
        setDocumentForm((prev) => ({
            ...prev,
            domain: String(defaults.domain ?? 0),
            status: String(defaults.document_status ?? 0),
            confidence: defaults.confidence ?? "medium",
        }))
        setPromoteForm((prev) => ({
            ...prev,
            status: String(defaults.document_status ?? 0),
            confidence: defaults.confidence ?? "medium",
        }))
    }, [options])

    React.useEffect(() => {
        if (!rawCrud.isDialogOpen) return
        if (rawCrud.editingItem) {
            const item = rawCrud.editingItem
            setRawForm({
                title: item.title || "",
                domain: String(item.domain ?? 0),
                source_type: String(item.source_type ?? 0),
                content_type: String(item.content_type ?? 0),
                status: String(item.status ?? 0),
                namespace_hint: item.namespace_hint || "",
                tags: formatJsonText(item.tags ?? [], "[]"),
                scope: formatJsonText(item.scope ?? {}, "{}"),
                summary: item.summary || "",
                content: item.content || "",
                source_ref: item.source_ref || "",
                related_object_type: item.related_object_type || "",
                related_object_id: item.related_object_id ? String(item.related_object_id) : "",
            })
            return
        }
        setRawForm((prev) => ({
            ...EMPTY_RAW_FORM,
            domain: prev.domain,
            source_type: prev.source_type,
            content_type: prev.content_type,
            status: prev.status,
        }))
    }, [rawCrud.isDialogOpen, rawCrud.editingItem])

    React.useEffect(() => {
        if (!documentCrud.isDialogOpen) return
        if (documentCrud.editingItem) {
            const item = documentCrud.editingItem
            setDocumentForm({
                title: item.title || "",
                domain: String(item.domain ?? 0),
                namespace: item.namespace || "general",
                doc_type: item.doc_type || "note",
                doc_key: item.doc_key || "",
                version: item.version || "1.0.0",
                status: String(item.status ?? 0),
                tags: formatJsonText(item.tags ?? [], "[]"),
                scope: formatJsonText(item.scope ?? {}, "{}"),
                summary: item.summary || "",
                content: item.content || "",
                confidence: item.confidence || "medium",
            })
            return
        }
        setDocumentForm((prev) => ({
            ...EMPTY_DOCUMENT_FORM,
            domain: prev.domain,
            status: prev.status,
            confidence: prev.confidence,
        }))
    }, [documentCrud.isDialogOpen, documentCrud.editingItem])

    const rawStatusOptions = getOptions("KnowledgeRaw", "STATUS_NAME_MAPPING").map((option) => ({
        label: String(option.label),
        value: String(option.value),
    }))
    const domainOptions = getOptions("KnowledgeRaw", "DOMAIN_NAME_MAPPING").map((option) => ({
        label: String(option.label),
        value: String(option.value),
    }))
    const sourceTypeOptions = getOptions("KnowledgeRaw", "SOURCE_NAME_MAPPING").map((option) => ({
        label: String(option.label),
        value: String(option.value),
    }))
    const contentTypeOptions = getOptions("KnowledgeRaw", "CONTENT_NAME_MAPPING").map((option) => ({
        label: String(option.label),
        value: String(option.value),
    }))
    const documentStatusOptions = getOptions("KnowledgeDocument", "STATUS_NAME_MAPPING").map((option) => ({
        label: String(option.label),
        value: String(option.value),
    }))

    const rawFilterItems: SearchFilterItem[] = React.useMemo(
        () => [
            { key: "title", label: "Title", type: "text" },
            { key: "namespaceHint", label: "Namespace", type: "text" },
            {
                key: "domain",
                label: "Domain",
                type: "number",
                options: domainOptions.map(({ label, value }) => ({ label, value: Number(value) })),
            },
            {
                key: "status",
                label: "Status",
                type: "number",
                options: rawStatusOptions.map(({ label, value }) => ({ label, value: Number(value) })),
            },
        ],
        [domainOptions, rawStatusOptions]
    )

    const documentFilterItems: SearchFilterItem[] = React.useMemo(
        () => [
            { key: "title", label: "Title", type: "text" },
            { key: "namespace", label: "Namespace", type: "text" },
            { key: "docType", label: "Doc Type", type: "text" },
            {
                key: "domain",
                label: "Domain",
                type: "number",
                options: domainOptions.map(({ label, value }) => ({ label, value: Number(value) })),
            },
            {
                key: "status",
                label: "Status",
                type: "number",
                options: documentStatusOptions.map(({ label, value }) => ({ label, value: Number(value) })),
            },
        ],
        [domainOptions, documentStatusOptions]
    )

    const rawColumns: Column<KnowledgeRawRecord>[] = React.useMemo(
        () => [
            { key: "id", title: "ID", width: 70 },
            {
                key: "title",
                title: "Title",
                width: 280,
                render: (value, item) => (
                    <div className="space-y-1">
                        <div className="font-medium">{String(value || "-")}</div>
                        {item.summary ? (
                            <div className="text-xs text-muted-foreground line-clamp-2">{item.summary}</div>
                        ) : null}
                    </div>
                ),
            },
            {
                key: "domain",
                title: "Domain",
                width: 120,
                render: (value) => <Badge variant="outline">{getLabel("KnowledgeRaw", "DOMAIN_NAME_MAPPING", value)}</Badge>,
            },
            {
                key: "source_type",
                title: "Source",
                width: 120,
                render: (value) => <Badge variant="secondary">{getLabel("KnowledgeRaw", "SOURCE_NAME_MAPPING", value)}</Badge>,
            },
            {
                key: "content_type",
                title: "Content",
                width: 120,
                render: (value) => <Badge variant="outline">{getLabel("KnowledgeRaw", "CONTENT_NAME_MAPPING", value)}</Badge>,
            },
            { key: "namespace_hint", title: "Namespace Hint", width: 160 },
            {
                key: "status",
                title: "Status",
                width: 120,
                render: (value) => <Badge>{getLabel("KnowledgeRaw", "STATUS_NAME_MAPPING", value)}</Badge>,
            },
            {
                key: "actions",
                title: "Actions",
                width: 140,
                fixed: "right",
                render: (_, item) => (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const title = item.title || ""
                                const namespace = item.namespace_hint || "general"
                                setPromotingRaw(item)
                                setPromoteForm({
                                    title,
                                    namespace,
                                    doc_type: "note",
                                    doc_key: buildDocKey(namespace, title),
                                    version: "1.0.0",
                                    status: String(options?.defaults?.document_status ?? 0),
                                    confidence: options?.defaults?.confidence ?? "medium",
                                })
                                setPromoteOpen(true)
                            }}
                        >
                            <Sparkles className="mr-1 h-4 w-4" />
                            Promote
                        </Button>
                        <ActionButtons
                            onEdit={() => rawCrud.handleOpenDialog(item)}
                            onConfirmDelete={async () => {
                                await deleteAction.remove("/knowledge/raw", item.id, {
                                    successMessage: "Raw knowledge deleted successfully",
                                    errorMessage: "Failed to delete raw knowledge",
                                    onSuccess: async () => {
                                        await rawCrud.mutate()
                                    },
                                })
                            }}
                            description={
                                <>
                                    Are you sure you want to delete raw knowledge <strong>{item.title}</strong>?
                                </>
                            }
                        />
                    </div>
                ),
            },
        ],
        [deleteAction, getLabel, options, rawCrud]
    )

    const documentColumns: Column<KnowledgeDocumentRecord>[] = React.useMemo(
        () => [
            { key: "id", title: "ID", width: 70 },
            {
                key: "title",
                title: "Title",
                width: 280,
                render: (value, item) => (
                    <div className="space-y-1">
                        <div className="font-medium">{String(value || "-")}</div>
                        <div className="text-xs text-muted-foreground">
                            {item.namespace} / {item.doc_type}
                        </div>
                    </div>
                ),
            },
            {
                key: "domain",
                title: "Domain",
                width: 120,
                render: (value) => <Badge variant="outline">{getLabel("KnowledgeDocument", "DOMAIN_NAME_MAPPING", value)}</Badge>,
            },
            { key: "doc_key", title: "Doc Key", width: 220, truncate: true, className: "font-mono text-xs" },
            { key: "version", title: "Version", width: 100 },
            {
                key: "status",
                title: "Status",
                width: 120,
                render: (value) => <Badge>{getLabel("KnowledgeDocument", "STATUS_NAME_MAPPING", value)}</Badge>,
            },
            {
                key: "confidence",
                title: "Confidence",
                width: 120,
                render: (value) => <Badge variant="secondary">{String(value || "medium")}</Badge>,
            },
            {
                key: "actions",
                title: "Actions",
                width: 100,
                fixed: "right",
                render: (_, item) => (
                    <ActionButtons
                        onEdit={() => documentCrud.handleOpenDialog(item)}
                        onConfirmDelete={async () => {
                            await deleteAction.remove("/knowledge/document", item.id, {
                                successMessage: "Knowledge document deleted successfully",
                                errorMessage: "Failed to delete knowledge document",
                                onSuccess: async () => {
                                    await documentCrud.mutate()
                                },
                            })
                        }}
                        description={
                            <>
                                Are you sure you want to delete knowledge document <strong>{item.title}</strong>?
                            </>
                        }
                    />
                ),
            },
        ],
        [deleteAction, documentCrud, getLabel]
    )

    const saveRaw = async () => {
        await rawCrud.handleSave({
            title: rawForm.title,
            domain: Number(rawForm.domain || 0),
            source_type: Number(rawForm.source_type || 0),
            content_type: Number(rawForm.content_type || 0),
            status: Number(rawForm.status || 0),
            namespace_hint: rawForm.namespace_hint || "",
            tags: parseJsonText(rawForm.tags, [] as string[]),
            scope: parseJsonText(rawForm.scope, {} as Record<string, unknown>),
            summary: rawForm.summary || "",
            content: rawForm.content || "",
            source_ref: rawForm.source_ref || "",
            related_object_type: rawForm.related_object_type || "",
            related_object_id: rawForm.related_object_id ? Number(rawForm.related_object_id) : undefined,
        } as Partial<KnowledgeRawRecord>)
    }

    const saveDocument = async () => {
        await documentCrud.handleSave({
            title: documentForm.title,
            domain: Number(documentForm.domain || 0),
            namespace: documentForm.namespace,
            doc_type: documentForm.doc_type,
            doc_key: documentForm.doc_key || buildDocKey(documentForm.namespace, documentForm.title),
            version: documentForm.version,
            status: Number(documentForm.status || 0),
            tags: parseJsonText(documentForm.tags, [] as string[]),
            scope: parseJsonText(documentForm.scope, {} as Record<string, unknown>),
            summary: documentForm.summary || "",
            content: documentForm.content || "",
            confidence: documentForm.confidence,
        } as Partial<KnowledgeDocumentRecord>)
    }

    const handlePromote = async () => {
        if (!promotingRaw) return
        try {
            setIsPromoting(true)
            await apiClient.post(`/knowledge/raw/${promotingRaw.id}/promote`, {
                title: promoteForm.title || undefined,
                namespace: promoteForm.namespace,
                doc_type: promoteForm.doc_type,
                doc_key: promoteForm.doc_key || buildDocKey(promoteForm.namespace, promoteForm.title || promotingRaw.title),
                version: promoteForm.version,
                status: Number(promoteForm.status || 0),
                confidence: promoteForm.confidence,
            })
            toast.success("Raw knowledge promoted to document")
            setPromoteOpen(false)
            setPromotingRaw(null)
            rawCrud.mutate()
            documentCrud.mutate()
        } catch (error: unknown) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to promote raw knowledge"
            toast.error(message)
        } finally {
            setIsPromoting(false)
        }
    }

    return (
        <ListPageShell title="Knowledge" icon={BookOpen}>
            <Tabs defaultValue="raw" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="raw">Raw Inbox</TabsTrigger>
                    <TabsTrigger value="documents">Knowledge Library</TabsTrigger>
                </TabsList>

                <TabsContent value="raw" className="space-y-4">
                    <CrudLayout<KnowledgeRawRecord>
                        embedded
                        title="Raw Knowledge Inbox"
                        endpoint="/knowledge/raw"
                        columns={rawColumns}
                        filterItems={rawFilterItems}
                        storageKey="knowledge-raw-filters"
                        addButtonLabel="New Raw Note"
                        onAdd={() => rawCrud.handleOpenDialog()}
                    >
                        <Dialog modal={false} open={rawCrud.isDialogOpen} onOpenChange={(open) => !open && rawCrud.handleCloseDialog()}>
                            <DialogContent
                                className="sm:max-w-[1100px] max-h-[90vh] flex flex-col p-0"
                                onInteractOutside={preventDialogCloseWhileFullscreen}
                                onPointerDownOutside={preventDialogCloseWhileFullscreen}
                                onEscapeKeyDown={preventDialogEscapeWhileFullscreen}
                            >
                                <DialogHeader className="px-6 py-4 border-b">
                                    <DialogTitle>{rawCrud.editingItem ? "Edit Raw Knowledge" : "Create Raw Knowledge"}</DialogTitle>
                                    <DialogDescription>
                                        Keep this layer lightweight. We can always curate and publish it later.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Title</Label>
                                            <Input value={rawForm.title} onChange={(e) => setRawForm((prev) => ({ ...prev, title: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Namespace Hint</Label>
                                            <Input value={rawForm.namespace_hint} onChange={(e) => setRawForm((prev) => ({ ...prev, namespace_hint: e.target.value }))} placeholder="econ_intuition" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Domain</Label>
                                            <Select value={rawForm.domain} onValueChange={(value) => setRawForm((prev) => ({ ...prev, domain: value }))}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{domainOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Source Type</Label>
                                            <Select value={rawForm.source_type} onValueChange={(value) => setRawForm((prev) => ({ ...prev, source_type: value }))}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{sourceTypeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Content Type</Label>
                                            <Select value={rawForm.content_type} onValueChange={(value) => setRawForm((prev) => ({ ...prev, content_type: value }))}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{contentTypeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Status</Label>
                                            <Select value={rawForm.status} onValueChange={(value) => setRawForm((prev) => ({ ...prev, status: value }))}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{rawStatusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Tags JSON</Label>
                                            <Textarea value={rawForm.tags} onChange={(e) => setRawForm((prev) => ({ ...prev, tags: e.target.value }))} className="min-h-[90px] font-mono text-xs" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Scope JSON</Label>
                                            <Textarea value={rawForm.scope} onChange={(e) => setRawForm((prev) => ({ ...prev, scope: e.target.value }))} className="min-h-[90px] font-mono text-xs" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Source Ref</Label>
                                            <Input value={rawForm.source_ref} onChange={(e) => setRawForm((prev) => ({ ...prev, source_ref: e.target.value }))} placeholder="book / url / task / alpha / note" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Related Object Type</Label>
                                            <Input value={rawForm.related_object_type} onChange={(e) => setRawForm((prev) => ({ ...prev, related_object_type: e.target.value }))} placeholder="task / alpha / article / experiment" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Related Object ID</Label>
                                            <Input value={rawForm.related_object_id} onChange={(e) => setRawForm((prev) => ({ ...prev, related_object_id: e.target.value }))} />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Summary</Label>
                                        <Textarea value={rawForm.summary} onChange={(e) => setRawForm((prev) => ({ ...prev, summary: e.target.value }))} className="min-h-[110px]" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Content</Label>
                                        <MarkdownEditor
                                            value={rawForm.content}
                                            onChange={(value) => setRawForm((prev) => ({ ...prev, content: value }))}
                                            className="h-[360px]"
                                            templates={knowledgeRawTemplates}
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="px-6 py-4 border-t">
                                    <Button variant="outline" onClick={rawCrud.handleCloseDialog}>Cancel</Button>
                                    <Button onClick={saveRaw} disabled={rawCrud.isSaving}>{rawCrud.isSaving ? "Saving..." : "Save Raw Knowledge"}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CrudLayout>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                    <CrudLayout<KnowledgeDocumentRecord>
                        embedded
                        title="Knowledge Library"
                        endpoint="/knowledge/document"
                        columns={documentColumns}
                        filterItems={documentFilterItems}
                        storageKey="knowledge-document-filters"
                        addButtonLabel="New Knowledge Document"
                        onAdd={() => documentCrud.handleOpenDialog()}
                    >
                        <Dialog modal={false} open={documentCrud.isDialogOpen} onOpenChange={(open) => !open && documentCrud.handleCloseDialog()}>
                            <DialogContent
                                className="sm:max-w-[1100px] max-h-[90vh] flex flex-col p-0"
                                onInteractOutside={preventDialogCloseWhileFullscreen}
                                onPointerDownOutside={preventDialogCloseWhileFullscreen}
                                onEscapeKeyDown={preventDialogEscapeWhileFullscreen}
                            >
                                <DialogHeader className="px-6 py-4 border-b">
                                    <DialogTitle>{documentCrud.editingItem ? "Edit Knowledge Document" : "Create Knowledge Document"}</DialogTitle>
                                    <DialogDescription>
                                        This is the durable layer that later powers retrieval, synthesis, and long-term memory.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Title</Label>
                                            <Input
                                                value={documentForm.title}
                                                onChange={(e) =>
                                                    setDocumentForm((prev) => ({
                                                        ...prev,
                                                        title: e.target.value,
                                                        doc_key: prev.doc_key || buildDocKey(prev.namespace, e.target.value),
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Namespace</Label>
                                            <Input
                                                value={documentForm.namespace}
                                                onChange={(e) =>
                                                    setDocumentForm((prev) => ({
                                                        ...prev,
                                                        namespace: e.target.value,
                                                        doc_key: buildDocKey(e.target.value, prev.title),
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Domain</Label>
                                            <Select value={documentForm.domain} onValueChange={(value) => setDocumentForm((prev) => ({ ...prev, domain: value }))}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{domainOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Doc Type</Label>
                                            <Input value={documentForm.doc_type} onChange={(e) => setDocumentForm((prev) => ({ ...prev, doc_type: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Version</Label>
                                            <Input value={documentForm.version} onChange={(e) => setDocumentForm((prev) => ({ ...prev, version: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Status</Label>
                                            <Select value={documentForm.status} onValueChange={(value) => setDocumentForm((prev) => ({ ...prev, status: value }))}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{documentStatusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Confidence</Label>
                                            <Input value={documentForm.confidence} onChange={(e) => setDocumentForm((prev) => ({ ...prev, confidence: e.target.value }))} />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Doc Key</Label>
                                        <Input value={documentForm.doc_key} onChange={(e) => setDocumentForm((prev) => ({ ...prev, doc_key: e.target.value }))} className="font-mono text-xs" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Tags JSON</Label>
                                            <Textarea value={documentForm.tags} onChange={(e) => setDocumentForm((prev) => ({ ...prev, tags: e.target.value }))} className="min-h-[90px] font-mono text-xs" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Scope JSON</Label>
                                            <Textarea value={documentForm.scope} onChange={(e) => setDocumentForm((prev) => ({ ...prev, scope: e.target.value }))} className="min-h-[90px] font-mono text-xs" />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Summary</Label>
                                        <Textarea value={documentForm.summary} onChange={(e) => setDocumentForm((prev) => ({ ...prev, summary: e.target.value }))} className="min-h-[110px]" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Content</Label>
                                        <MarkdownEditor
                                            value={documentForm.content}
                                            onChange={(value) => setDocumentForm((prev) => ({ ...prev, content: value }))}
                                            className="h-[360px]"
                                            templates={knowledgeDocumentTemplates}
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="px-6 py-4 border-t">
                                    <Button variant="outline" onClick={documentCrud.handleCloseDialog}>Cancel</Button>
                                    <Button onClick={saveDocument} disabled={documentCrud.isSaving}>{documentCrud.isSaving ? "Saving..." : "Save Knowledge Document"}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CrudLayout>
                </TabsContent>
            </Tabs>

            <Dialog open={promoteOpen} onOpenChange={(open) => {
                setPromoteOpen(open)
                if (!open) setPromotingRaw(null)
            }}>
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
                            <Input value={promoteForm.title} onChange={(e) => setPromoteForm((prev) => ({ ...prev, title: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Namespace</Label>
                                <Input value={promoteForm.namespace} onChange={(e) => setPromoteForm((prev) => ({ ...prev, namespace: e.target.value }))} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Doc Type</Label>
                                <Input value={promoteForm.doc_type} onChange={(e) => setPromoteForm((prev) => ({ ...prev, doc_type: e.target.value }))} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Doc Key</Label>
                            <Input value={promoteForm.doc_key} onChange={(e) => setPromoteForm((prev) => ({ ...prev, doc_key: e.target.value }))} className="font-mono text-xs" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label>Version</Label>
                                <Input value={promoteForm.version} onChange={(e) => setPromoteForm((prev) => ({ ...prev, version: e.target.value }))} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select value={promoteForm.status} onValueChange={(value) => setPromoteForm((prev) => ({ ...prev, status: value }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{documentStatusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Confidence</Label>
                                <Input value={promoteForm.confidence} onChange={(e) => setPromoteForm((prev) => ({ ...prev, confidence: e.target.value }))} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPromoteOpen(false)}>Cancel</Button>
                        <Button onClick={handlePromote} disabled={isPromoting}>{isPromoting ? "Promoting..." : "Promote to Document"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ListPageShell>
    )
}
