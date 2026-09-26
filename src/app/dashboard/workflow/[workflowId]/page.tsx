"use client"

import { useParams } from "next/navigation"

import { WorkflowDetailPage } from "@/components/workflow/studio/detail-page"

export default function WorkflowDetailRoutePage() {
  const params = useParams<{ workflowId: string }>()
  const workflowId = Number(params.workflowId)

  if (!Number.isFinite(workflowId) || workflowId <= 0) {
    return <WorkflowDetailPage mode="create" />
  }

  return <WorkflowDetailPage mode="edit" workflowId={workflowId} />
}
