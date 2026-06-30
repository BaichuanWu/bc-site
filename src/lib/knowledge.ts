import { formatJsonText, parseJsonText } from "@/lib/json-utils"

export type KnowledgeOptionsResponse = {
    defaults?: {
        sourceTyp?: number
        sourceInputStatus?: number
        documentStatus?: number
        confidence?: string
    }
}

export type KnowledgeNamespaceRecord = {
    id: number
    namespaceKey: string
    title: string
    description?: string
    status: number
    updateTime?: string
}

export type KnowledgeRawRecord = {
    id: number
    title: string
    summary?: string
    content?: string
    sourceTyp: number
    status: number
    sourceRefs?: string[]
    namespaceSuggestions?: string[]
    metadataJson?: Record<string, unknown>
    submittedTime?: string
    reviewedTime?: string
    updateTime?: string
}

export type KnowledgeDocumentRecord = {
    id: number
    docKey: string
    version: string
    title: string
    summary?: string
    content?: string
    docTyp: string
    confidence?: string
    status: number
    sourceInputIds?: number[]
    candidateIds?: number[]
    metadataJson?: Record<string, unknown>
    publishedTime?: string
    archivedTime?: string
    updateTime?: string
}

export type KnowledgeCandidateRecord = {
    id: number
    title: string
    summary?: string
    content?: string
    docTyp: string
    confidence?: string
    status: number
    actionTyp: number
    targetDocKey?: string
    targetDocumentId?: number
    sourceInputIds?: number[]
    agentExecutionId?: number
    proposedNamespaceKeys?: string[]
    proposedNewNamespaces?: Record<string, unknown>[]
    metadataJson?: Record<string, unknown>
    reviewedTime?: string
    updateTime?: string
}

export type KnowledgeChunkRecord = {
    id: number
    documentId: number
    chunkNo: number
    status: number
    chunkText?: string
    tokenCount?: number
    heading?: string
    sectionPath?: string[]
    sourceSpan?: Record<string, unknown>
    metadataJson?: Record<string, unknown>
    updateTime?: string
}

export type KnowledgeGovernanceSummary = {
    counts?: {
        namespaces?: number
        activeDocuments?: number
        orphanActiveDocuments?: number
        invalidDocumentNamespaces?: number
        pendingCandidates?: number
        invalidCandidateSuggestions?: number
        sourceInputs?: number
        invalidSourceSuggestions?: number
        staleChunks?: number
    }
    namespaceRefCounts?: Array<{
        namespaceKey: string
        title?: string
        status: number
        documentRefs: number
    }>
    orphanActiveDocuments?: Array<Record<string, unknown>>
    invalidDocumentNamespaces?: Array<Record<string, unknown>>
    invalidCandidateSuggestions?: Array<Record<string, unknown>>
    invalidSourceSuggestions?: Array<Record<string, unknown>>
    staleChunks?: Array<Record<string, unknown>>
}

export type RawFormState = {
    title: string
    sourceTyp: string
    status: string
    summary: string
    content: string
    sourceRefs: string
    namespaceSuggestions: string
    metadataJson: string
}

export type DocumentFormState = {
    title: string
    namespace: string
    docTyp: string
    docKey: string
    version: string
    status: string
    summary: string
    content: string
    confidence: string
    metadataJson: string
}

export type PromoteFormState = {
    title: string
    namespace: string
    docTyp: string
    docKey: string
    version: string
    status: string
    confidence: string
}

export type QuickPublishFormState = {
    title: string
    namespaceKeys: string[]
    docTyp: string
    docKey: string
    version: string
    status: string
    confidence: string
    summary: string
    content: string
    metadata: string
}

export type NamespaceFormState = {
    namespaceKey: string
    title: string
    description: string
    status: string
}

export type CandidateFormState = {
    title: string
    docTyp: string
    targetDocKey: string
    confidence: string
    proposedNamespaceKeys: string[]
    proposedNewNamespaces: string
    summary: string
    content: string
    metadataJson: string
}

export type AcceptCandidateFormState = {
    namespaceKeys: string[]
    docKey: string
    version: string
    status: string
    metadataPatch: string
}

export type RejectCandidateFormState = {
    reason: string
}

export type MergeCandidateFormState = {
    targetCandidateId: string
    targetDocKey: string
    reason: string
}

export const EMPTY_RAW_FORM: RawFormState = {
    title: "",
    sourceTyp: "0",
    status: "0",
    summary: "",
    content: "",
    sourceRefs: "[]",
    namespaceSuggestions: "[]",
    metadataJson: "{}",
}

export const EMPTY_NAMESPACE_FORM: NamespaceFormState = {
    namespaceKey: "",
    title: "",
    description: "",
    status: "10",
}

export const EMPTY_DOCUMENT_FORM: DocumentFormState = {
    title: "",
    namespace: "general",
    docTyp: "note",
    docKey: "",
    version: "1.0.0",
    status: "0",
    summary: "",
    content: "",
    confidence: "medium",
    metadataJson: "{}",
}

export const EMPTY_CANDIDATE_FORM: CandidateFormState = {
    title: "",
    docTyp: "note",
    targetDocKey: "",
    confidence: "medium",
    proposedNamespaceKeys: [],
    proposedNewNamespaces: "[]",
    summary: "",
    content: "",
    metadataJson: "{}",
}

export const EMPTY_ACCEPT_CANDIDATE_FORM: AcceptCandidateFormState = {
    namespaceKeys: [],
    docKey: "",
    version: "",
    status: "10",
    metadataPatch: "{}",
}

export const EMPTY_REJECT_CANDIDATE_FORM: RejectCandidateFormState = {
    reason: "",
}

export const EMPTY_MERGE_CANDIDATE_FORM: MergeCandidateFormState = {
    targetCandidateId: "",
    targetDocKey: "",
    reason: "",
}

export const EMPTY_PROMOTE_FORM: PromoteFormState = {
    title: "",
    namespace: "general",
    docTyp: "note",
    docKey: "",
    version: "1.0.0",
    status: "0",
    confidence: "medium",
}

export const EMPTY_QUICK_PUBLISH_FORM: QuickPublishFormState = {
    title: "",
    namespaceKeys: [],
    docTyp: "note",
    docKey: "",
    version: "",
    status: "10",
    confidence: "medium",
    summary: "",
    content: "",
    metadata: "{}",
}

export function buildKnowledgeDocKey(namespace: string, title: string) {
    const slug = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    return `${namespace || "general"}:${slug || "knowledge-doc"}`
}

export function namespaceRecordToForm(item: KnowledgeNamespaceRecord): NamespaceFormState {
    return {
        namespaceKey: item.namespaceKey || "",
        title: item.title || "",
        description: item.description || "",
        status: String(item.status ?? 10),
    }
}

export function namespaceFormToPayload(form: NamespaceFormState): Partial<KnowledgeNamespaceRecord> {
    return {
        namespaceKey: form.namespaceKey,
        title: form.title,
        description: form.description,
        status: Number(form.status || 10),
    }
}

export function rawRecordToForm(item: KnowledgeRawRecord): RawFormState {
    return {
        title: item.title || "",
        sourceTyp: String(item.sourceTyp ?? 0),
        status: String(item.status ?? 0),
        summary: item.summary || "",
        content: item.content || "",
        sourceRefs: formatJsonText(item.sourceRefs ?? [], "[]"),
        namespaceSuggestions: formatJsonText(item.namespaceSuggestions ?? [], "[]"),
        metadataJson: formatJsonText(item.metadataJson ?? {}, "{}"),
    }
}

export function documentRecordToForm(
    item: KnowledgeDocumentRecord,
): DocumentFormState {
    const metadata = item.metadataJson ?? {}
    const namespaceKeys = Array.isArray(metadata.acceptedNamespaceKeys)
        ? metadata.acceptedNamespaceKeys
        : []
    return {
        title: item.title || "",
        namespace: String(namespaceKeys[0] || "general"),
        docTyp: item.docTyp || "note",
        docKey: item.docKey || "",
        version: item.version || "1.0.0",
        status: String(item.status ?? 0),
        summary: item.summary || "",
        content: item.content || "",
        confidence: item.confidence || "medium",
        metadataJson: formatJsonText(item.metadataJson ?? {}, "{}"),
    }
}

export function candidateFormFromSource(
    item: KnowledgeRawRecord,
): CandidateFormState {
    return {
        ...EMPTY_CANDIDATE_FORM,
        title: item.title || "",
        summary: item.summary || "",
        content: item.content || "",
        proposedNamespaceKeys: item.namespaceSuggestions || [],
        metadataJson: formatJsonText(
            {
                source_refs: item.sourceRefs || [],
                source_typ: item.sourceTyp,
            },
            "{}",
        ),
    }
}

export function candidateFormToPayload(form: CandidateFormState) {
    return {
        title: form.title,
        summary: form.summary || undefined,
        content: form.content || undefined,
        docTyp: form.docTyp,
        proposedNamespaceKeys: form.proposedNamespaceKeys,
        proposedNewNamespaces: parseJsonText(form.proposedNewNamespaces, [] as Record<string, unknown>[]),
        targetDocKey: form.targetDocKey,
        confidence: form.confidence,
        metadata: parseJsonText(form.metadataJson, {} as Record<string, unknown>),
    }
}

export function acceptFormFromCandidate(
    item: KnowledgeCandidateRecord,
    defaults?: KnowledgeOptionsResponse["defaults"],
): AcceptCandidateFormState {
    return {
        namespaceKeys: item.proposedNamespaceKeys || [],
        docKey: item.targetDocKey || "",
        version: "",
        status: String(defaults?.documentStatus ?? 10),
        metadataPatch: "{}",
    }
}

export function acceptCandidateFormToPayload(form: AcceptCandidateFormState) {
    return {
        namespaceKeys: form.namespaceKeys,
        docKey: form.docKey || undefined,
        version: form.version || undefined,
        status: Number(form.status || 10),
        metadataPatch: parseJsonText(form.metadataPatch, {} as Record<string, unknown>),
    }
}

export function rawFormToPayload(
    rawForm: RawFormState,
): Partial<KnowledgeRawRecord> {
    return {
        title: rawForm.title,
        sourceTyp: Number(rawForm.sourceTyp || 0),
        status: Number(rawForm.status || 0),
        summary: rawForm.summary || "",
        content: rawForm.content || "",
        sourceRefs: parseJsonText(rawForm.sourceRefs, [] as string[]),
        namespaceSuggestions: parseJsonText(rawForm.namespaceSuggestions, [] as string[]),
        metadataJson: parseJsonText(rawForm.metadataJson, {} as Record<string, unknown>),
    }
}

export function documentFormToPayload(
    documentForm: DocumentFormState,
): Partial<KnowledgeDocumentRecord> {
    const metadataJson = parseJsonText(
        documentForm.metadataJson,
        {} as Record<string, unknown>,
    )
    metadataJson.acceptedNamespaceKeys = [documentForm.namespace]
    return {
        title: documentForm.title,
        docTyp: documentForm.docTyp,
        docKey:
            documentForm.docKey ||
            buildKnowledgeDocKey(documentForm.namespace, documentForm.title),
        version: documentForm.version,
        status: Number(documentForm.status || 0),
        summary: documentForm.summary || "",
        content: documentForm.content || "",
        confidence: documentForm.confidence,
        metadataJson,
    }
}

export function promoteFormFromRaw(
    item: KnowledgeRawRecord,
    defaults?: KnowledgeOptionsResponse["defaults"],
): PromoteFormState {
    const title = item.title || ""
    const namespace = item.namespaceSuggestions?.[0] || "general"
    return {
        title,
        namespace,
        docTyp: "note",
        docKey: buildKnowledgeDocKey(namespace, title),
        version: "1.0.0",
        status: String(defaults?.documentStatus ?? 0),
        confidence: defaults?.confidence ?? "medium",
    }
}

export function quickPublishFormFromRaw(
    item: KnowledgeRawRecord,
    defaults?: KnowledgeOptionsResponse["defaults"],
): QuickPublishFormState {
    const title = item.title || ""
    const namespaceKeys = item.namespaceSuggestions || []
    return {
        title,
        namespaceKeys,
        docTyp: "note",
        docKey: namespaceKeys[0] ? buildKnowledgeDocKey(namespaceKeys[0], title) : "",
        version: "",
        status: String(defaults?.documentStatus ?? 10),
        confidence: defaults?.confidence ?? "medium",
        summary: item.summary || "",
        content: item.content || "",
        metadata: formatJsonText(
            {
                source_refs: item.sourceRefs || [],
                source_typ: item.sourceTyp,
            },
            "{}",
        ),
    }
}

export function quickPublishFormToPayload(form: QuickPublishFormState) {
    return {
        title: form.title || undefined,
        namespaceKeys: form.namespaceKeys,
        docTyp: form.docTyp || "note",
        docKey: form.docKey || undefined,
        version: form.version || undefined,
        status: Number(form.status || 10),
        confidence: form.confidence || "medium",
        summary: form.summary || undefined,
        content: form.content || undefined,
        metadata: parseJsonText(form.metadata, {} as Record<string, unknown>),
    }
}
