"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Expand, Minimize2 } from "lucide-react"

import { JsonNode } from "@/components/common/json-node"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatJsonText } from "@/lib/json-utils"
import { cn } from "@/lib/utils"
import { getJsonArray, getJsonObject, type JsonObject } from "@/types/json"

type ModelSchemaEditorProps = {
  title: string
  description?: string
  value: JsonObject | undefined
  onChange: (next: JsonObject) => void
  className?: string
  contextNote?: React.ReactNode
}

function normalizeSchemaValue(value: JsonObject | undefined): JsonObject {
  const schema = getJsonObject(value) || {}
  return {
    ...schema,
    type: "object",
  }
}

export function ModelSchemaEditor({
  title,
  description,
  value,
  onChange,
  className,
  contextNote,
}: ModelSchemaEditorProps) {
  const normalizedValue = React.useMemo(() => normalizeSchemaValue(value), [value])
  const [text, setText] = React.useState(() => formatJsonText(normalizedValue))
  const lastAppliedSignatureRef = React.useRef(JSON.stringify(normalizedValue))
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    if (!isMounted) return
    const previousOverflow = document.body.style.overflow
    if (isFullscreen) {
      document.body.style.overflow = "hidden"
      document.documentElement.dataset.schemaEditorFullscreen = "true"
    } else {
      delete document.documentElement.dataset.schemaEditorFullscreen
    }
    return () => {
      document.body.style.overflow = previousOverflow
      delete document.documentElement.dataset.schemaEditorFullscreen
    }
  }, [isFullscreen, isMounted])

  React.useEffect(() => {
    const nextSignature = JSON.stringify(normalizedValue)
    if (nextSignature === lastAppliedSignatureRef.current) {
      return
    }
    setText(formatJsonText(normalizedValue))
    lastAppliedSignatureRef.current = nextSignature
  }, [normalizedValue])

  const parsed = React.useMemo(() => {
    if (!text.trim()) return { value: { type: "object" } as JsonObject, error: null as string | null }
    try {
      const next = JSON.parse(text) as unknown
      const schemaObject = getJsonObject(next)
      if (!schemaObject) {
        return {
          value: null,
          error: "Schema must be a JSON object.",
        }
      }
      return {
        value: normalizeSchemaValue(schemaObject),
        error: null as string | null,
      }
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Invalid JSON.",
      }
    }
  }, [text])

  const parsedSummary = React.useMemo(() => {
    if (!parsed.value) {
      return { fieldCount: 0, requiredCount: 0 }
    }
    const properties = getJsonObject(parsed.value.properties)
    const required = getJsonArray(parsed.value.required) || []
    return {
      fieldCount: Object.keys(properties || {}).length,
      requiredCount: required.filter((item) => typeof item === "string").length,
    }
  }, [parsed.value])

  const handleTextChange = React.useCallback(
    (nextText: string) => {
      setText(nextText)
      if (!nextText.trim()) {
        const emptyValue = { type: "object" } as JsonObject
        const signature = JSON.stringify(emptyValue)
        if (signature !== lastAppliedSignatureRef.current) {
          lastAppliedSignatureRef.current = signature
          onChange(emptyValue)
        }
        return
      }

      try {
        const parsedValue = JSON.parse(nextText) as unknown
        const schemaObject = getJsonObject(parsedValue)
        if (!schemaObject) return
        const normalized = normalizeSchemaValue(schemaObject)
        const signature = JSON.stringify(normalized)
        if (signature === lastAppliedSignatureRef.current) return
        lastAppliedSignatureRef.current = signature
        onChange(normalized)
      } catch {
        // keep invalid text local until the user fixes it
      }
    },
    [onChange]
  )

  const previewContent = (
    <>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border bg-background/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={parsed.error ? "destructive" : "secondary"}>
              {parsed.error ? "Invalid JSON" : "Valid JSON"}
            </Badge>
            {!parsed.error ? (
              <>
                <Badge variant="outline">{parsedSummary.fieldCount} fields</Badge>
                <Badge variant="outline">{parsedSummary.requiredCount} required</Badge>
              </>
            ) : null}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
            <Expand className="mr-2 h-4 w-4" />
            Edit in Fullscreen
          </Button>
        </div>

        {contextNote ? (
          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-300">
            {contextNote}
          </div>
        ) : null}

        {parsed.error ? (
          <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {parsed.error}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            JSON syntax is valid and can be consumed by the backend schema builder.
          </div>
        )}

        <div className="mt-4">
          <div className="text-sm font-medium">Backend Parsed Object</div>
          <div className="mt-1 text-xs text-muted-foreground">
            This is the normalized object that will be written back into the workflow DSL.
          </div>
          {parsed.error ? (
            <div className="mt-3 rounded-xl border border-dashed bg-background p-4 text-sm text-muted-foreground">
              Fix the JSON error to preview the normalized schema object.
            </div>
          ) : (
            <div className="mt-3 rounded-xl border bg-background p-3">
              <JsonNode data={parsed.value} depth={0} />
            </div>
          )}
        </div>
      </div>
    </>
  )

  const fullscreenContent = (
    <div className="fixed inset-0 z-[140] bg-background p-4 md:p-6">
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-background/95 px-4 py-3 shadow-sm">
          <div className="space-y-1">
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground">
              Edit schema JSON on the left. Review validation and the backend parsed object on the right.
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
            <Minimize2 className="mr-2 h-4 w-4" />
            Exit Fullscreen
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          <div className="grid min-h-0 gap-2">
            <Label>Schema JSON</Label>
            <Textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              className="min-h-0 flex-1 font-mono text-xs"
              spellCheck={false}
            />
          </div>

          <div className="min-h-0 space-y-3 overflow-y-auto rounded-2xl border bg-background/70 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={parsed.error ? "destructive" : "secondary"}>
                {parsed.error ? "Invalid JSON" : "Valid JSON"}
              </Badge>
              {!parsed.error ? (
                <>
                  <Badge variant="outline">{parsedSummary.fieldCount} fields</Badge>
                  <Badge variant="outline">{parsedSummary.requiredCount} required</Badge>
                </>
              ) : null}
            </div>

            {contextNote ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-300">
                {contextNote}
              </div>
            ) : null}

            <div>
              <div className="text-sm font-medium">Validation Result</div>
              {parsed.error ? (
                <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {parsed.error}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                  JSON syntax is valid and can be consumed by the backend schema builder.
                </div>
              )}
            </div>

            <div>
              <div className="text-sm font-medium">Backend Parsed Object</div>
              <div className="mt-1 text-xs text-muted-foreground">
                This is the normalized object that will be written back into the workflow DSL.
              </div>
              {parsed.error ? (
                <div className="mt-3 rounded-xl border border-dashed bg-background p-4 text-sm text-muted-foreground">
                  Fix the JSON error to preview the normalized schema object.
                </div>
              ) : (
                <div className="mt-3 rounded-xl border bg-background p-3">
                  <JsonNode data={parsed.value} depth={0} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className={cn(className || "space-y-4 rounded-2xl border bg-muted/10 p-4")}>
      {previewContent}
      {isMounted && isFullscreen ? createPortal(fullscreenContent, document.body) : null}
    </div>
  )
}
