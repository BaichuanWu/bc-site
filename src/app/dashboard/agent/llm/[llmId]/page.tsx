"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"

import { LlmEditor } from "@/components/agent/llm-editor"

export default function LlmEditPage() {
  const params = useParams()
  const llmId = Number(params.llmId)

  if (!Number.isFinite(llmId) || llmId <= 0) {
    return <div className="p-8 text-center text-muted-foreground">Invalid LLM id.</div>
  }

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      }
    >
      <LlmEditor mode="edit" llmId={llmId} />
    </Suspense>
  )
}
