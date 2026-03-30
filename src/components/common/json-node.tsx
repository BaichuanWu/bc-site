'use client'

import React, { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export const JsonNode = ({ data, label, depth = 0 }: { data: any, label?: string, depth?: number }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const isObject = data !== null && typeof data === 'object'
    const isEmpty = isObject && Object.keys(data).length === 0
    
    if (!isObject) {
         return (
            <div className="flex items-start gap-2 py-0.5 group/node" style={{ paddingLeft: `${depth * 16}px` }}>
                {label && <span className="text-blue-400/80 font-semibold shrink-0 select-none">{label}:</span>}
                <span className={cn(
                    "font-mono break-all selection:bg-primary/20",
                    typeof data === 'string' ? "text-emerald-400/90" : 
                    typeof data === 'number' ? "text-amber-400" : 
                    typeof data === 'boolean' ? "text-indigo-400" : "text-muted-foreground/60"
                )}>
                    {typeof data === 'string' ? `"${data}"` : String(data)}
                </span>
            </div>
        )
    }

    const entries = Array.isArray(data) 
        ? data.map((v, i) => [String(i), v]) 
        : Object.entries(data)

    return (
        <div className="flex flex-col py-0.5">
            <div 
                className={cn(
                    "flex items-center gap-1 cursor-pointer group hover:bg-white/5 rounded px-1 -ml-1 transition-all duration-200",
                    depth === 0 ? "mb-1" : ""
                )}
                style={{ paddingLeft: `${depth * 16}px` }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {!isEmpty && (
                    <div className="shrink-0 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                         <ChevronDownIcon className="h-3 w-3 opacity-30 group-hover:opacity-100" />
                    </div>
                )}
                {label && <span className="text-blue-400/80 font-semibold shrink-0 select-none">{label}:</span>}
                <span className="text-[9px] font-mono opacity-30 tracking-tighter uppercase ml-1">
                    {Array.isArray(data) ? `Array[${data.length}]` : `Object{${Object.keys(data).length}}`}
                </span>
                {!isExpanded && !isEmpty && (
                    <span className="text-[10px] opacity-20 truncate ml-2 font-mono">
                        {Array.isArray(data) ? '[...]' : '{...}'}
                    </span>
                )}
            </div>
            
            {isExpanded && !isEmpty && (
                <div className="flex flex-col border-l border-white/5 ml-1.5 mt-0.5 relative">
                    {entries.map(([key, value], i) => (
                        <JsonNode key={i} data={value} label={Array.isArray(data) ? undefined : key} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    )
}
