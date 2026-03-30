"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Maximize, Minimize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  // Use ESC to exit fullscreen
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  return (
    <div className={cn(
      "flex flex-col transition-all duration-200", 
      isFullscreen ? "fixed inset-4 z-[100] bg-background border shadow-2xl rounded-xl p-4 md:inset-10" : className
    )}>
      <Tabs defaultValue="edit" className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-2">
            <TabsList>
                <TabsTrigger value="edit">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
        </div>
        <TabsContent value="edit" className="flex-1 mt-0 data-[state=active]:flex flex-col min-h-0">
          <Textarea
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 font-mono text-sm resize-none h-full min-h-[300px]"
          />
        </TabsContent>
        <TabsContent value="preview" className="flex-1 mt-0 data-[state=active]:flex flex-col min-h-0">
          <ScrollArea className="flex-1 w-full border rounded-md p-4 bg-muted/50 h-full min-h-[300px]">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value || "*Empty content*"}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
