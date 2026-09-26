"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AgentFormState } from "@/lib/agent"

export function AgentIdentitySection({
  form,
  agentClassOptions,
  isCreate,
  onChange,
}: {
  form: AgentFormState
  agentClassOptions: string[]
  isCreate: boolean
  onChange: (updater: (prev: AgentFormState) => AgentFormState) => void
}) {
  return (
    <section className="space-y-4 rounded-2xl border bg-background p-5">
      <div className="text-sm font-semibold">Agent Identity</div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, name: e.target.value }))
            }
            disabled={!isCreate}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="agentClass">Implementation Class</Label>
          <Input
            id="agentClass"
            value={form.agentClass}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, agentClass: e.target.value }))
            }
            disabled={!isCreate}
            list="agent-class-options"
          />
          <datalist id="agent-class-options">
            {agentClassOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, description: e.target.value }))
            }
            className="min-h-24"
          />
        </div>
      </div>
    </section>
  )
}
