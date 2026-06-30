"use client"

import * as React from "react"
import useSWR, { useSWRConfig } from "swr"
import { BookOpen } from "lucide-react"
import { toast } from "sonner"

import { apiClient } from "@/lib/api"
import { useCrud, useCrudListRefresh } from "@/hooks/use-crud"
import { useDeleteAction } from "@/hooks/use-delete-action"
import { useMeta } from "@/hooks/use-meta"
import { CrudLayout } from "@/components/common/crud-layout"
import { ListPageShell } from "@/components/common/list-page-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type SearchFilterItem } from "@/components/common/query-filters"
import {
    buildKnowledgeCandidateColumns,
    buildKnowledgeChunkColumns,
    buildKnowledgeDocumentColumns,
    buildKnowledgeNamespaceColumns,
    buildKnowledgeRawColumns,
} from "@/components/knowledge/columns"
import { KnowledgeDocumentDialog } from "@/components/knowledge/document-dialog"
import {
    AcceptCandidateDialog,
    KnowledgeCandidateDraftDialog,
    KnowledgeNamespaceDialog,
    MergeCandidateDialog,
    QuickPublishSourceDialog,
    SimpleReasonDialog,
} from "@/components/knowledge/governance-dialogs"
import { KnowledgeRawDialog } from "@/components/knowledge/raw-dialog"
import {
    EMPTY_ACCEPT_CANDIDATE_FORM,
    EMPTY_CANDIDATE_FORM,
    EMPTY_DOCUMENT_FORM,
    EMPTY_MERGE_CANDIDATE_FORM,
    EMPTY_NAMESPACE_FORM,
    EMPTY_QUICK_PUBLISH_FORM,
    EMPTY_RAW_FORM,
    EMPTY_REJECT_CANDIDATE_FORM,
    acceptCandidateFormToPayload,
    acceptFormFromCandidate,
    candidateFormFromSource,
    candidateFormToPayload,
    documentFormToPayload,
    documentRecordToForm,
    namespaceFormToPayload,
    quickPublishFormFromRaw,
    quickPublishFormToPayload,
    namespaceRecordToForm,
    rawFormToPayload,
    rawRecordToForm,
    type AcceptCandidateFormState,
    type CandidateFormState,
    type DocumentFormState,
    type KnowledgeCandidateRecord,
    type KnowledgeChunkRecord,
    type KnowledgeDocumentRecord,
    type KnowledgeGovernanceSummary,
    type KnowledgeNamespaceRecord,
    type KnowledgeOptionsResponse,
    type KnowledgeRawRecord,
    type MergeCandidateFormState,
    type NamespaceFormState,
    type QuickPublishFormState,
    type RawFormState,
    type RejectCandidateFormState,
} from "@/lib/knowledge"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"

type CrudResponse<T> = {
    dataSource?: T[]
    total?: number
}

export default function KnowledgePage() {
    const deleteAction = useDeleteAction()
    const { getOptions, getLabel } = useMeta()
    const { mutate } = useSWRConfig()
    useWorkspaceTabTitle("/dashboard/knowledge", "Knowledge")

    const { data: options } = useSWR<KnowledgeOptionsResponse>("/knowledge/options", (url: string) =>
        apiClient.get(url).then((res) => res as KnowledgeOptionsResponse)
    )
    const { data: governance } = useSWR<KnowledgeGovernanceSummary>("/knowledge/governance/summary", (url: string) =>
        apiClient.get(url).then((res) => res as KnowledgeGovernanceSummary)
    )
    const { data: namespaceList } = useSWR<CrudResponse<KnowledgeNamespaceRecord>>(
        "/knowledge/namespace?limit=5000&orderBy=namespaceKey",
        (url: string) => apiClient.get(url).then((res) => res as CrudResponse<KnowledgeNamespaceRecord>)
    )

    const namespaceCrud = useCrud<KnowledgeNamespaceRecord>("/knowledge/namespace")
    const rawCrud = useCrud<KnowledgeRawRecord>("/knowledge/raw")
    const documentCrud = useCrud<KnowledgeDocumentRecord>("/knowledge/document")

    const refreshNamespaces = useCrudListRefresh("/knowledge/namespace")
    const refreshRaw = useCrudListRefresh("/knowledge/raw")
    const refreshCandidates = useCrudListRefresh("/knowledge/candidate")
    const refreshDocuments = useCrudListRefresh("/knowledge/document")
    const refreshChunks = useCrudListRefresh("/knowledge/chunk")

    const [namespaceForm, setNamespaceForm] = React.useState<NamespaceFormState>(EMPTY_NAMESPACE_FORM)
    const [rawForm, setRawForm] = React.useState<RawFormState>(EMPTY_RAW_FORM)
    const [documentForm, setDocumentForm] = React.useState<DocumentFormState>(EMPTY_DOCUMENT_FORM)
    const [candidateForm, setCandidateForm] = React.useState<CandidateFormState>(EMPTY_CANDIDATE_FORM)
    const [candidateSource, setCandidateSource] = React.useState<KnowledgeRawRecord | null>(null)
    const [candidateDialogOpen, setCandidateDialogOpen] = React.useState(false)
    const [quickPublishForm, setQuickPublishForm] = React.useState<QuickPublishFormState>(EMPTY_QUICK_PUBLISH_FORM)
    const [quickPublishSource, setQuickPublishSource] = React.useState<KnowledgeRawRecord | null>(null)
    const [quickPublishOpen, setQuickPublishOpen] = React.useState(false)
    const [acceptForm, setAcceptForm] = React.useState<AcceptCandidateFormState>(EMPTY_ACCEPT_CANDIDATE_FORM)
    const [rejectForm, setRejectForm] = React.useState<RejectCandidateFormState>(EMPTY_REJECT_CANDIDATE_FORM)
    const [mergeForm, setMergeForm] = React.useState<MergeCandidateFormState>(EMPTY_MERGE_CANDIDATE_FORM)
    const [reviewCandidate, setReviewCandidate] = React.useState<KnowledgeCandidateRecord | null>(null)
    const [acceptOpen, setAcceptOpen] = React.useState(false)
    const [rejectOpen, setRejectOpen] = React.useState(false)
    const [mergeOpen, setMergeOpen] = React.useState(false)
    const [archiveDocument, setArchiveDocument] = React.useState<KnowledgeDocumentRecord | null>(null)
    const [archiveReason, setArchiveReason] = React.useState("")
    const [archiveOpen, setArchiveOpen] = React.useState(false)
    const [isActionSaving, setIsActionSaving] = React.useState(false)

    const namespaceStatusOptions = getOptions("KnowledgeNamespace", "STATUS_NAME_MAPPING").map((option) => ({
        label: String(option.label),
        value: String(option.value),
    }))
    const rawStatusOptions = getOptions("KnowledgeSourceInput", "STATUS_NAME_MAPPING").map((option) => ({
        label: String(option.label),
        value: String(option.value),
    }))
    const sourceTypeOptions = getOptions("KnowledgeSourceInput", "SOURCE_TYP_NAME_MAPPING").map((option) => ({
        label: String(option.label),
        value: String(option.value),
    }))
    const documentStatusOptions = getOptions("KnowledgeDocument", "STATUS_NAME_MAPPING").map((option) => ({
        label: String(option.label),
        value: String(option.value),
    }))
    const candidateStatusOptions = getOptions("KnowledgeCandidate", "STATUS_NAME_MAPPING").map((option) => ({
        label: String(option.label),
        value: String(option.value),
    }))
    const chunkStatusOptions = getOptions("KnowledgeChunk", "STATUS_NAME_MAPPING").map((option) => ({
        label: String(option.label),
        value: String(option.value),
    }))

    const namespaces = namespaceList?.dataSource || []
    const activeNamespaces = namespaces.filter((namespace) => Number(namespace.status) === 10)

    React.useEffect(() => {
        const defaults = options?.defaults
        if (!defaults) return
        setRawForm((prev) => ({
            ...prev,
            sourceTyp: String(defaults.sourceTyp ?? 0),
            status: String(defaults.sourceInputStatus ?? 0),
        }))
        setDocumentForm((prev) => ({
            ...prev,
            status: String(defaults.documentStatus ?? 0),
            confidence: defaults.confidence ?? "medium",
        }))
    }, [options])

    React.useEffect(() => {
        if (!namespaceCrud.isDialogOpen) return
        if (namespaceCrud.editingItem) {
            setNamespaceForm(namespaceRecordToForm(namespaceCrud.editingItem))
            return
        }
        setNamespaceForm(EMPTY_NAMESPACE_FORM)
    }, [namespaceCrud.isDialogOpen, namespaceCrud.editingItem])

    React.useEffect(() => {
        if (!rawCrud.isDialogOpen) return
        if (rawCrud.editingItem) {
            setRawForm(rawRecordToForm(rawCrud.editingItem))
            return
        }
        setRawForm((prev) => ({
            ...EMPTY_RAW_FORM,
            sourceTyp: prev.sourceTyp,
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
            status: prev.status,
            confidence: prev.confidence,
        }))
    }, [documentCrud.isDialogOpen, documentCrud.editingItem])

    const namespaceFilterItems: SearchFilterItem[] = React.useMemo(
        () => [
            { key: "namespaceKey", label: "Key", type: "text" },
            {
                key: "status",
                label: "Status",
                type: "number",
                options: namespaceStatusOptions.map(({ label, value }) => ({ label, value: Number(value) })),
            },
        ],
        [namespaceStatusOptions]
    )
    const rawFilterItems: SearchFilterItem[] = React.useMemo(
        () => [
            { key: "title", label: "Title", type: "text" },
            {
                key: "status",
                label: "Status",
                type: "number",
                options: rawStatusOptions.map(({ label, value }) => ({ label, value: Number(value) })),
            },
        ],
        [rawStatusOptions]
    )
    const documentFilterItems: SearchFilterItem[] = React.useMemo(
        () => [
            { key: "title", label: "Title", type: "text" },
            { key: "docTyp", label: "Doc Type", type: "text" },
            {
                key: "status",
                label: "Status",
                type: "number",
                options: documentStatusOptions.map(({ label, value }) => ({ label, value: Number(value) })),
            },
        ],
        [documentStatusOptions]
    )
    const candidateFilterItems: SearchFilterItem[] = React.useMemo(
        () => [
            { key: "title", label: "Title", type: "text" },
            { key: "docTyp", label: "Doc Type", type: "text" },
            {
                key: "status",
                label: "Status",
                type: "number",
                options: candidateStatusOptions.map(({ label, value }) => ({ label, value: Number(value) })),
            },
        ],
        [candidateStatusOptions]
    )
    const chunkFilterItems: SearchFilterItem[] = React.useMemo(
        () => [
            { key: "documentId", label: "Document ID", type: "number" },
            {
                key: "status",
                label: "Status",
                type: "number",
                options: chunkStatusOptions.map(({ label, value }) => ({ label, value: Number(value) })),
            },
        ],
        [chunkStatusOptions]
    )

    const refreshKnowledgeState = React.useCallback(async () => {
        await Promise.all([
            refreshNamespaces(),
            refreshRaw(),
            refreshCandidates(),
            refreshDocuments(),
            refreshChunks(),
            mutate("/knowledge/governance/summary"),
            mutate("/knowledge/namespace?limit=5000&orderBy=namespaceKey"),
        ])
    }, [mutate, refreshCandidates, refreshChunks, refreshDocuments, refreshNamespaces, refreshRaw])

    const saveNamespace = async () => {
        await namespaceCrud.handleSave(namespaceFormToPayload(namespaceForm))
        await refreshKnowledgeState()
    }
    const saveRaw = async () => {
        await rawCrud.handleSave(rawFormToPayload(rawForm))
        await refreshKnowledgeState()
    }
    const saveDocument = async () => {
        await documentCrud.handleSave(documentFormToPayload(documentForm))
        await refreshKnowledgeState()
    }

    const runInduction = React.useCallback(async (source: KnowledgeRawRecord) => {
        try {
            await apiClient.post(`/knowledge/source/${source.id}/induce`, {
                namespaceHints: source.namespaceSuggestions || [],
            })
            toast.success("Candidates induced from source")
            await refreshKnowledgeState()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to induce candidates")
        }
    }, [refreshKnowledgeState])

    const quickPublishSourceInput = async () => {
        if (!quickPublishSource) return
        try {
            setIsActionSaving(true)
            const result = await apiClient.post(`/knowledge/source/${quickPublishSource.id}/quick-publish`, quickPublishFormToPayload(quickPublishForm)) as {
                indexSync?: { synced?: boolean; reason?: string }
            }
            const indexSync = result.indexSync
            if (indexSync?.synced === false) {
                toast.warning(`Source published, index sync ${indexSync.reason || "failed"}`)
            } else {
                toast.success("Source published")
            }
            setQuickPublishOpen(false)
            setQuickPublishSource(null)
            await refreshKnowledgeState()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to publish source")
        } finally {
            setIsActionSaving(false)
        }
    }

    const saveCandidateDraft = async () => {
        if (!candidateSource) return
        try {
            setIsActionSaving(true)
            await apiClient.post(`/knowledge/source/${candidateSource.id}/candidate`, candidateFormToPayload(candidateForm))
            toast.success("Candidate created")
            setCandidateDialogOpen(false)
            setCandidateSource(null)
            await refreshKnowledgeState()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create candidate")
        } finally {
            setIsActionSaving(false)
        }
    }

    const acceptCandidate = async () => {
        if (!reviewCandidate) return
        try {
            setIsActionSaving(true)
            await apiClient.post(`/knowledge/candidate/${reviewCandidate.id}/accept`, acceptCandidateFormToPayload(acceptForm))
            toast.success("Candidate accepted")
            setAcceptOpen(false)
            setReviewCandidate(null)
            await refreshKnowledgeState()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to accept candidate")
        } finally {
            setIsActionSaving(false)
        }
    }

    const rejectCandidate = async () => {
        if (!reviewCandidate) return
        try {
            setIsActionSaving(true)
            await apiClient.post(`/knowledge/candidate/${reviewCandidate.id}/reject`, { reason: rejectForm.reason })
            toast.success("Candidate rejected")
            setRejectOpen(false)
            setReviewCandidate(null)
            await refreshKnowledgeState()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to reject candidate")
        } finally {
            setIsActionSaving(false)
        }
    }

    const mergeCandidate = async () => {
        if (!reviewCandidate) return
        try {
            setIsActionSaving(true)
            await apiClient.post(`/knowledge/candidate/${reviewCandidate.id}/merge`, {
                targetCandidateId: mergeForm.targetCandidateId ? Number(mergeForm.targetCandidateId) : undefined,
                targetDocKey: mergeForm.targetDocKey || undefined,
                reason: mergeForm.reason || undefined,
            })
            toast.success("Candidate merged")
            setMergeOpen(false)
            setReviewCandidate(null)
            await refreshKnowledgeState()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to merge candidate")
        } finally {
            setIsActionSaving(false)
        }
    }

    const archiveSelectedDocument = async () => {
        if (!archiveDocument) return
        try {
            setIsActionSaving(true)
            await apiClient.post(`/knowledge/document/${archiveDocument.id}/archive`, { reason: archiveReason || undefined })
            toast.success("Document archived")
            setArchiveOpen(false)
            setArchiveDocument(null)
            setArchiveReason("")
            await refreshKnowledgeState()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to archive document")
        } finally {
            setIsActionSaving(false)
        }
    }

    const namespaceColumns = React.useMemo(
        () =>
            buildKnowledgeNamespaceColumns({
                getLabel,
                governance,
                onEdit: namespaceCrud.handleOpenDialog,
                onArchive: async (item) => {
                    await apiClient.post(`/knowledge/namespace/${item.id}/archive`, {})
                    toast.success("Namespace archived")
                    await refreshKnowledgeState()
                },
                onReactivate: async (item) => {
                    await apiClient.post(`/knowledge/namespace/${item.id}/reactivate`, {})
                    toast.success("Namespace reactivated")
                    await refreshKnowledgeState()
                },
            }),
        [getLabel, governance, namespaceCrud.handleOpenDialog, refreshKnowledgeState],
    )
    const rawColumns = React.useMemo(
        () =>
            buildKnowledgeRawColumns({
                getLabel,
                onCreateCandidate: (item) => {
                    setCandidateSource(item)
                    setCandidateForm(candidateFormFromSource(item))
                    setCandidateDialogOpen(true)
                },
                onInduce: runInduction,
                onQuickPublish: (item) => {
                    setQuickPublishSource(item)
                    setQuickPublishForm(quickPublishFormFromRaw(item, options?.defaults))
                    setQuickPublishOpen(true)
                },
                onEdit: rawCrud.handleOpenDialog,
                onDelete: async (item) => {
                    await deleteAction.remove("/knowledge/raw", item.id, {
                        successMessage: "Source input deleted successfully",
                        errorMessage: "Failed to delete source input",
                        onSuccess: refreshKnowledgeState,
                    })
                },
            }),
        [deleteAction, getLabel, options?.defaults, rawCrud.handleOpenDialog, refreshKnowledgeState, runInduction],
    )
    const documentColumns = React.useMemo(
        () =>
            buildKnowledgeDocumentColumns({
                getLabel,
                onEdit: documentCrud.handleOpenDialog,
                onArchive: async (item) => {
                    setArchiveDocument(item)
                    setArchiveReason("")
                    setArchiveOpen(true)
                },
                onRegenerate: async (item) => {
                    await apiClient.post(`/knowledge/document/${item.id}/regenerate-chunks`, {})
                    toast.success("Chunks regenerated")
                    await refreshKnowledgeState()
                },
                onSync: async (item) => {
                    await apiClient.post(`/knowledge/document/${item.id}/sync-index`, {})
                    toast.success("Index sync requested")
                    await refreshKnowledgeState()
                },
            }),
        [documentCrud.handleOpenDialog, getLabel, refreshKnowledgeState],
    )
    const candidateColumns = React.useMemo(
        () =>
            buildKnowledgeCandidateColumns({
                getLabel,
                onAccept: (item) => {
                    setReviewCandidate(item)
                    setAcceptForm(acceptFormFromCandidate(item, options?.defaults))
                    setAcceptOpen(true)
                },
                onReject: (item) => {
                    setReviewCandidate(item)
                    setRejectForm(EMPTY_REJECT_CANDIDATE_FORM)
                    setRejectOpen(true)
                },
                onMerge: (item) => {
                    setReviewCandidate(item)
                    setMergeForm(EMPTY_MERGE_CANDIDATE_FORM)
                    setMergeOpen(true)
                },
            }),
        [getLabel, options?.defaults],
    )
    const chunkColumns = React.useMemo(
        () => buildKnowledgeChunkColumns({ getLabel }),
        [getLabel],
    )

    return (
        <ListPageShell title="Knowledge" icon={BookOpen}>
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="namespaces">Namespaces</TabsTrigger>
                    <TabsTrigger value="sources">Sources</TabsTrigger>
                    <TabsTrigger value="candidates">Candidates</TabsTrigger>
                    <TabsTrigger value="library">Library</TabsTrigger>
                    <TabsTrigger value="chunks">Chunks</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <GovernanceOverview governance={governance} onRefresh={refreshKnowledgeState} />
                </TabsContent>

                <TabsContent value="namespaces" className="space-y-4">
                    <CrudLayout<KnowledgeNamespaceRecord>
                        embedded
                        title="Namespace Registry"
                        endpoint="/knowledge/namespace"
                        columns={namespaceColumns}
                        filterItems={namespaceFilterItems}
                        storageKey="knowledge-namespace-filters"
                        addButtonLabel="New Namespace"
                        onAdd={() => namespaceCrud.handleOpenDialog()}
                    >
                        <KnowledgeNamespaceDialog
                            open={namespaceCrud.isDialogOpen}
                            isEditing={!!namespaceCrud.editingItem}
                            isSaving={namespaceCrud.isSaving}
                            form={namespaceForm}
                            statusOptions={namespaceStatusOptions}
                            onOpenChange={(open) => !open && namespaceCrud.handleCloseDialog()}
                            onFormChange={setNamespaceForm}
                            onCancel={namespaceCrud.handleCloseDialog}
                            onSave={saveNamespace}
                        />
                    </CrudLayout>
                </TabsContent>

                <TabsContent value="sources" className="space-y-4">
                    <CrudLayout<KnowledgeRawRecord>
                        embedded
                        title="Source Inputs"
                        endpoint="/knowledge/raw"
                        columns={rawColumns}
                        filterItems={rawFilterItems}
                        storageKey="knowledge-source-filters"
                        addButtonLabel="New Source"
                        onAdd={() => rawCrud.handleOpenDialog()}
                    >
                        <KnowledgeRawDialog
                            open={rawCrud.isDialogOpen}
                            isEditing={!!rawCrud.editingItem}
                            isSaving={rawCrud.isSaving}
                            form={rawForm}
                            sourceTypeOptions={sourceTypeOptions}
                            statusOptions={rawStatusOptions}
                            activeNamespaces={activeNamespaces}
                            onOpenChange={(open) => !open && rawCrud.handleCloseDialog()}
                            onFormChange={setRawForm}
                            onCancel={rawCrud.handleCloseDialog}
                            onSave={saveRaw}
                        />
                    </CrudLayout>
                </TabsContent>

                <TabsContent value="candidates" className="space-y-4">
                    <CrudLayout<KnowledgeCandidateRecord>
                        embedded
                        title="Candidate Review"
                        endpoint="/knowledge/candidate"
                        columns={candidateColumns}
                        filterItems={candidateFilterItems}
                        storageKey="knowledge-candidate-filters"
                    />
                </TabsContent>

                <TabsContent value="library" className="space-y-4">
                    <CrudLayout<KnowledgeDocumentRecord>
                        embedded
                        title="Knowledge Library"
                        endpoint="/knowledge/document"
                        columns={documentColumns}
                        filterItems={documentFilterItems}
                        storageKey="knowledge-document-filters"
                    >
                        <KnowledgeDocumentDialog
                            open={documentCrud.isDialogOpen}
                            isEditing={!!documentCrud.editingItem}
                            isSaving={documentCrud.isSaving}
                            form={documentForm}
                            statusOptions={documentStatusOptions}
                            onOpenChange={(open) => !open && documentCrud.handleCloseDialog()}
                            onFormChange={setDocumentForm}
                            onCancel={documentCrud.handleCloseDialog}
                            onSave={saveDocument}
                        />
                    </CrudLayout>
                </TabsContent>

                <TabsContent value="chunks" className="space-y-4">
                    <CrudLayout<KnowledgeChunkRecord>
                        embedded
                        title="Active Retrieval Chunks"
                        description="Defaults to active chunks; adjust Status to inspect stale historical projections."
                        endpoint="/knowledge/chunk"
                        columns={chunkColumns}
                        filterItems={chunkFilterItems}
                        storageKey="knowledge-active-chunk-filters"
                        defaultFilters={{ status: { in: [10] } }}
                    />
                </TabsContent>
            </Tabs>

            <KnowledgeCandidateDraftDialog
                open={candidateDialogOpen}
                isSaving={isActionSaving}
                form={candidateForm}
                activeNamespaces={activeNamespaces}
                onOpenChange={(open) => {
                    setCandidateDialogOpen(open)
                    if (!open) setCandidateSource(null)
                }}
                onFormChange={setCandidateForm}
                onCancel={() => {
                    setCandidateDialogOpen(false)
                    setCandidateSource(null)
                }}
                onSave={saveCandidateDraft}
            />
            <QuickPublishSourceDialog
                open={quickPublishOpen}
                isSaving={isActionSaving}
                form={quickPublishForm}
                activeNamespaces={activeNamespaces}
                statusOptions={documentStatusOptions}
                onOpenChange={(open) => {
                    setQuickPublishOpen(open)
                    if (!open) setQuickPublishSource(null)
                }}
                onFormChange={setQuickPublishForm}
                onCancel={() => {
                    setQuickPublishOpen(false)
                    setQuickPublishSource(null)
                }}
                onPublish={quickPublishSourceInput}
            />
            <AcceptCandidateDialog
                open={acceptOpen}
                isSaving={isActionSaving}
                form={acceptForm}
                activeNamespaces={activeNamespaces}
                statusOptions={documentStatusOptions}
                onOpenChange={(open) => {
                    setAcceptOpen(open)
                    if (!open) setReviewCandidate(null)
                }}
                onFormChange={setAcceptForm}
                onCancel={() => {
                    setAcceptOpen(false)
                    setReviewCandidate(null)
                }}
                onAccept={acceptCandidate}
            />
            <SimpleReasonDialog
                open={rejectOpen}
                title="Reject Candidate"
                description="Reject this candidate and keep the review outcome immutable."
                actionLabel="Reject Candidate"
                isSaving={isActionSaving}
                reason={rejectForm.reason}
                onReasonChange={(reason) => setRejectForm({ reason })}
                onOpenChange={(open) => {
                    setRejectOpen(open)
                    if (!open) setReviewCandidate(null)
                }}
                onCancel={() => {
                    setRejectOpen(false)
                    setReviewCandidate(null)
                }}
                onAction={rejectCandidate}
            />
            <MergeCandidateDialog
                open={mergeOpen}
                isSaving={isActionSaving}
                form={mergeForm}
                onOpenChange={(open) => {
                    setMergeOpen(open)
                    if (!open) setReviewCandidate(null)
                }}
                onFormChange={setMergeForm}
                onCancel={() => {
                    setMergeOpen(false)
                    setReviewCandidate(null)
                }}
                onMerge={mergeCandidate}
            />
            <SimpleReasonDialog
                open={archiveOpen}
                title="Archive Document"
                description="Archiving makes active chunks stale and removes the document from active retrieval."
                actionLabel="Archive Document"
                isSaving={isActionSaving}
                reason={archiveReason}
                onReasonChange={setArchiveReason}
                onOpenChange={(open) => {
                    setArchiveOpen(open)
                    if (!open) setArchiveDocument(null)
                }}
                onCancel={() => {
                    setArchiveOpen(false)
                    setArchiveDocument(null)
                }}
                onAction={archiveSelectedDocument}
            />
        </ListPageShell>
    )
}

function GovernanceOverview({
    governance,
    onRefresh,
}: {
    governance?: KnowledgeGovernanceSummary
    onRefresh: () => void
}) {
    const counts = governance?.counts || {}
    const cards = [
        ["Namespaces", counts.namespaces || 0],
        ["Active docs", counts.activeDocuments || 0],
        ["Orphan docs", counts.orphanActiveDocuments || 0],
        ["Pending candidates", counts.pendingCandidates || 0],
        ["Invalid suggestions", (counts.invalidCandidateSuggestions || 0) + (counts.invalidSourceSuggestions || 0)],
        ["Stale chunks", counts.staleChunks || 0],
    ] as const
    return (
        <div className="grid gap-4">
            <div className="flex items-center justify-end">
                <Button variant="outline" onClick={onRefresh}>Refresh</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                {cards.map(([label, value]) => (
                    <div key={label} className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">{label}</div>
                        <div className="mt-1 text-2xl font-semibold">{value}</div>
                    </div>
                ))}
            </div>
            <RiskList title="Orphan active documents" items={governance?.orphanActiveDocuments || []} />
            <RiskList title="Invalid document namespaces" items={governance?.invalidDocumentNamespaces || []} />
            <RiskList title="Invalid candidate namespace suggestions" items={governance?.invalidCandidateSuggestions || []} />
            <RiskList title="Invalid source namespace suggestions" items={governance?.invalidSourceSuggestions || []} />
        </div>
    )
}

function RiskList({ title, items }: { title: string; items: Array<Record<string, unknown>> }) {
    return (
        <div className="rounded-md border">
            <div className="flex items-center justify-between border-b px-3 py-2">
                <div className="text-sm font-medium">{title}</div>
                <Badge variant={items.length ? "destructive" : "secondary"}>{items.length}</Badge>
            </div>
            <div className="divide-y">
                {items.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-muted-foreground">No issues.</div>
                ) : null}
                {items.slice(0, 8).map((item, index) => (
                    <div key={`${title}-${index}`} className="grid gap-1 px-3 py-2 text-sm">
                        <div className="font-medium">{String(item.title || item.docKey || item.namespaceKey || item.id || "-")}</div>
                        <div className="font-mono text-xs text-muted-foreground">{JSON.stringify(item)}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
