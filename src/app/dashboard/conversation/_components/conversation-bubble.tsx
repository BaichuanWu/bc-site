"use client"

import { BotIcon, UserIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import type { ConversationMessage } from "../types"
import { getMessageText } from "../utils"

export function ConversationBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "user"
  const Icon = isUser ? UserIcon : BotIcon
  // api-casing-ignore-next-line: Backward-compatible provider metadata key.
  const modelName = message.llmConfig?.model || message.llmConfig?.model_name

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div
        className={cn(
          "max-w-[78%] rounded-lg border px-4 py-3 text-sm leading-6 shadow-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-background",
        )}
      >
        <div className="whitespace-pre-wrap break-words">{getMessageText(message.content)}</div>
        {!isUser && modelName ? (
          <div className="mt-2 border-t pt-2 text-[11px] leading-none text-muted-foreground">
            {modelName}
          </div>
        ) : null}
      </div>
      {isUser ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
    </div>
  )
}
