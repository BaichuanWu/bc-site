"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
}: MarkdownEditorProps) {
  return (
    <Tabs defaultValue="edit" className={className}>
      <TabsList className="mb-2">
        <TabsTrigger value="edit">Editor</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="edit" className="mt-0">
        <Textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[300px] font-mono text-sm resize-y"
        />
      </TabsContent>
      <TabsContent value="preview" className="mt-0">
        <ScrollArea className="min-h-[300px] w-full border rounded-md p-4 bg-muted/50">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || "*Empty content*"}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  )
}
