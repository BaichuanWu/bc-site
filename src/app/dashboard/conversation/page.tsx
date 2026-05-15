"use client"

import { PlusIcon } from "lucide-react"

import { PageShell } from "@/components/common/page-shell"
import { Button } from "@/components/ui/button"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"

import { ConversationSettings } from "./_components/conversation-settings"
import { ConversationThread } from "./_components/conversation-thread"
import { useConversationController } from "./use-conversation-controller"

export default function ConversationPage() {
  useWorkspaceTabTitle("/dashboard/conversation", "Conversation")
  const conversation = useConversationController()

  return (
    <PageShell className="h-full overflow-hidden" contentClassName="flex h-full min-h-0 flex-col gap-4 space-y-0 overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Conversation</h1>
          <p className="text-sm text-muted-foreground">Pure LLM chat, independent from agents and workflows.</p>
        </div>
        <Button
          variant="outline"
          onClick={conversation.startNewConversation}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          New
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
        <ConversationSettings
          conversationId={conversation.conversationId}
          currentConversation={conversation.currentConversation}
          conversations={conversation.conversations}
          sourceFilter={conversation.sourceFilter}
          title={conversation.title}
          systemPrompt={conversation.systemPrompt}
          llmId={conversation.llmId}
          modelName={conversation.modelName}
          temperature={conversation.temperature}
          modelOptions={conversation.modelOptions}
          isCreating={conversation.isCreating}
          isLoadingModels={conversation.isLoadingModels}
          onTitleChange={conversation.setTitle}
          onSystemPromptChange={conversation.setSystemPrompt}
          onLlmChange={conversation.setLlmId}
          onModelChange={conversation.setModelName}
          onTemperatureChange={conversation.setTemperature}
          onCreateConversation={() => {
            void conversation.createConversation()
          }}
          onOpenConversation={conversation.openConversationFromList}
          onSourceFilterChange={conversation.setSourceFilter}
          onOpenTask={conversation.openTask}
          onOpenAgent={conversation.openAgent}
        />

        <ConversationThread
          messages={conversation.messages}
          input={conversation.input}
          canSend={conversation.canSend}
          isSending={conversation.isSending}
          inputEnabled={conversation.inputEnabled}
          onInputChange={conversation.setInput}
          onSend={() => {
            void conversation.sendMessage()
          }}
        />
      </div>
    </PageShell>
  )
}
