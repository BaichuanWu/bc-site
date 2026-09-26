"use client"

import {
  AgentConfigEditor,
  type AgentConfigSpec,
} from "@/components/agent/config/editor"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AgentRecord, AgentVersionRecord, VersionFormState } from "@/lib/agent"

export function AgentVersionEditor({
  agent,
  editingVersion,
  form,
  spec,
  onChange,
  onCancel,
  onSave,
}: {
  agent: AgentRecord
  editingVersion: AgentVersionRecord | null
  form: VersionFormState
  spec: AgentConfigSpec | null
  onChange: (updater: (prev: VersionFormState) => VersionFormState) => void
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <section className="space-y-6 rounded-2xl border border-primary/20 bg-background p-5">
      <div className="space-y-1">
        <div className="text-sm font-semibold">
          {editingVersion ? "Edit Agent Version" : "Create Agent Version"}
        </div>
        <div className="text-xs text-muted-foreground">
          {agent.name} · {agent.agentClass}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            value={form.version}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, version: e.target.value }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="versionStatus">Default</Label>
          <div className="flex h-10 items-center rounded-md border px-3">
            <Checkbox
              checked={form.isDefault}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                onChange((prev) => ({
                  ...prev,
                  isDefault: Boolean(checked),
                }))
              }
            />
            <span className="ml-3 text-sm">
              {form.isDefault ? "Default version" : "Non-default version"}
            </span>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="versionDescription">Description</Label>
          <Textarea
            id="versionDescription"
            value={form.description}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            className="min-h-24"
          />
        </div>
      </div>

      <AgentConfigEditor
        spec={spec}
        value={form.configJson}
        onChange={(next) =>
          onChange((prev) => ({ ...prev, configJson: next }))
        }
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSave}>Save Version</Button>
      </div>
    </section>
  )
}
