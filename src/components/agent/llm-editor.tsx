"use client"

import * as React from "react"
import useSWR from "swr"

import { DetailPageLayout } from "@/components/common/detail-page-layout"
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
import { useAsyncAction } from "@/hooks/use-async-action"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { apiClient, fetcher } from "@/lib/api"
import { normalizeCrudListResponse } from "@/lib/crud-response"
import { useWorkspaceTabs } from "@/components/workspace/workspace-tabs-provider"

type LlmRecord = {
  id: number
  name: string
  provider: string
  defaultModel: string
  apiKey: string
  baseUrl: string
}

type LlmModelOption = {
  id: number
  llmId: number
  modelName: string
  priority: number
  recoverTime: string
  lastError: string
  lastCheckedTime: string
  successCount: number
  failCount: number
  isAvailable: boolean
}

type RemoteModelOption = {
  modelName: string
}

type LlmFormState = {
  name: string
  provider: string
  defaultModel: string
  apiKey: string
  baseUrl: string
}

const EMPTY_FORM: LlmFormState = {
  name: "",
  provider: "openai",
  defaultModel: "gpt-4o",
  apiKey: "",
  baseUrl: "",
}

type LlmEditorProps =
  | { mode: "create" }
  | { mode: "edit"; llmId: number }

export function LlmEditor(props: LlmEditorProps) {
  const saveAction = useAsyncAction()
  const { currentPathname, closeTab } = useWorkspaceTabs()
  const isCreate = props.mode === "create"
  const llmId = props.mode === "edit" ? props.llmId : null
  const [form, setForm] = React.useState<LlmFormState>(EMPTY_FORM)
  const [remoteModels, setRemoteModels] = React.useState<RemoteModelOption[]>([])

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
  const modelOptions = React.useMemo(
    () => modelOptionsResponse?.items || [],
    [modelOptionsResponse],
  )

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
      defaultModel: llm.defaultModel || "gpt-4o",
      apiKey: llm.apiKey || "",
      baseUrl: llm.baseUrl || "",
    })
  }, [isCreate, llm])

  const handleSave = React.useCallback(async () => {
    await saveAction.run(
      async () => {
        const payload = {
          name: form.name,
          provider: form.provider,
          defaultModel: form.defaultModel,
          apiKey: form.apiKey,
          baseUrl: form.baseUrl,
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
        onSuccess: async () => {
          await mutate()
          closeTab(currentPathname)
        },
      },
    )
  }, [closeTab, currentPathname, form, isCreate, llmId, mutate, saveAction])

  const handleFetchModels = React.useCallback(async () => {
    await saveAction.run(
      async () =>
        (await apiClient.post("/agent/llm/fetch-models", {
          llmId,
          apiKey: form.apiKey,
          baseUrl: form.baseUrl,
        })) as {
          items: RemoteModelOption[]
          total: number
        },
      {
        successMessage: "Remote models fetched",
        errorMessage: "Failed to fetch remote models",
        onSuccess: async (response) => {
          setRemoteModels(response.items || [])
        },
      },
    )
  }, [form.apiKey, form.baseUrl, llmId, saveAction])

  const handleSaveModelOption = React.useCallback(
    async (option: LlmModelOption, patch: Partial<LlmModelOption>) => {
      const next = { ...option, ...patch }
      await saveAction.run(
        async () =>
          apiClient.put("/agent/llm/model-option", {
            id: next.id,
            priority: Number(next.priority),
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

  const handleCreateModelOption = React.useCallback(
    async (modelName: string) => {
      if (!llmId) return
      const nextPriority =
        modelOptions.reduce((max, option) => Math.max(max, Number(option.priority) || 0), -10) +
        10
      await saveAction.run(
        async () =>
          apiClient.post("/agent/llm/model-option", {
            llmId,
            modelName,
            priority: nextPriority,
          }),
        {
          successMessage: `Model option created with priority ${nextPriority}`,
          errorMessage: "Failed to create model option",
          onSuccess: async () => {
            await mutateModelOptions()
          },
        },
      )
    },
    [llmId, modelOptions, mutateModelOptions, saveAction],
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
            value={form.defaultModel}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, defaultModel: event.target.value }))
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
                Load remote models when needed, then create explicit options and tune priority.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleFetchModels}
              disabled={saveAction.isLoading}
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
                          handleSaveModelOption(option, {
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
                        disabled={exists || saveAction.isLoading}
                        onClick={() => handleCreateModelOption(item.modelName)}
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
      ) : null}
    </DetailPageLayout>
  )
}
