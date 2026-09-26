"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { LlmFormState } from "@/lib/llm"

export function LlmFormSection({
  form,
  onChange,
}: {
  form: LlmFormState
  onChange: (updater: (prev: LlmFormState) => LlmFormState) => void
}) {
  return (
    <section className="grid gap-4 rounded-2xl border bg-card p-6 shadow-sm lg:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="llm-name">Config Name</Label>
        <Input
          id="llm-name"
          value={form.name}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, name: event.target.value }))
          }
          placeholder="e.g. GPT-4o Official"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="llm-provider">Provider</Label>
        <Input
          id="llm-provider"
          value={form.provider}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, provider: event.target.value }))
          }
          placeholder="openai, deepseek..."
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="llm-model-name">Model Name</Label>
        <Input
          id="llm-model-name"
          value={form.defaultModel}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, defaultModel: event.target.value }))
          }
          placeholder="gpt-4o"
        />
      </div>
      <div className="grid gap-2 lg:col-span-2">
        <Label htmlFor="llm-api-key">API Key</Label>
        <Input
          id="llm-api-key"
          type="password"
          value={form.apiKey}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, apiKey: event.target.value }))
          }
        />
      </div>
      <div className="grid gap-2 lg:col-span-2">
        <Label htmlFor="llm-base-url">Base URL</Label>
        <Input
          id="llm-base-url"
          value={form.baseUrl}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, baseUrl: event.target.value }))
          }
          placeholder="https://api.openai.com/v1"
        />
      </div>
    </section>
  )
}
