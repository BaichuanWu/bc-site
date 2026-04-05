"use client"

import { useParams } from "next/navigation"

import { LlmDetailPage } from "@/components/agent/llm-detail-page"

export default function LlmEditPage() {
  const params = useParams()
  const llmId = Number(params.llmId)

  if (!Number.isFinite(llmId) || llmId <= 0) {
    return <LlmDetailPage mode="create" />
  }

  return <LlmDetailPage mode="edit" llmId={llmId} />
}

