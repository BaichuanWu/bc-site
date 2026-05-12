"use client"

import { Loader2Icon, MessageSquareIcon, SendIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

import type { ConversationMessage } from "../types"
import { ConversationBubble } from "./conversation-bubble"

type ConversationThreadProps = {
  messages: ConversationMessage[]
  input: string
  canSend: boolean
  isSending: boolean
  inputEnabled: boolean
  onInputChange: (value: string) => void
  onSend: () => void
}

export function ConversationThread({
  messages,
  input,
  canSend,
  isSending,
  inputEnabled,
  onInputChange,
  onSend,
}: ConversationThreadProps) {
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden rounded-lg shadow-none">
      <ScrollArea className="min-h-0 flex-1 overflow-hidden">
        <div className="space-y-4 p-5">
          {messages.length > 0 ? (
            messages.map((message) => <ConversationBubble key={message.id} message={message} />)
          ) : (
            <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-muted-foreground">
              <MessageSquareIcon className="h-10 w-10" />
              <div className="text-sm">No messages yet.</div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t bg-background p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                onSend()
              }
            }}
            className="min-h-12 resize-none"
            placeholder={inputEnabled ? "Message" : "Select an LLM and model first"}
            disabled={isSending || !inputEnabled}
          />
          <Button className="h-12 w-12 shrink-0" size="icon" disabled={!canSend} onClick={onSend}>
            {isSending ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  )
}
