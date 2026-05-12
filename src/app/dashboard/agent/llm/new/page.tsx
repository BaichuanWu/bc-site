"use client"

import { Suspense } from "react"

import { LlmEditor } from "@/components/agent/llm-editor"

export default function NewLlmPage() {
  return (
    <Suspense
      fallback={
        // dashboard-standards-ignore-next-line: Suspense fallback is local to the editor route.
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      }
    >
      <LlmEditor mode="create" />
    </Suspense>
  )
}
