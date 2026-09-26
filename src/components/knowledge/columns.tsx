"use client"

import { Archive, Check, GitMerge, RefreshCw, Rocket, RotateCw, Sparkles, X } from "lucide-react"

import { ActionButtons } from "@/components/common/action-buttons"
import { type Column } from "@/components/common/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type {
    KnowledgeCandidateRecord,
    KnowledgeChunkRecord,
    KnowledgeDocumentRecord,
    KnowledgeGovernanceSummary,
    KnowledgeNamespaceRecord,
    KnowledgeRawRecord,
} from "@/lib/knowledge"

type LabelResolver = (model: string, mapping: string, value: unknown) => string | number

export function buildKnowledgeRawColumns({
    getLabel,
    onCreateCandidate,
    onInduce,
    onQuickPublish,
    onEdit,
    onDelete,
}: {
    getLabel: LabelResolver
    onCreateCandidate: (item: KnowledgeRawRecord) => void
    onInduce: (item: KnowledgeRawRecord) => Promise<void>
    onQuickPublish: (item: KnowledgeRawRecord) => void
    onEdit: (item: KnowledgeRawRecord) => void
    onDelete: (item: KnowledgeRawRecord) => Promise<void>
}): Column<KnowledgeRawRecord>[] {
    return [
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
                    {item.content ? (
                        <div className="text-xs text-muted-foreground line-clamp-2">{item.content}</div>
                    ) : null}
                </div>
            ),
        },
        {
            key: "sourceTyp",
            title: "Source",
            width: 120,
            render: (value) => <Badge variant="secondary">{getLabel("KnowledgeSourceInput", "SOURCE_TYP_NAME_MAPPING", value)}</Badge>,
        },
        {
            key: "namespaceSuggestions",
            title: "Namespaces",
            width: 220,
            render: (value) => {
                const namespaces = Array.isArray(value) ? value : []
                return <span className="font-mono text-xs">{namespaces.join(", ") || "-"}</span>
            },
        },
        {
            key: "status",
            title: "Status",
            width: 120,
            render: (value) => <Badge>{getLabel("KnowledgeSourceInput", "STATUS_NAME_MAPPING", value)}</Badge>,
        },
        {
            key: "actions",
            title: "Actions",
            width: 340,
            fixed: "right",
            render: (_, item) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onQuickPublish(item)}>
                        <Rocket className="mr-1 h-4 w-4" />
                        Publish
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onCreateCandidate(item)}>
                        <Sparkles className="mr-1 h-4 w-4" />
                        Candidate
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onInduce(item)}>
                        <RefreshCw className="mr-1 h-4 w-4" />
                        Induce
                    </Button>
                    <ActionButtons
                        onEdit={() => onEdit(item)}
                        onConfirmDelete={() => onDelete(item)}
                        description={
                            <>
                                Are you sure you want to delete raw knowledge <strong>{item.title}</strong>?
                            </>
                        }
                    />
                </div>
            ),
        },
    ]
}

export function buildKnowledgeNamespaceColumns({
    getLabel,
    governance,
    onEdit,
    onArchive,
    onReactivate,
}: {
    getLabel: LabelResolver
    governance?: KnowledgeGovernanceSummary
    onEdit: (item: KnowledgeNamespaceRecord) => void
    onArchive: (item: KnowledgeNamespaceRecord) => Promise<void>
    onReactivate: (item: KnowledgeNamespaceRecord) => Promise<void>
}): Column<KnowledgeNamespaceRecord>[] {
    const refCounts = new Map(
        (governance?.namespaceRefCounts || []).map((item) => [item.namespaceKey, item.documentRefs])
    )
    return [
        { key: "id", title: "ID", width: 70 },
        {
            key: "namespaceKey",
            title: "Namespace",
            width: 300,
            render: (value, item) => (
                <div className="space-y-1">
                    <div className="font-mono text-xs font-medium">{String(value || "-")}</div>
                    <div className="text-xs text-muted-foreground">{item.title || item.description || "-"}</div>
                </div>
            ),
        },
        { key: "description", title: "Description", width: 320, truncate: true },
        {
            key: "status",
            title: "Status",
            width: 120,
            render: (value) => <Badge>{getLabel("KnowledgeNamespace", "STATUS_NAME_MAPPING", value)}</Badge>,
        },
        {
            key: "documentRefs",
            title: "Docs",
            width: 90,
            render: (_, item) => <Badge variant="secondary">{refCounts.get(item.namespaceKey) || 0}</Badge>,
        },
        {
            key: "actions",
            title: "Actions",
            width: 170,
            fixed: "right",
            render: (_, item) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>Edit</Button>
                    {Number(item.status) === 10 ? (
                        <Button variant="ghost" size="sm" onClick={() => onArchive(item)}>
                            <Archive className="mr-1 h-4 w-4" /> Archive
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" onClick={() => onReactivate(item)}>
                            <RefreshCw className="mr-1 h-4 w-4" /> Active
                        </Button>
                    )}
                </div>
            ),
        },
    ]
}

export function buildKnowledgeDocumentColumns({
    getLabel,
    onEdit,
    onArchive,
    onRegenerate,
    onSync,
}: {
    getLabel: LabelResolver
    onEdit: (item: KnowledgeDocumentRecord) => void
    onArchive: (item: KnowledgeDocumentRecord) => Promise<void>
    onRegenerate: (item: KnowledgeDocumentRecord) => Promise<void>
    onSync: (item: KnowledgeDocumentRecord) => Promise<void>
}): Column<KnowledgeDocumentRecord>[] {
    return [
        { key: "id", title: "ID", width: 70 },
        {
            key: "title",
            title: "Title",
            width: 280,
            render: (value, item) => (
                <div className="space-y-1">
                    <div className="font-medium">{String(value || "-")}</div>
                    <div className="text-xs text-muted-foreground">
                        {documentNamespaces(item).join(", ") || "general"} / {item.docTyp}
                    </div>
                    {item.summary || item.content ? (
                        <div className="text-xs text-muted-foreground line-clamp-2">{item.summary || item.content}</div>
                    ) : null}
                </div>
            ),
        },
        { key: "docKey", title: "Doc Key", width: 220, truncate: true, className: "font-mono text-xs" },
        { key: "docTyp", title: "Type", width: 130 },
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
            width: 260,
            fixed: "right",
            render: (_, item) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => onArchive(item)}>
                        <Archive className="mr-1 h-4 w-4" /> Archive
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onRegenerate(item)}>
                        <RotateCw className="mr-1 h-4 w-4" /> Chunks
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onSync(item)}>
                        <RefreshCw className="mr-1 h-4 w-4" /> Index
                    </Button>
                </div>
            ),
        },
    ]
}

export function buildKnowledgeCandidateColumns({
    getLabel,
    onAccept,
    onReject,
    onMerge,
}: {
    getLabel: LabelResolver
    onAccept: (item: KnowledgeCandidateRecord) => void
    onReject: (item: KnowledgeCandidateRecord) => void
    onMerge: (item: KnowledgeCandidateRecord) => void
}): Column<KnowledgeCandidateRecord>[] {
    return [
        { key: "id", title: "ID", width: 70 },
        {
            key: "title",
            title: "Title",
            width: 300,
            render: (value, item) => (
                <div className="space-y-1">
                    <div className="font-medium">{String(value || "-")}</div>
                    <div className="text-xs text-muted-foreground">
                        {candidateNamespaces(item).join(", ") || "-"} / {item.docTyp}
                    </div>
                    {item.summary || item.content ? (
                        <div className="text-xs text-muted-foreground line-clamp-2">{item.summary || item.content}</div>
                    ) : null}
                </div>
            ),
        },
        {
            key: "status",
            title: "Status",
            width: 120,
            render: (value) => <Badge>{getLabel("KnowledgeCandidate", "STATUS_NAME_MAPPING", value)}</Badge>,
        },
        {
            key: "actionTyp",
            title: "Action",
            width: 120,
            render: (value) => <Badge variant="secondary">{getLabel("KnowledgeCandidate", "ACTION_TYP_NAME_MAPPING", value)}</Badge>,
        },
        { key: "targetDocKey", title: "Target Doc", width: 240, truncate: true, className: "font-mono text-xs" },
        { key: "agentExecutionId", title: "Agent Exec", width: 110 },
        {
            key: "confidence",
            title: "Confidence",
            width: 120,
            render: (value) => <Badge variant="secondary">{String(value || "medium")}</Badge>,
        },
        {
            key: "actions",
            title: "Actions",
            width: 230,
            fixed: "right",
            render: (_, item) => {
                const reviewed = Number(item.status) !== 0
                return (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onAccept(item)} disabled={reviewed}>
                            <Check className="mr-1 h-4 w-4" /> Accept
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onReject(item)} disabled={reviewed}>
                            <X className="mr-1 h-4 w-4" /> Reject
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onMerge(item)} disabled={reviewed}>
                            <GitMerge className="mr-1 h-4 w-4" /> Merge
                        </Button>
                    </div>
                )
            },
        },
    ]
}

export function buildKnowledgeChunkColumns({
    getLabel,
}: {
    getLabel: LabelResolver
}): Column<KnowledgeChunkRecord>[] {
    return [
        { key: "id", title: "ID", width: 70 },
        { key: "documentId", title: "Document", width: 100 },
        { key: "chunkNo", title: "No.", width: 80 },
        {
            key: "heading",
            title: "Chunk",
            width: 360,
            render: (value, item) => (
                <div className="space-y-1">
                    <div className="font-medium">{String(value || item.metadataJson?.docKey || "-")}</div>
                    {item.chunkText ? (
                        <div className="text-xs text-muted-foreground line-clamp-3">{item.chunkText}</div>
                    ) : null}
                </div>
            ),
        },
        {
            key: "status",
            title: "Status",
            width: 120,
            render: (value) => <Badge>{getLabel("KnowledgeChunk", "STATUS_NAME_MAPPING", value)}</Badge>,
        },
        { key: "tokenCount", title: "Tokens", width: 90 },
    ]
}

function documentNamespaces(item: KnowledgeDocumentRecord): string[] {
    const metadata = item.metadataJson || {}
    const value = metadata.acceptedNamespaceKeys
    return Array.isArray(value) ? value.map(String) : []
}

function candidateNamespaces(item: KnowledgeCandidateRecord): string[] {
    const value = item.proposedNamespaceKeys
    return Array.isArray(value) ? value.map(String) : []
}
