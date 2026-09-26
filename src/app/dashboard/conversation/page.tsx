"use client"

import * as React from "react"
import { MessageSquareIcon, MoveUpRightIcon } from "lucide-react"

import { CrudLayout } from "@/components/common/crud-layout"
import { type Column } from "@/components/common/data-table"
import { type SearchFilterItem } from "@/components/common/query-filters"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/date-utils"
import { useWorkspaceNavigate } from "@/hooks/use-workspace-navigate"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"

import { resolveConversationSourceAdapter } from "./source-adapters"
import type { ConversationRecord } from "./types"

function getModelLabel(conversation: ConversationRecord) {
  const config = conversation.llmConfig || {}
  return typeof config.model === "string" && config.model ? config.model : "-"
}

export default function ConversationPage() {
  const navigate = useWorkspaceNavigate()
  useWorkspaceTabTitle("/dashboard/conversation", "Conversation")

  const filterItems: SearchFilterItem[] = React.useMemo(
    () => [
      { key: "title", label: "Title", type: "text" },
      { key: "sourceTyp", label: "Source Type", type: "number" },
      { key: "sourceId", label: "Source ID", type: "number" },
    ],
    [],
  )

  const columns: Column<ConversationRecord>[] = [
    {
      key: "title",
      title: "Conversation",
      render: (value, item) => (
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 items-center gap-2">
            <MessageSquareIcon className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate font-medium">
              {String(value || `Conversation #${item.id}`)}
            </span>
          </div>
          <div className="font-mono text-xs text-muted-foreground">#{item.id}</div>
        </div>
      ),
    },
    {
      key: "sourceTyp",
      title: "Source",
      render: (_value, item) => {
        const source = resolveConversationSourceAdapter(item).resolve({
          conversation: item,
          messages: [],
          lastResultMessage: null,
        })
        return (
          <div className="space-y-1">
            <Badge variant="secondary">{source.label}</Badge>
            <div className="font-mono text-xs text-muted-foreground">
              typ={item.sourceTyp ?? 0}
              {item.sourceId ? ` id=${item.sourceId}` : ""}
            </div>
          </div>
        )
      },
    },
    {
      key: "llmConfig",
      title: "Model",
      render: (_value, item) => (
        <span className="text-sm text-muted-foreground">{getModelLabel(item)}</span>
      ),
    },
    {
      key: "metaData",
      title: "Metadata",
      render: (value) => {
        const count =
          value && typeof value === "object" && !Array.isArray(value)
            ? Object.keys(value as Record<string, unknown>).length
            : 0
        return <span className="text-xs text-muted-foreground">{count} fields</span>
      },
    },
    {
      key: "createTime",
      title: "Created",
      render: (value) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(typeof value === "string" ? value : null, "-")}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      width: 112,
      render: (_value, item) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            navigate(`/dashboard/conversation/${item.id}`, undefined, {
              title: `Conversation: ${item.title || `#${item.id}`}`,
            })
          }
        >
          <MoveUpRightIcon className="mr-1 h-3.5 w-3.5" />
          Open
        </Button>
      ),
    },
  ]

  return (
    <CrudLayout<ConversationRecord>
      icon={MessageSquareIcon}
      title="Conversation"
      endpoint="/agent/conversation"
      filterItems={filterItems}
      storageKey="conversation-filters"
      columns={columns}
      defaultPageSize={20}
    />
  )
}
