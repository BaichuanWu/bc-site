"use client"

import * as React from "react"

import { apiClient } from "@/lib/api"
import {
  type WorkflowRecord,
} from "@/lib/workflow-studio"
import { useAsyncAction } from "@/hooks/use-async-action"
import { useCrud } from "@/hooks/use-crud"
import { useDeleteAction } from "@/hooks/use-delete-action"

export type {
  AgentRecord,
  WorkflowAgentOption,
  WorkflowFormState,
  WorkflowPreview,
  WorkflowRecord,
} from "@/lib/workflow-studio"

export function useWorkflowStudio() {
  const workflowCrud = useCrud<WorkflowRecord>("/workflow-definition")
  const publishAction = useAsyncAction()
  const deleteAction = useDeleteAction()
  const [runningWorkflow, setRunningWorkflow] =
    React.useState<WorkflowRecord | null>(null)

  const handlePublishWorkflow = React.useCallback(
    async (workflowId: number) => {
      await publishAction.run(
        async () => {
          await apiClient.post("/workflow-definition/publish", {
            workflowId: workflowId,
          })
        },
        {
          successMessage: "Workflow published successfully",
          errorMessage: "Failed to publish workflow",
          onSuccess: async () => {
            await workflowCrud.mutate()
          },
        },
      )
    },
    [publishAction, workflowCrud],
  )

  const handleOpenRunDialog = React.useCallback((workflow: WorkflowRecord) => {
    setRunningWorkflow(workflow)
  }, [])

  return {
    workflowCrud,
    publishAction,
    deleteAction,
    runningWorkflow,
    setRunningWorkflow,
    handlePublishWorkflow,
    handleOpenRunDialog,
  }
}
