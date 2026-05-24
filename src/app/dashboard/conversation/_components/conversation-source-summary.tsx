"use client"

import { ExternalLinkIcon, RotateCcwIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import type { ConversationSourceAction, ConversationSourceAdapterResult } from "../types"

function ActionIcon({ kind }: { kind: ConversationSourceAction["kind"] }) {
  if (kind === "rerun") return <RotateCcwIcon className="mr-2 h-4 w-4" />
  if (kind === "openSource") return <ExternalLinkIcon className="mr-2 h-4 w-4" />
  return <SearchIcon className="mr-2 h-4 w-4" />
}

export function ConversationSourceSummary({
  source,
  sourceTyp,
  sourceId,
}: {
  source: ConversationSourceAdapterResult
  sourceTyp?: number
  sourceId?: number
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Source</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{source.label}</Badge>
            <span className="font-mono text-xs text-muted-foreground">
              typ={sourceTyp ?? 0}
              {sourceId ? ` id=${sourceId}` : ""}
            </span>
          </div>
          {source.summary ? (
            <p className="text-sm text-muted-foreground">{source.summary}</p>
          ) : null}
        </div>

        {source.actions.length > 0 ? (
          <div className="space-y-2">
            {source.actions.map((action) => (
              <Button
                key={action.id}
                type="button"
                variant={action.kind === "rerun" ? "default" : "outline"}
                className="w-full justify-start"
                disabled={action.disabled}
                onClick={() => {
                  if ("run" in action && action.run) void action.run()
                }}
              >
                <ActionIcon kind={action.kind} />
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

