"use client"

import { Loader2Icon, MessageSquareIcon } from "lucide-react"

import { RemoteSelect } from "@/components/common/remote-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type { ConversationRecord, ModelOption } from "../types"
import { type ConversationSourceFilter } from "../utils"
import { ConversationSourcePanel } from "./conversation-source-panel"

type ConversationSettingsProps = {
  conversationId: number | null
  currentConversation: ConversationRecord | null
  conversations: ConversationRecord[]
  sourceFilter: ConversationSourceFilter
  title: string
  systemPrompt: string
  llmId: number | null
  modelName: string
  temperature: string
  modelOptions: ModelOption[]
  isCreating: boolean
  isLoadingModels: boolean
  onTitleChange: (value: string) => void
  onSystemPromptChange: (value: string) => void
  onLlmChange: (value: number | null) => void
  onModelChange: (value: string) => void
  onTemperatureChange: (value: string) => void
  onCreateConversation: () => void
  onOpenConversation: (conversation: ConversationRecord) => void
  onSourceFilterChange: (value: ConversationSourceFilter) => void
  onOpenTask: (taskId: number) => void
  onOpenAgent: (agentId: number) => void
}

export function ConversationSettings({
  conversationId,
  currentConversation,
  conversations,
  sourceFilter,
  title,
  systemPrompt,
  llmId,
  modelName,
  temperature,
  modelOptions,
  isCreating,
  isLoadingModels,
  onTitleChange,
  onSystemPromptChange,
  onLlmChange,
  onModelChange,
  onTemperatureChange,
  onCreateConversation,
  onOpenConversation,
  onSourceFilterChange,
  onOpenTask,
  onOpenAgent,
}: ConversationSettingsProps) {
  return (
    <Card className="flex min-h-0 flex-col overflow-hidden rounded-lg shadow-none">
      <CardHeader className="shrink-0">
        <CardTitle className="text-sm">Settings</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-4 overflow-hidden">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(event) => onTitleChange(event.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>LLM</Label>
          <RemoteSelect
            endpoint="/agent/llm?limit=100"
            value={llmId}
            onValueChange={(value) => {
              onLlmChange(typeof value === "number" ? value : value ? Number(value) : null)
              onModelChange("")
            }}
            placeholder="Select an LLM"
          />
        </div>

        <div className="space-y-2">
          <Label>Model</Label>
          <Select
            value={modelName}
            onValueChange={onModelChange}
            disabled={!llmId || isLoadingModels || modelOptions.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={llmId ? "Select a model" : "Select an LLM first"} />
            </SelectTrigger>
            <SelectContent>
              {modelOptions.map((option) => (
                <SelectItem key={option.id} value={option.modelName}>
                  {option.modelName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Temperature</Label>
          <Input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(event) => onTemperatureChange(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>System Prompt</Label>
          <Textarea
            value={systemPrompt}
            onChange={(event) => onSystemPromptChange(event.target.value)}
            className="min-h-24 resize-none"
            placeholder="Optional system prompt"
          />
        </div>

        {!conversationId ? (
          <Button className="w-full" disabled={!llmId || !modelName || isCreating} onClick={onCreateConversation}>
            {isCreating ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquareIcon className="mr-2 h-4 w-4" />}
            Create Conversation
          </Button>
        ) : (
          <ConversationSourcePanel
            conversationId={conversationId}
            conversation={currentConversation}
            onOpenTask={onOpenTask}
            onOpenAgent={onOpenAgent}
          />
        )}

        <div className="space-y-2 border-t pt-4">
          <Label>Recent Conversations</Label>
          <Select
            value={sourceFilter}
            onValueChange={(value) => onSourceFilterChange(value as ConversationSourceFilter)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="workflow">Workflow nodes</SelectItem>
              <SelectItem value="agent">Agents</SelectItem>
              <SelectItem value="manual">Manual chats</SelectItem>
            </SelectContent>
          </Select>
          <div className="space-y-1 pr-1">
            {conversations.length ? (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onOpenConversation(conversation)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    conversation.id === conversationId ? "border-primary bg-muted" : "bg-background",
                  )}
                >
                  <div className="truncate font-medium">{conversation.title || `Conversation #${conversation.id}`}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    #{conversation.id}
                    {conversation.llmConfig?.model ? ` · ${conversation.llmConfig.model}` : ""}
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">No conversations.</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
