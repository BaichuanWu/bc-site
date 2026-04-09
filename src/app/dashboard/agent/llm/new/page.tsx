"use client"

import { Suspense } from "react"

import { LlmDetailPage } from "@/components/agent/llm-detail-page"

export default function NewLlmPage() {
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
