"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { JsonNode } from "@/components/common/json-node"
import { cn } from "@/lib/utils"

type ConversationMessageContentProps = {
  content: unknown
  inverted?: boolean
}

function omitTextField(value: Record<string, unknown>) {
  const entries = Object.entries(value).filter(([key]) => key !== "text")
  return Object.fromEntries(entries)
}

function MarkdownContent({ value, inverted }: { value: string; inverted?: boolean }) {
  return (
    <div
      className={cn(
        "min-w-0 max-w-none break-words text-sm leading-6",
        inverted ? "text-primary-foreground" : "text-foreground",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                "mb-3 border-l-2 pl-3 last:mb-0",
                inverted ? "border-primary-foreground/40" : "border-border text-muted-foreground",
              )}
            >
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = Boolean(className)
            if (isBlock) {
              return (
                <code className={cn("block overflow-x-auto whitespace-pre rounded-md border p-3 text-xs", inverted ? "border-primary-foreground/20 bg-primary-foreground/10" : "bg-muted")}>
                  {children}
                </code>
              )
            }
            return (
              <code className={cn("rounded px-1 py-0.5 font-mono text-xs", inverted ? "bg-primary-foreground/15" : "bg-muted")}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => <pre className="mb-3 max-w-full overflow-x-auto last:mb-0">{children}</pre>,
          table: ({ children }) => (
            <div className="mb-3 max-w-full overflow-x-auto last:mb-0">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className={cn("border px-2 py-1 text-left font-semibold", inverted ? "border-primary-foreground/25" : "border-border")}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={cn("border px-2 py-1 align-top", inverted ? "border-primary-foreground/25" : "border-border")}>
              {children}
            </td>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={cn("underline underline-offset-2", inverted ? "text-primary-foreground" : "text-primary")}
            >
              {children}
            </a>
          ),
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  )
}

export function ConversationMessageContent({ content, inverted }: ConversationMessageContentProps) {
  if (typeof content === "string") {
    return <MarkdownContent value={content} inverted={inverted} />
  }

  if (content && typeof content === "object" && !Array.isArray(content)) {
    const record = content as Record<string, unknown>
    const text = record.text
    const rest = omitTextField(record)

    if (typeof text === "string") {
      return (
        <div className="space-y-3">
          <MarkdownContent value={text} inverted={inverted} />
          {Object.keys(rest).length > 0 ? (
            <div className={cn("rounded-md border p-3", inverted ? "border-primary-foreground/20 bg-primary-foreground/10" : "bg-muted/40")}>
              <JsonNode data={rest} depth={0} />
            </div>
          ) : null}
        </div>
      )
    }
  }

  if (content === null || content === undefined || content === "") {
    return <span className="text-muted-foreground">Empty message</span>
  }

  return (
    <div className={cn("max-w-full overflow-x-auto rounded-md border p-3", inverted ? "border-primary-foreground/20 bg-primary-foreground/10" : "bg-muted/40")}>
      <JsonNode data={content} depth={0} />
    </div>
  )
}

