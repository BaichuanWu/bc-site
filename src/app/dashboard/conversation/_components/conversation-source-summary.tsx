"use client"

import { ExternalLinkIcon, RotateCcwIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { WorkspaceLink } from "@/components/workspace/workspace-link"

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
            {source.actions.map((action) => {
              const content = (
                <>
                  <ActionIcon kind={action.kind} />
                  {action.label}
                </>
              )
              const buttonClassName = "w-full justify-start"
              if (action.kind === "openSource" && action.href && !action.disabled) {
                return (
                  <Button key={action.id} asChild variant="outline" className={buttonClassName}>
                    <WorkspaceLink
                      href={action.href}
                      titleOverride={action.label}
                      onClick={() => {
                        if (action.run) void action.run()
                      }}
                    >
                      {content}
                    </WorkspaceLink>
                  </Button>
                )
              }

              return (
                <Button
                  key={action.id}
                  type="button"
                  variant={action.kind === "rerun" ? "default" : "outline"}
                  className={buttonClassName}
                  disabled={action.disabled}
                  onClick={() => {
                    if ("run" in action && action.run) void action.run()
                  }}
                >
                  {content}
                </Button>
              )
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
