'use client'

import React, { useState } from 'react'
import { 
    BotIcon, 
    ChevronDownIcon, 
    ChevronRightIcon, 
    CodeIcon, 
    InfoIcon, 
    TerminalIcon, 
    UserIcon 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { JsonNode } from '@/components/common/json-node'
import { MarkdownViewer } from '@/components/common/markdown-viewer'

export const CollapsibleMessage = ({ 
    role, 
    content, 
    index 
}: { 
    role: string, 
    content: unknown, 
    index: number 
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false)
    
    let parsedContent = content;
    let isDict = typeof content === 'object' && content !== null;

    if (typeof content === 'string' && !isDict) {
        const trimmed = content.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                parsedContent = JSON.parse(trimmed);
                isDict = true;
            } catch {
                // fall back to string view implicitly
            }
        }
    }

    const getRoleStyles = (role: string) => {
        switch(role) {
            case 'system': return "bg-muted/30 border-muted-foreground/10 text-muted-foreground"
            case 'user': return "bg-blue-500/5 border-blue-500/20 text-blue-400"
            case 'input': return "bg-amber-500/5 border-amber-500/20 text-amber-400"
            case 'output': return "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
            default: return "bg-purple-500/5 border-purple-500/20 text-purple-400"
        }
    }

    const getRoleIcon = (role: string) => {
        switch(role) {
            case 'system': return <InfoIcon className="h-3.5 w-3.5" />
            case 'user': return <UserIcon className="h-3.5 w-3.5" />
            case 'input': return <TerminalIcon className="h-3.5 w-3.5" />
            case 'output': return <CodeIcon className="h-3.5 w-3.5" />
            default: return <BotIcon className="h-3.5 w-3.5" />
        }
    }

    return (
        <div className={cn(
            "flex flex-col gap-0 rounded-2xl border transition-all duration-300 overflow-hidden",
            getRoleStyles(role),
            isCollapsed ? "opacity-60 scale-[0.98]" : "opacity-100 shadow-lg shadow-black/5"
        )} style={{ animationDelay: `${index * 80}ms` }}>
            <div 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors select-none"
            >
                <div className="flex items-center gap-3">
                    <div className="opacity-70">{getRoleIcon(role)}</div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{role}</span>
                </div>
                <div className="flex items-center gap-3">
                    {!isCollapsed && (
                        <span className="text-[9px] font-mono opacity-30 truncate max-w-[200px]">
                            {isDict ? "Structured Dataset" : String(content).slice(0, 50).replace(/\n/g, ' ') + (String(content).length > 50 ? '...' : '')}
                        </span>
                    )}
                    <div className="opacity-30 group-hover:opacity-100 transition-opacity">
                        {isCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                    </div>
                </div>
            </div>
            
            {!isCollapsed && (
                <div className="p-6 pt-0 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="prose prose-invert prose-sm max-w-none">
                        {isDict ? (
                            <JsonNode data={parsedContent} depth={0} />
                        ) : (
                            <MarkdownViewer content={String(content || '')} />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
