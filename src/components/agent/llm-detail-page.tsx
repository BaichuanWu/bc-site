"use client"

import * as React from "react"
import useSWR from "swr"

import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAsyncAction } from "@/hooks/use-async-action"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { apiClient, fetcher } from "@/lib/api"
import { normalizeCrudListResponse } from "@/lib/crud-response"

type LlmRecord = {
  id: number
  name: string
  provider: string
  modelName: string
  apiKey: string
  baseUrl: string
  isActive: number
}

type LlmModelOption = {
  id: number
  llmId: number
  modelName: string
  priority: number
  isEnabled: number
  availabilityState: string
  cooldownUntil: string
  lastError: string
  lastCheckedTime: string
  successCount: number
  failCount: number
}

type LlmFormState = {
  name: string
  provider: string
  modelName: string
  apiKey: string
  baseUrl: string
  isActive: string
}

const EMPTY_FORM: LlmFormState = {
  name: "",
  provider: "openai",
  modelName: "gpt-4o",
  apiKey: "",
  baseUrl: "",
  isActive: "1",
}

type LlmDetailPageProps =
  | { mode: "create" }
  | { mode: "edit"; llmId: number }

export function LlmDetailPage(props: LlmDetailPageProps) {
  const saveAction = useAsyncAction()
  const isCreate = props.mode === "create"
  const llmId = props.mode === "edit" ? props.llmId : null
  const [form, setForm] = React.useState<LlmFormState>(EMPTY_FORM)

  const { data: llmResponse, mutate } = useSWR<unknown>(
    llmId
      ? `/agent/llm?q=${encodeURIComponent(JSON.stringify({ id: llmId }))}&limit=1`
      : null,
    fetcher,
  )
  const { data: modelOptionsResponse, mutate: mutateModelOptions } = useSWR<{
    items: LlmModelOption[]
    total: number
  }>(
    llmId ? `/agent/llm/${llmId}/models` : null,
    fetcher,
  )

  const llm = React.useMemo(
    () => normalizeCrudListResponse<LlmRecord>(llmResponse)[0] || null,
    [llmResponse],
  )
  const modelOptions = modelOptionsResponse?.items || []
  const hasActiveCooldown = (option: LlmModelOption) =>
    option.availabilityState === "cooldown" &&
    Boolean(option.cooldownUntil) &&
    !option.cooldownUntil.startsWith("1900-01-01")

  useWorkspaceTabTitle(
    isCreate ? "/dashboard/agent/llm/new" : `/dashboard/agent/llm/${llmId}`,
    isCreate ? "New LLM Config" : llm?.name ? `LLM: ${llm.name}` : `LLM: ${llmId}`,
  )

  React.useEffect(() => {
    if (isCreate) {
      setForm(EMPTY_FORM)
      return
    }
    if (!llm) return
    setForm({
      name: llm.name || "",
      provider: llm.provider || "openai",
      modelName: llm.modelName || "gpt-4o",
      apiKey: llm.apiKey || "",
      baseUrl: llm.baseUrl || "",
      isActive: String(llm.isActive ?? 1),
    })
  }, [isCreate, llm])

  const handleSave = React.useCallback(async () => {
    await saveAction.run(
      async () => {
        const payload = {
          name: form.name,
          provider: form.provider,
          modelName: form.modelName,
          apiKey: form.apiKey,
          baseUrl: form.baseUrl,
          isActive: Number(form.isActive),
        }
        if (isCreate) {
          return (await apiClient.post("/agent/llm", payload)) as LlmRecord
        }
        return (await apiClient.put("/agent/llm", {
          ...payload,
          id: llmId,
        })) as LlmRecord
      },
      {
        successMessage: isCreate ? "LLM config created" : "LLM config updated",
        errorMessage: "Failed to save LLM config",
        onSuccess: async (saved) => {
          const nextId = Number((saved as LlmRecord)?.id || llmId)
          if (Number.isFinite(nextId) && nextId > 0) {
            await mutate()
            window.history.replaceState(null, "", `/dashboard/agent/llm/${nextId}`)
          }
        },
      },
    )
  }, [form, isCreate, llmId, mutate, saveAction])

  const handleRefreshModels = React.useCallback(async () => {
    if (!llmId) return
    await saveAction.run(
      async () => apiClient.post(`/agent/llm/${llmId}/models/refresh`),
      {
        successMessage: "LLM models refreshed",
        errorMessage: "Failed to refresh LLM models",
        onSuccess: async () => {
          await mutateModelOptions()
        },
      },
    )
  }, [llmId, mutateModelOptions, saveAction])

  const handleSaveModelOption = React.useCallback(
    async (option: LlmModelOption, patch: Partial<LlmModelOption>) => {
      const next = { ...option, ...patch }
      await saveAction.run(
        async () =>
          apiClient.put("/agent/llm/model-option", {
            id: next.id,
            priority: Number(next.priority),
            isEnabled: Number(next.isEnabled),
          }),
        {
          successMessage: "Model option updated",
          errorMessage: "Failed to update model option",
          onSuccess: async () => {
            await mutateModelOptions()
          },
        },
      )
    },
    [mutateModelOptions, saveAction],
  )

  if (!isCreate && llmId && !llm) {
    return (
      <DetailPageLayout
        title="LLM Configuration"
        subtitle="Loading provider detail..."
      >
        <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">
          Loading provider detail...
        </div>
      </DetailPageLayout>
    )
  }

  return (
    <DetailPageLayout
      title={isCreate ? "New LLM Configuration" : llm?.name || "LLM Configuration"}
      subtitle="Manage provider defaults and credentials. Agent runtime can reference these configs."
      badge={
        !isCreate ? (
          <Badge variant={Number(form.isActive) === 1 ? "default" : "secondary"}>
            {Number(form.isActive) === 1 ? "Active" : "Inactive"}
          </Badge>
        ) : undefined
      }
      actions={
        <>
          <Button onClick={handleSave} disabled={saveAction.isLoading}>
            {saveAction.isLoading ? "Saving..." : "Save LLM Config"}
          </Button>
        </>
      }
    >
      <section className="grid gap-4 rounded-2xl border bg-card p-6 shadow-sm lg:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="llm-name">Config Name</Label>
          <Input
            id="llm-name"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
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
              setForm((prev) => ({ ...prev, provider: event.target.value }))
            }
            placeholder="openai, deepseek..."
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="llm-model-name">Model Name</Label>
          <Input
            id="llm-model-name"
            value={form.modelName}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, modelName: event.target.value }))
            }
            placeholder="gpt-4o"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="llm-status">Status</Label>
          <Select
            value={form.isActive}
            onValueChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))}
          >
            <SelectTrigger id="llm-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Active</SelectItem>
              <SelectItem value="0">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 lg:col-span-2">
          <Label htmlFor="llm-api-key">API Key</Label>
          <Input
            id="llm-api-key"
            type="password"
            value={form.apiKey}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, apiKey: event.target.value }))
            }
          />
        </div>
        <div className="grid gap-2 lg:col-span-2">
          <Label htmlFor="llm-base-url">Base URL</Label>
          <Input
            id="llm-base-url"
            value={form.baseUrl}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, baseUrl: event.target.value }))
            }
            placeholder="https://api.openai.com/v1"
          />
        </div>
      </section>
      {!isCreate ? (
        <section className="mt-6 space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Models</h2>
              <p className="text-sm text-muted-foreground">
                Refresh provider models, then tune priority and availability for runtime selection.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleRefreshModels}
              disabled={saveAction.isLoading}
            >
              Refresh Models
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Enabled</TableHead>
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
                          handleSaveModelOption(option, {
                            priority: Number(event.target.value),
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={String(option.isEnabled)}
                        onValueChange={(value) =>
                          handleSaveModelOption(option, {
                            isEnabled: Number(value),
                          })
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Enabled</SelectItem>
                          <SelectItem value="0">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant={
                            option.availabilityState === "available"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {option.availabilityState}
                        </Badge>
                        {hasActiveCooldown(option) ? (
                          <div className="text-[11px] text-muted-foreground">
                            cooldown: {option.cooldownUntil}
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
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No model options yet. Refresh models to initialize the registry.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>
      ) : null}
    </DetailPageLayout>
  )
}
