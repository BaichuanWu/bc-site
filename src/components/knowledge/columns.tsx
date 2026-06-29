"use client"

import { Sparkles } from "lucide-react"

import { ActionButtons } from "@/components/common/action-buttons"
import { type Column } from "@/components/common/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type {
    KnowledgeDocumentRecord,
    KnowledgeRawRecord,
} from "@/lib/knowledge"

type LabelResolver = (model: string, mapping: string, value: unknown) => string | number

export function buildKnowledgeRawColumns({
    getLabel,
    onPromote,
    onEdit,
    onDelete,
}: {
    getLabel: LabelResolver
    onPromote: (item: KnowledgeRawRecord) => void
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
            width: 140,
            fixed: "right",
            render: (_, item) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onPromote(item)}>
                        <Sparkles className="mr-1 h-4 w-4" />
                        Promote
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

export function buildKnowledgeDocumentColumns({
    getLabel,
    onEdit,
    onDelete,
}: {
    getLabel: LabelResolver
    onEdit: (item: KnowledgeDocumentRecord) => void
    onDelete: (item: KnowledgeDocumentRecord) => Promise<void>
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
            width: 100,
            fixed: "right",
            render: (_, item) => (
                <ActionButtons
                    onEdit={() => onEdit(item)}
                    onConfirmDelete={() => onDelete(item)}
                    description={
                        <>
                            Are you sure you want to delete knowledge document <strong>{item.title}</strong>?
                        </>
                    }
                />
            ),
        },
    ]
}

function documentNamespaces(item: KnowledgeDocumentRecord): string[] {
    const metadata = item.metadataJson || {}
    const value = metadata.acceptedNamespaceKeys
    return Array.isArray(value) ? value.map(String) : []
}
