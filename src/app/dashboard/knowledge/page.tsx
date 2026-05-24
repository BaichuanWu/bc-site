"use client"

import * as React from "react"
import useSWR from "swr"
import { BookOpen } from "lucide-react"
import { toast } from "sonner"

import { apiClient } from "@/lib/api"
import { useCrud } from "@/hooks/use-crud"
import { useDeleteAction } from "@/hooks/use-delete-action"
import { useMeta } from "@/hooks/use-meta"
import { CrudLayout } from "@/components/common/crud-layout"
import { ListPageShell } from "@/components/common/list-page-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { buildKnowledgeDocumentColumns, buildKnowledgeRawColumns } from "@/components/knowledge/columns"
import { KnowledgeDocumentDialog } from "@/components/knowledge/document-dialog"
import { KnowledgePromoteDialog } from "@/components/knowledge/promote-dialog"
import { KnowledgeRawDialog } from "@/components/knowledge/raw-dialog"
import {
    EMPTY_DOCUMENT_FORM,
    EMPTY_PROMOTE_FORM,
    EMPTY_RAW_FORM,
    buildKnowledgeDocKey,
    documentFormToPayload,
    documentRecordToForm,
    promoteFormFromRaw,
    rawFormToPayload,
    rawRecordToForm,
    type DocumentFormState,
    type KnowledgeDocumentRecord,
    type KnowledgeOptionsResponse,
    type KnowledgeRawRecord,
    type PromoteFormState,
    type RawFormState,
} from "@/lib/knowledge"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"

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
            sourceType: String(defaults.sourceType ?? 0),
            contentType: String(defaults.contentType ?? 0),
            status: String(defaults.rawStatus ?? 0),
        }))
        setDocumentForm((prev) => ({
            ...prev,
            domain: String(defaults.domain ?? 0),
            status: String(defaults.documentStatus ?? 0),
            confidence: defaults.confidence ?? "medium",
        }))
        setPromoteForm((prev) => ({
            ...prev,
            status: String(defaults.documentStatus ?? 0),
            confidence: defaults.confidence ?? "medium",
        }))
    }, [options])

    React.useEffect(() => {
        if (!rawCrud.isDialogOpen) return
        if (rawCrud.editingItem) {
            setRawForm(rawRecordToForm(rawCrud.editingItem))
            return
        }
        setRawForm((prev) => ({
            ...EMPTY_RAW_FORM,
            domain: prev.domain,
            sourceType: prev.sourceType,
            contentType: prev.contentType,
            status: prev.status,
        }))
    }, [rawCrud.isDialogOpen, rawCrud.editingItem])

    React.useEffect(() => {
        if (!documentCrud.isDialogOpen) return
        if (documentCrud.editingItem) {
            setDocumentForm(documentRecordToForm(documentCrud.editingItem))
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

    const rawColumns = React.useMemo(
        () =>
            buildKnowledgeRawColumns({
                getLabel,
                onPromote: (item) => {
                    setPromotingRaw(item)
                    setPromoteForm(promoteFormFromRaw(item, options?.defaults))
                    setPromoteOpen(true)
                },
                onEdit: rawCrud.handleOpenDialog,
                onDelete: async (item) => {
                    await deleteAction.remove("/knowledge/raw", item.id, {
                        successMessage: "Raw knowledge deleted successfully",
                        errorMessage: "Failed to delete raw knowledge",
                        onSuccess: async () => {
                            await rawCrud.mutate()
                        },
                    })
                },
            }),
        [deleteAction, getLabel, options?.defaults, rawCrud],
    )

    const documentColumns = React.useMemo(
        () =>
            buildKnowledgeDocumentColumns({
                getLabel,
                onEdit: documentCrud.handleOpenDialog,
                onDelete: async (item) => {
                    await deleteAction.remove("/knowledge/document", item.id, {
                        successMessage: "Knowledge document deleted successfully",
                        errorMessage: "Failed to delete knowledge document",
                        onSuccess: async () => {
                            await documentCrud.mutate()
                        },
                    })
                },
            }),
        [deleteAction, documentCrud, getLabel],
    )

    const saveRaw = async () => {
        await rawCrud.handleSave(rawFormToPayload(rawForm))
    }

    const saveDocument = async () => {
        await documentCrud.handleSave(documentFormToPayload(documentForm))
    }

    const handlePromote = async () => {
        if (!promotingRaw) return
        try {
            setIsPromoting(true)
            await apiClient.post(`/knowledge/raw/${promotingRaw.id}/promote`, {
                title: promoteForm.title || undefined,
                namespace: promoteForm.namespace,
                docType: promoteForm.docType,
                docKey: promoteForm.docKey || buildKnowledgeDocKey(promoteForm.namespace, promoteForm.title || promotingRaw.title),
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
                        <KnowledgeRawDialog
                            open={rawCrud.isDialogOpen}
                            isEditing={!!rawCrud.editingItem}
                            isSaving={rawCrud.isSaving}
                            form={rawForm}
                            domainOptions={domainOptions}
                            sourceTypeOptions={sourceTypeOptions}
                            contentTypeOptions={contentTypeOptions}
                            statusOptions={rawStatusOptions}
                            onOpenChange={(open) => !open && rawCrud.handleCloseDialog()}
                            onFormChange={setRawForm}
                            onCancel={rawCrud.handleCloseDialog}
                            onSave={saveRaw}
                        />
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
                        <KnowledgeDocumentDialog
                            open={documentCrud.isDialogOpen}
                            isEditing={!!documentCrud.editingItem}
                            isSaving={documentCrud.isSaving}
                            form={documentForm}
                            domainOptions={domainOptions}
                            statusOptions={documentStatusOptions}
                            onOpenChange={(open) => !open && documentCrud.handleCloseDialog()}
                            onFormChange={setDocumentForm}
                            onCancel={documentCrud.handleCloseDialog}
                            onSave={saveDocument}
                        />
                    </CrudLayout>
                </TabsContent>
            </Tabs>

            <KnowledgePromoteDialog
                open={promoteOpen}
                isPromoting={isPromoting}
                form={promoteForm}
                statusOptions={documentStatusOptions}
                onOpenChange={(open) => {
                    setPromoteOpen(open)
                    if (!open) setPromotingRaw(null)
                }}
                onFormChange={setPromoteForm}
                onPromote={handlePromote}
            />
        </ListPageShell>
    )
}
