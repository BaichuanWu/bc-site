"use client"

import * as React from "react"
import { BotIcon, ChevronRightIcon, SettingsIcon, UserIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import type { ConversationMessage } from "../types"
import { ConversationMessageContent } from "./conversation-message-content"

export function ConversationBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "user"
  const isSystem = message.role === "system"
  const isRequest = isUser || isSystem
  const Icon = isUser ? UserIcon : BotIcon
  const [isSystemExpanded, setIsSystemExpanded] = React.useState(false)
  // api-casing-ignore-next-line: Backward-compatible provider metadata key.
  const modelName = message.llmConfig?.model || message.llmConfig?.model_name

  if (isSystem) {
    return (
      <div className="flex justify-end gap-3">
        <div className="w-full max-w-[86%] rounded-md border bg-primary/5 text-muted-foreground lg:max-w-[78%]">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
            onClick={() => setIsSystemExpanded((value) => !value)}
            aria-expanded={isSystemExpanded}
          >
            <div className="flex min-w-0 items-center gap-2">
              <SettingsIcon className="h-3.5 w-3.5 shrink-0" />
              <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                System
              </Badge>
              <span className="truncate text-xs">
                Context message #{message.id}
              </span>
            </div>
            <ChevronRightIcon
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                isSystemExpanded ? "rotate-90" : "",
              )}
            />
          </button>
          {isSystemExpanded ? (
            <div className="border-t px-3 py-3">
              <ConversationMessageContent content={message.content} />
            </div>
          ) : null}
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted">
          <SettingsIcon className="h-4 w-4" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-3", isRequest ? "justify-end" : "justify-start")}>
      {!isRequest ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div
        className={cn(
          "max-w-[86%] overflow-hidden rounded-lg border px-4 py-3 text-sm leading-6 shadow-sm lg:max-w-[78%]",
          isRequest ? "bg-primary text-primary-foreground" : "bg-background",
        )}
      >
        <ConversationMessageContent content={message.content} inverted={isRequest} />
        {!isRequest && modelName ? (
          <div className="mt-2 border-t pt-2 text-[11px] leading-none text-muted-foreground">
            {modelName}
          </div>
        ) : null}
      </div>
      {isRequest ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  )
}
