"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import MDEditor, { commands, type ICommand } from "@uiw/react-md-editor"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useTheme } from "next-themes"
import { GripVertical, Maximize2, PencilLine, Minimize2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { MarkdownTemplate } from "@/lib/markdown-templates"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  templates?: MarkdownTemplate[]
}

const calloutCommand: ICommand = {
  name: "callout",
  keyCommand: "callout",
  buttonProps: { "aria-label": "Insert callout" },
  icon: <span className="text-[11px] font-semibold">Tip</span>,
  execute: (state, api) => {
    const block =
      state.selectedText?.trim()
        ? `> [!NOTE]\n> ${state.selectedText.replace(/\n/g, "\n> ")}`
        : `> [!NOTE]\n> Key takeaway\n>\n> Why it matters`
    api.replaceSelection(block)
  },
}

const detailsCommand: ICommand = {
  name: "details",
  keyCommand: "details",
  buttonProps: { "aria-label": "Insert details block" },
  icon: <span className="text-[11px] font-semibold">Fold</span>,
  execute: (_, api) => {
    api.replaceSelection(
      `<details>\n<summary>Expand for notes</summary>\n\n- Point one\n- Point two\n\n</details>`
    )
  },
}

const checklistCommand: ICommand = {
  name: "checklist",
  keyCommand: "checklist",
  buttonProps: { "aria-label": "Insert checklist" },
  icon: <span className="text-[11px] font-semibold">Todo</span>,
  execute: (_, api) => {
    api.replaceSelection(`- [ ] First item\n- [ ] Second item\n- [ ] Third item`)
  },
}

const helpCommand: ICommand = {
  name: "md-help",
  keyCommand: "md-help",
  buttonProps: { "aria-label": "Open markdown guide" },
  icon: <span className="text-[11px] font-semibold">Help</span>,
  execute: () => {
    window.open("https://www.markdownguide.org/basic-syntax/", "_blank", "noopener,noreferrer")
  },
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  templates = [],
}: MarkdownEditorProps) {
  const { resolvedTheme } = useTheme()
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("")
  const [isMounted, setIsMounted] = React.useState(false)
  const [splitRatio, setSplitRatio] = React.useState(0.52)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen])

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    if (!isMounted) return
    const { body, documentElement } = document
    const previousOverflow = body.style.overflow

    if (isFullscreen) {
      body.style.overflow = "hidden"
      documentElement.dataset.mdEditorFullscreen = "true"
    } else {
      delete documentElement.dataset.mdEditorFullscreen
    }

    return () => {
      body.style.overflow = previousOverflow
      delete documentElement.dataset.mdEditorFullscreen
    }
  }, [isFullscreen, isMounted])

  const colorMode = resolvedTheme === "dark" ? "dark" : "light"

  const stats = React.useMemo(() => {
    const safeValue = value || ""
    const trimmed = safeValue.trim()
    const words = trimmed ? trimmed.split(/\s+/).length : 0
    const lines = safeValue ? safeValue.split(/\n/).length : 0
    const chars = safeValue.length
    const readingMinutes = words === 0 ? "0 min read" : words < 200 ? "<1 min read" : `${Math.ceil(words / 200)} min read`
    return { words, lines, chars, readingMinutes }
  }, [value])

  const commandList = React.useMemo(
    () => [
      ...commands.getCommands(),
      commands.divider,
      calloutCommand,
      detailsCommand,
      checklistCommand,
    ],
    []
  )

  const extraCommandList = React.useMemo(
    () => [
      commands.divider,
      helpCommand,
    ],
    []
  )

  const selectedTemplate = React.useMemo(
    () => templates.find((item) => item.id === selectedTemplateId) || null,
    [selectedTemplateId, templates]
  )

  const applyTemplate = React.useCallback(
    (mode: "replace" | "append") => {
      if (!selectedTemplate) return
      if (mode === "replace") {
        if (value.trim() && !window.confirm("Replace the current markdown content with the selected template?")) {
          return
        }
        onChange(selectedTemplate.content)
        return
      }
      const nextValue = value.trim()
        ? `${value.replace(/\s*$/, "")}\n\n---\n\n${selectedTemplate.content}`
        : selectedTemplate.content
      onChange(nextValue)
    },
    [onChange, selectedTemplate, value]
  )

  const editor = (
    <div
      data-color-mode={colorMode}
      style={
        isFullscreen
          ? ({
              ["--editor-pane-width" as string]: `${Math.round(splitRatio * 100)}%`,
            } as React.CSSProperties)
          : undefined
      }
      className={cn(
        "markdown-editor-shell rounded-xl border bg-card shadow-sm",
        isFullscreen && "h-full"
      )}
    >
      <MDEditor
        value={value || ""}
        onChange={(nextValue) => onChange(nextValue || "")}
        preview={isFullscreen ? "live" : "edit"}
        visibleDragbar={false}
        height="100%"
        minHeight={300}
        commands={commandList}
        extraCommands={extraCommandList}
        textareaProps={{
          placeholder,
        }}
        previewOptions={{
          className: "wmde-markdown-body",
          components: {
            img: ({ src, alt, ...props }) => {
              if (!src || String(src).trim() === "") {
                return null
              }
              return <img src={src} alt={alt || ""} {...props} />
            },
          },
        }}
        data-color-mode={colorMode}
      />
    </div>
  )

  const content = (
    <div
      className={cn(
        "flex flex-col gap-2",
        isFullscreen
          ? "fixed inset-0 z-[120] bg-background p-4 md:p-6 pointer-events-none"
          : className
      )}
    >
      {isFullscreen ? (
        <>
          <div
            className={cn(
              "relative z-[140] flex items-center justify-between gap-3 rounded-2xl border bg-background/95 px-3 py-2 shadow-sm backdrop-blur pointer-events-auto shrink-0"
            )}
          >
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <div className="text-xs text-muted-foreground">
                Fullscreen live mode: source on the left, rendered markdown on the right.
              </div>
              {templates.length > 0 ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger className="h-8 w-[220px] bg-background">
                      <SelectValue placeholder="Choose a writing template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!selectedTemplate}
                    onClick={() => applyTemplate("append")}
                  >
                    Insert Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!selectedTemplate}
                    onClick={() => applyTemplate("replace")}
                  >
                    Replace with Template
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden shrink-0 items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground md:flex">
                <span>{stats.words} words</span>
                <span>{stats.lines} lines</span>
                <span>{stats.chars} chars</span>
                <span>{stats.readingMinutes}</span>
              </div>
              <div className="hidden shrink-0 items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 md:flex">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <input
                  type="range"
                  min={35}
                  max={65}
                  value={Math.round(splitRatio * 100)}
                  onChange={(event) => setSplitRatio(Number(event.target.value) / 100)}
                  className="h-1.5 w-28 accent-foreground"
                  aria-label="Adjust editor preview split"
                />
                <span className="w-14 text-right font-mono tabular-nums text-xs text-muted-foreground">
                  {Math.round(splitRatio * 100)} / {100 - Math.round(splitRatio * 100)}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(false)}
              >
                <Minimize2 className="mr-2 h-4 w-4" />
                Exit Fullscreen
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "relative z-0 min-h-[320px] flex-1 min-h-0 pointer-events-auto"
            )}
          >
            {editor}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Preview mode. Open fullscreen when you want to edit.
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(true)}
            >
              <PencilLine className="mr-2 h-4 w-4" />
              Edit in Fullscreen
            </Button>
          </div>

          <div className="block w-full rounded-xl border bg-card text-left shadow-sm">
            <div
              data-color-mode={colorMode}
              className="wmde-markdown-var px-5 py-4"
            >
              <div className="wmde-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value?.trim() ? value : "*Empty content.*"}
              </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (isFullscreen && isMounted) {
    return createPortal(content, document.body)
  }

  return content
}
