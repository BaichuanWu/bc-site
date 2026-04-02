'use client'

import React from 'react'
import { MessageSquareIcon } from 'lucide-react'
import { CollapsibleMessage } from './collapsible-message'

export type TranscriptMessage = {
    role?: string
    content?: unknown
}

function normalizeMessage(value: unknown): TranscriptMessage {
    if (!value || typeof value !== 'object') {
        return { role: 'assistant', content: value }
    }
    const maybeMessage = value as Record<string, unknown>
    return {
        role: typeof maybeMessage.role === 'string' ? maybeMessage.role : 'assistant',
        content: maybeMessage.content,
    }
}

export const DialogueTranscript = ({ messages }: { messages: unknown[] }) => {
    if (!messages || messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-30 gap-4">
                <MessageSquareIcon className="h-12 w-12" />
                <p className="text-sm font-medium tracking-tight">No dialogue recorded for this step.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 pb-12">
            {messages.map((m, i) => (
                (() => {
                    const message = normalizeMessage(m)
                    return (
                <CollapsibleMessage 
                    key={i} 
                    role={message.role || 'assistant'} 
                    content={message.content ?? null} 
                    index={i} 
                />
                    )
                })()
            ))}
        </div>
    )
}
