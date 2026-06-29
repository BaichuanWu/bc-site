import { formatJsonText, parseJsonText } from "@/lib/json-utils"

export type KnowledgeOptionsResponse = {
    defaults?: {
        sourceTyp?: number
        sourceInputStatus?: number
        documentStatus?: number
        confidence?: string
    }
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

export const EMPTY_PROMOTE_FORM: PromoteFormState = {
    title: "",
    namespace: "general",
    docTyp: "note",
    docKey: "",
    version: "1.0.0",
    status: "0",
    confidence: "medium",
}

export function buildKnowledgeDocKey(namespace: string, title: string) {
    const slug = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    return `${namespace || "general"}:${slug || "knowledge-doc"}`
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
