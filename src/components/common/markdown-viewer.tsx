'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

export const MarkdownViewer = ({ content, className }: { content: string, className?: string }) => {
    if (!content) return null
    
    return (
        <div className={cn("markdown-body p-4 bg-muted/20 rounded-lg overflow-x-auto", className)}>
            <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                    pre: ({...props}) => <pre className="bg-muted p-4 rounded-lg my-4 overflow-x-auto border border-border shadow-inner" {...props} />,
                    code: ({className: codeClass, children, ...props}) => {
                        const match = /language-(\w+)/.exec(codeClass || '')
                        const inline = !match
                        return inline 
                            ? <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-[0.9em]" {...props}>{children}</code>
                            : <code className="text-muted-foreground font-mono text-xs block" {...props}>{children}</code>
                    },
                    h1: ({...props}) => <h1 className="text-lg font-bold mt-6 mb-4 border-b pb-2" {...props} />,
                    h2: ({...props}) => <h2 className="text-md font-bold mt-4 mb-2 text-primary" {...props} />,
                    p: ({...props}) => <p className="mb-4 leading-relaxed text-sm opacity-90" {...props} />,
                    ul: ({...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                    li: ({...props}) => <li className="text-sm" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
