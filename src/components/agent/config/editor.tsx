"use client"

import * as React from "react"

import { MarkdownEditor } from "@/components/common/markdown-editor"
import { RemoteSelect } from "@/components/common/remote-select"
import { ModelSchemaEditor } from "@/components/workflow/schema/model-schema-editor"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatJsonText } from "@/lib/json-utils"
import { getJsonObject, type JsonValue } from "@/types/json"

export type AgentConfigSpecField = {
  path: string
  name?: string
  label: string
  description?: string
  required?: boolean
  component?: string
  python_type?: string
  default?: JsonValue
  placeholder?: string
  readonly?: boolean
  options?: Array<{ label?: string; value?: string | number | boolean } | string | number | boolean>
}

export type AgentConfigSpecSection = {
  key: string
  title: string
  description?: string
  fields: AgentConfigSpecField[]
}

export type AgentConfigSpec = {
  version?: string
  defaults?: Record<string, unknown>
  sections?: AgentConfigSpecSection[]
  schema?: Record<string, unknown>
}

type SelectOptionValue = string | number | boolean

type AgentConfigEditorProps = {
  spec: AgentConfigSpec | null | undefined
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}

function getValueAtPath(source: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined
    return (current as Record<string, unknown>)[part]
  }, source)
}

function setValueAtPath(
  source: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const parts = path.split(".")
  const next = structuredClone(source)
  let cursor: Record<string, unknown> = next
  for (const part of parts.slice(0, -1)) {
    const existing = cursor[part]
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      cursor[part] = {}
    }
    cursor = cursor[part] as Record<string, unknown>
  }
  cursor[parts[parts.length - 1]] = value as JsonValue
  return next
}

function JsonFieldEditor({
  label,
  description,
  value,
  emptyValue,
  onChange,
}: {
  label: string
  description?: string
  value: unknown
  emptyValue: unknown
  onChange: (next: unknown) => void
}) {
  const formattedValue = React.useMemo(
    () => formatJsonText(value, "{}"),
    [value],
  )
  const [text, setText] = React.useState(formattedValue)

  React.useEffect(() => {
    setText(formattedValue)
  }, [formattedValue])

  const error = React.useMemo(() => {
    if (!text.trim()) return null
    try {
      JSON.parse(text)
      return null
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid JSON"
    }
  }, [text])

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label>{label}</Label>
        {description ? (
          <div className="text-xs text-muted-foreground">{description}</div>
        ) : null}
      </div>
      <Textarea
        value={text}
        onChange={(e) => {
          const nextText = e.target.value
          setText(nextText)
          try {
            onChange(nextText.trim() ? JSON.parse(nextText) : emptyValue)
          } catch {
            // Keep invalid JSON local until user fixes it.
          }
        }}
        className="min-h-32 font-mono text-xs"
      />
      <Badge variant={error ? "destructive" : "secondary"}>
        {error ? error : "Valid JSON"}
      </Badge>
    </div>
  )
}

function normalizeSelectOption(
  option: { label?: string; value?: string | number | boolean } | string | number | boolean,
) {
  if (typeof option === "object" && option !== null) {
    return {
      label: option.label ?? String(option.value ?? ""),
      value: option.value as SelectOptionValue,
    }
  }
  return {
    label: String(option),
    value: option as SelectOptionValue,
  }
}

export function AgentConfigEditor({
  spec,
  value,
  onChange,
}: AgentConfigEditorProps) {
  const sections = spec?.sections || []

  const renderField = React.useCallback(
    (field: AgentConfigSpecField) => {
      const currentValue = getValueAtPath(value, field.path)
      const apply = (nextValue: unknown) => onChange(setValueAtPath(value, field.path, nextValue))

      if (field.component === "markdown") {
        return (
          <div className="space-y-2" key={field.path}>
            <div className="space-y-1">
              <Label>{field.label}</Label>
              {field.description ? (
                <div className="text-xs text-muted-foreground">{field.description}</div>
              ) : null}
            </div>
            <MarkdownEditor
              value={typeof currentValue === "string" ? currentValue : ""}
              onChange={apply}
              placeholder={field.placeholder || field.label}
            />
          </div>
        )
      }

      if (field.component === "llm_select") {
        return (
          <div className="space-y-2" key={field.path}>
            <div className="space-y-1">
              <Label>{field.label}</Label>
              {field.description ? (
                <div className="text-xs text-muted-foreground">{field.description}</div>
              ) : null}
            </div>
            <RemoteSelect
              endpoint="/agent/llm?limit=100"
              value={typeof currentValue === "number" ? currentValue : null}
              onValueChange={apply}
              placeholder={field.placeholder || "Select an LLM"}
            />
          </div>
        )
      }

      if (field.component === "schema_json") {
        return (
          <ModelSchemaEditor
            key={field.path}
            title={field.label}
            description={field.description}
            value={getJsonObject(currentValue as JsonValue) || {}}
            onChange={(next) => apply(next)}
          />
        )
      }

      if (field.component === "json") {
        return (
          <JsonFieldEditor
            key={field.path}
            label={field.label}
            description={field.description}
            value={currentValue}
            emptyValue={field.default ?? {}}
            onChange={apply}
          />
        )
      }

      if (field.component === "number") {
        return (
          <div className="space-y-2" key={field.path}>
            <div className="space-y-1">
              <Label>{field.label}</Label>
              {field.description ? (
                <div className="text-xs text-muted-foreground">{field.description}</div>
              ) : null}
            </div>
            <Input
              type="number"
              value={typeof currentValue === "number" ? currentValue : Number(field.default ?? 0)}
              onChange={(e) => apply(Number(e.target.value))}
              placeholder={field.placeholder}
              disabled={field.readonly}
            />
          </div>
        )
      }

      if (field.component === "switch") {
        return (
          <div className="flex items-center justify-between rounded-xl border p-3" key={field.path}>
            <div className="space-y-1">
              <Label>{field.label}</Label>
              {field.description ? (
                <div className="text-xs text-muted-foreground">{field.description}</div>
              ) : null}
            </div>
            <Checkbox
              checked={Boolean(currentValue)}
              onCheckedChange={(checked) => apply(Boolean(checked))}
              disabled={field.readonly}
            />
          </div>
        )
      }

      if (field.component === "select" && field.options?.length) {
        const normalizedOptions = field.options.map(normalizeSelectOption)
        return (
          <div className="space-y-2" key={field.path}>
            <div className="space-y-1">
              <Label>{field.label}</Label>
              {field.description ? (
                <div className="text-xs text-muted-foreground">{field.description}</div>
              ) : null}
            </div>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={String(
                normalizedOptions.find(
                  (option) => String(option.value) === String(currentValue ?? "")
                )?.value ??
                  field.default ??
                  ""
              )}
              onChange={(e) => {
                const selected = normalizedOptions.find(
                  (option) => String(option.value) === e.target.value
                )
                apply(selected?.value ?? "")
              }}
              disabled={field.readonly}
            >
              <option value="">Select...</option>
              {normalizedOptions.map((option, index) => (
                <option key={index} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )
      }

      return (
        <div className="space-y-2" key={field.path}>
          <div className="space-y-1">
            <Label>{field.label}</Label>
            {field.description ? (
              <div className="text-xs text-muted-foreground">{field.description}</div>
            ) : null}
          </div>
          <Input
            value={typeof currentValue === "string" ? currentValue : String(currentValue ?? "")}
            onChange={(e) => apply(e.target.value)}
            placeholder={field.placeholder}
            disabled={field.readonly}
          />
        </div>
      )
    },
    [onChange, value],
  )

  if (!sections.length) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        This agent class does not expose configurable fields.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.key} className="space-y-4 rounded-2xl border p-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{section.title}</h4>
            <div className="text-xs text-muted-foreground">
              {section.description || "Agent configuration fields derived from the backend class spec."}
            </div>
          </div>
          <div className="space-y-4">{section.fields.map(renderField)}</div>
        </section>
      ))}
    </div>
  )
}
