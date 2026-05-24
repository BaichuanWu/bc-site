"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { AgentVersionRecord } from "@/lib/agent"

export function AgentVersionsSection({
  versions,
  onEdit,
}: {
  versions: AgentVersionRecord[]
  onEdit: (version: AgentVersionRecord) => void
}) {
  return (
    <section className="space-y-4 rounded-2xl border bg-background p-5">
      <div className="space-y-1">
        <div className="text-sm font-semibold">Versions</div>
        <div className="text-xs text-muted-foreground">
          Prompt and config are managed per version.
        </div>
      </div>

      {versions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          No versions yet for this agent.
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version) => (
            <div key={version.id} className="rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">v{version.version}</span>
                    <Badge variant={version.isDefault ? "default" : "secondary"}>
                      {version.isDefault ? "Default" : "Non-default"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {version.description || "No version description"}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(version)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
