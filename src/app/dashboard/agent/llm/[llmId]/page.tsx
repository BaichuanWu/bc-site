"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"

import { LlmDetailPage } from "@/components/agent/llm-detail-page"

export default function LlmEditPage() {
  const params = useParams()
  const llmId = Number(params.llmId)

  if (!Number.isFinite(llmId) || llmId <= 0) {
    return (
      <Suspense
        fallback={
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        }
      >
        <LlmDetailPage mode="create" />
      </Suspense>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      }
    >
      <LlmDetailPage mode="edit" llmId={llmId} />
    </Suspense>
  )
}
