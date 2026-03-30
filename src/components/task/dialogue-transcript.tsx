'use client'

import React from 'react'
import { MessageSquareIcon } from 'lucide-react'
import { CollapsibleMessage } from './collapsible-message'

export const DialogueTranscript = ({ messages }: { messages: any[] }) => {
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
                <CollapsibleMessage 
                    key={i} 
                    role={m?.role || 'assistant'} 
                    content={m?.content} 
                    index={i} 
                />
            ))}
        </div>
    )
}
