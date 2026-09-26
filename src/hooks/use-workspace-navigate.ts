"use client"

import * as React from "react"

import { useWorkspaceTabs } from "@/components/workspace/workspace-tabs-provider"

export function useWorkspaceNavigate() {
  const { navigateToDashboard } = useWorkspaceTabs()

  return React.useCallback(
    (
      pathname: string,
      search?: string | URLSearchParams,
      options?: { title?: string; closable?: boolean },
    ) => {
      const normalizedSearch =
        search instanceof URLSearchParams ? search.toString() : search
      navigateToDashboard(pathname, normalizedSearch, options)
    },
    [navigateToDashboard],
  )
}
