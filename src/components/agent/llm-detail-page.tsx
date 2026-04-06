"use client"

import * as React from "react"
import useSWR from "swr"

import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  model_name: string
  api_key: string
  base_url: string
  is_active: number
}

type LlmFormState = {
  name: string
  provider: string
  model_name: string
  api_key: string
  base_url: string
  is_active: string
}

const EMPTY_FORM: LlmFormState = {
  name: "",
  provider: "openai",
  model_name: "gpt-4o",
  api_key: "",
  base_url: "",
  is_active: "1",
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

  const llm = React.useMemo(
    () => normalizeCrudListResponse<LlmRecord>(llmResponse)[0] || null,
    [llmResponse],
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
      model_name: llm.model_name || "gpt-4o",
      api_key: llm.api_key || "",
      base_url: llm.base_url || "",
      is_active: String(llm.is_active ?? 1),
    })
  }, [isCreate, llm])

  const handleSave = React.useCallback(async () => {
    await saveAction.run(
      async () => {
        const payload = {
          name: form.name,
          provider: form.provider,
          model_name: form.model_name,
          api_key: form.api_key,
          base_url: form.base_url,
          is_active: Number(form.is_active),
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
          <Badge variant={Number(form.is_active) === 1 ? "default" : "secondary"}>
            {Number(form.is_active) === 1 ? "Active" : "Inactive"}
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
            value={form.model_name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, model_name: event.target.value }))
            }
            placeholder="gpt-4o"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="llm-status">Status</Label>
          <Select
            value={form.is_active}
            onValueChange={(value) => setForm((prev) => ({ ...prev, is_active: value }))}
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
            value={form.api_key}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, api_key: event.target.value }))
            }
          />
        </div>
        <div className="grid gap-2 lg:col-span-2">
          <Label htmlFor="llm-base-url">Base URL</Label>
          <Input
            id="llm-base-url"
            value={form.base_url}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, base_url: event.target.value }))
            }
            placeholder="https://api.openai.com/v1"
          />
        </div>
      </section>
    </DetailPageLayout>
  )
}
