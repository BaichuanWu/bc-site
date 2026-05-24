import { formatJsonText, parseJsonText } from "@/lib/json-utils"

export type KnowledgeOptionsResponse = {
    defaults?: {
        domain?: number
        sourceType?: number
        contentType?: number
        rawStatus?: number
        documentStatus?: number
        confidence?: string
    }
}

export type KnowledgeRawRecord = {
    id: number
    title: string
    domain: number
    sourceType: number
    contentType: number
    status: number
    namespaceHint?: string
    tags?: string[]
    scope?: Record<string, unknown>
    summary?: string
    content?: string
    sourceRef?: string
    relatedObjectType?: string
    relatedObjectId?: number
    reviewedTime?: string
    updateTime?: string
}

export type KnowledgeDocumentRecord = {
    id: number
    title: string
    domain: number
    namespace: string
    docType: string
    docKey: string
    version: string
    status: number
    tags?: string[]
    scope?: Record<string, unknown>
    summary?: string
    content?: string
    confidence?: string
    publishedTime?: string
    updateTime?: string
}

export type RawFormState = {
    title: string
    domain: string
    sourceType: string
    contentType: string
    status: string
    namespaceHint: string
    tags: string
    scope: string
    summary: string
    content: string
    sourceRef: string
    relatedObjectType: string
    relatedObjectId: string
}

export type DocumentFormState = {
    title: string
    domain: string
    namespace: string
    docType: string
    docKey: string
    version: string
    status: string
    tags: string
    scope: string
    summary: string
    content: string
    confidence: string
}

export type PromoteFormState = {
    title: string
    namespace: string
    docType: string
    docKey: string
    version: string
    status: string
    confidence: string
}

export const EMPTY_RAW_FORM: RawFormState = {
    title: "",
    domain: "0",
    sourceType: "0",
    contentType: "0",
    status: "0",
    namespaceHint: "",
    tags: "[]",
    scope: "{}",
    summary: "",
    content: "",
    sourceRef: "",
    relatedObjectType: "",
    relatedObjectId: "",
}

export const EMPTY_DOCUMENT_FORM: DocumentFormState = {
    title: "",
    domain: "0",
    namespace: "general",
    docType: "note",
    docKey: "",
    version: "1.0.0",
    status: "0",
    tags: "[]",
    scope: "{}",
    summary: "",
    content: "",
    confidence: "medium",
}

export const EMPTY_PROMOTE_FORM: PromoteFormState = {
    title: "",
    namespace: "general",
    docType: "note",
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
        domain: String(item.domain ?? 0),
        sourceType: String(item.sourceType ?? 0),
        contentType: String(item.contentType ?? 0),
        status: String(item.status ?? 0),
        namespaceHint: item.namespaceHint || "",
        tags: formatJsonText(item.tags ?? [], "[]"),
        scope: formatJsonText(item.scope ?? {}, "{}"),
        summary: item.summary || "",
        content: item.content || "",
        sourceRef: item.sourceRef || "",
        relatedObjectType: item.relatedObjectType || "",
        relatedObjectId: item.relatedObjectId ? String(item.relatedObjectId) : "",
    }
}

export function documentRecordToForm(
    item: KnowledgeDocumentRecord,
): DocumentFormState {
    return {
        title: item.title || "",
        domain: String(item.domain ?? 0),
        namespace: item.namespace || "general",
        docType: item.docType || "note",
        docKey: item.docKey || "",
        version: item.version || "1.0.0",
        status: String(item.status ?? 0),
        tags: formatJsonText(item.tags ?? [], "[]"),
        scope: formatJsonText(item.scope ?? {}, "{}"),
        summary: item.summary || "",
        content: item.content || "",
        confidence: item.confidence || "medium",
    }
}

export function rawFormToPayload(
    rawForm: RawFormState,
): Partial<KnowledgeRawRecord> {
    return {
        title: rawForm.title,
        domain: Number(rawForm.domain || 0),
        sourceType: Number(rawForm.sourceType || 0),
        contentType: Number(rawForm.contentType || 0),
        status: Number(rawForm.status || 0),
        namespaceHint: rawForm.namespaceHint || "",
        tags: parseJsonText(rawForm.tags, [] as string[]),
        scope: parseJsonText(rawForm.scope, {} as Record<string, unknown>),
        summary: rawForm.summary || "",
        content: rawForm.content || "",
        sourceRef: rawForm.sourceRef || "",
        relatedObjectType: rawForm.relatedObjectType || "",
        relatedObjectId: rawForm.relatedObjectId
            ? Number(rawForm.relatedObjectId)
            : undefined,
    }
}

export function documentFormToPayload(
    documentForm: DocumentFormState,
): Partial<KnowledgeDocumentRecord> {
    return {
        title: documentForm.title,
        domain: Number(documentForm.domain || 0),
        namespace: documentForm.namespace,
        docType: documentForm.docType,
        docKey:
            documentForm.docKey ||
            buildKnowledgeDocKey(documentForm.namespace, documentForm.title),
        version: documentForm.version,
        status: Number(documentForm.status || 0),
        tags: parseJsonText(documentForm.tags, [] as string[]),
        scope: parseJsonText(documentForm.scope, {} as Record<string, unknown>),
        summary: documentForm.summary || "",
        content: documentForm.content || "",
        confidence: documentForm.confidence,
    }
}

export function promoteFormFromRaw(
    item: KnowledgeRawRecord,
    defaults?: KnowledgeOptionsResponse["defaults"],
): PromoteFormState {
    const title = item.title || ""
    const namespace = item.namespaceHint || "general"
    return {
        title,
        namespace,
        docType: "note",
        docKey: buildKnowledgeDocKey(namespace, title),
        version: "1.0.0",
        status: String(defaults?.documentStatus ?? 0),
        confidence: defaults?.confidence ?? "medium",
    }
}
