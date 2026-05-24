"use client"

import * as React from "react"
import useSWR from "swr"

import { LlmFormSection } from "@/components/agent/llm-form-section"
import { LlmModelsSection } from "@/components/agent/llm-models-section"
import { DetailPageLayout } from "@/components/common/detail-page-layout"
import { Button } from "@/components/ui/button"
import { useAsyncAction } from "@/hooks/use-async-action"
import { useWorkspaceTabTitle } from "@/hooks/use-workspace-tab-title"
import { apiClient, fetcher } from "@/lib/api"
import { normalizeCrudListResponse } from "@/lib/crud-response"
import { useWorkspaceTabs } from "@/components/workspace/workspace-tabs-provider"
import {
  EMPTY_LLM_FORM,
  llmFormToPayload,
  llmRecordToForm,
  nextModelOptionPriority,
  type LlmFormState,
  type LlmModelOption,
  type LlmRecord,
  type RemoteModelOption,
} from "@/lib/llm"

type LlmEditorProps =
  | { mode: "create" }
  | { mode: "edit"; llmId: number }

export function LlmEditor(props: LlmEditorProps) {
  const saveAction = useAsyncAction()
  const { currentPathname, closeTab } = useWorkspaceTabs()
  const isCreate = props.mode === "create"
  const llmId = props.mode === "edit" ? props.llmId : null
  const [form, setForm] = React.useState<LlmFormState>(EMPTY_LLM_FORM)
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
      setForm(EMPTY_LLM_FORM)
      return
    }
    if (!llm) return
    setForm(llmRecordToForm(llm))
  }, [isCreate, llm])

  const handleSave = React.useCallback(async () => {
    await saveAction.run(
      async () => {
        const payload = llmFormToPayload(form)
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
      const nextPriority = nextModelOptionPriority(modelOptions)
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
      <LlmFormSection form={form} onChange={setForm} />
      {!isCreate ? (
        <LlmModelsSection
          modelOptions={modelOptions}
          remoteModels={remoteModels}
          isLoading={saveAction.isLoading}
          onFetchModels={handleFetchModels}
          onSaveModelOption={handleSaveModelOption}
          onCreateModelOption={handleCreateModelOption}
        />
      ) : null}
    </DetailPageLayout>
  )
}
