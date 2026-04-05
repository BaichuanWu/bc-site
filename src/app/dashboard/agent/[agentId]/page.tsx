"use client"

import { useParams, useSearchParams } from "next/navigation"

import { AgentDetailPage } from "@/components/agent/detail-page"

export default function AgentDetailRoutePage() {
  const params = useParams<{ agentId: string }>()
  const searchParams = useSearchParams()
  const agentId = Number(params.agentId)
  const versionId = Number(searchParams.get("versionId"))

  if (!Number.isFinite(agentId) || agentId <= 0) {
    return <AgentDetailPage mode="create" />
  }

  return (
    <AgentDetailPage
      mode="edit"
      agentId={agentId}
      initialVersionId={Number.isFinite(versionId) ? versionId : undefined}
    />
  )
}
