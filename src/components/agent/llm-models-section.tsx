"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { LlmModelOption, RemoteModelOption } from "@/lib/llm"

export function LlmModelsSection({
  modelOptions,
  remoteModels,
  isLoading,
  onFetchModels,
  onSaveModelOption,
  onCreateModelOption,
}: {
  modelOptions: LlmModelOption[]
  remoteModels: RemoteModelOption[]
  isLoading: boolean
  onFetchModels: () => void
  onSaveModelOption: (
    option: LlmModelOption,
    patch: Partial<LlmModelOption>,
  ) => void
  onCreateModelOption: (modelName: string) => void
}) {
  return (
    <section className="mt-6 space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Models</h2>
          <p className="text-sm text-muted-foreground">
            Load remote models when needed, then create explicit options and tune priority.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onFetchModels}
          disabled={isLoading}
        >
          Fetch Remote Models
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead>Last Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modelOptions.length ? (
            modelOptions.map((option) => (
              <TableRow key={option.id}>
                <TableCell className="font-mono text-xs">
                  {option.modelName}
                </TableCell>
                <TableCell>
                  <Input
                    className="w-24"
                    type="number"
                    defaultValue={option.priority}
                    onBlur={(event) =>
                      onSaveModelOption(option, {
                        priority: Number(event.target.value),
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {option.isAvailable ? "Available" : "Recovering"}
                    </div>
                    {!option.isAvailable && option.recoverTime ? (
                      <div className="text-[11px] text-muted-foreground">
                        recover: {option.recoverTime}
                      </div>
                    ) : null}
                    {option.lastCheckedTime ? (
                      <div className="text-[11px] text-muted-foreground">
                        checked: {option.lastCheckedTime}
                      </div>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  success {option.successCount || 0} / fail{" "}
                  {option.failCount || 0}
                </TableCell>
                <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                  {option.lastError || "-"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                No model options yet. Fetch remote models and add the ones you want to use.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="space-y-3 rounded-xl border border-dashed p-4">
        <div>
          <h3 className="text-sm font-semibold">Remote Models</h3>
          <p className="text-xs text-muted-foreground">
            Fetch reads provider models only. Add creates a local option explicitly.
          </p>
        </div>
        {remoteModels.length ? (
          <div className="space-y-2">
            {remoteModels.map((item) => {
              const exists = modelOptions.some(
                (option) => option.modelName === item.modelName,
              )
              return (
                <div
                  key={item.modelName}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="font-mono text-xs">{item.modelName}</div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={exists || isLoading}
                    onClick={() => onCreateModelOption(item.modelName)}
                  >
                    {exists ? "Added" : "Add Option"}
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            No remote models loaded yet.
          </div>
        )}
      </div>
    </section>
  )
}
