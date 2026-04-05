"use client"

import * as React from "react"

import { useWorkspaceTabs } from "@/components/workspace/workspace-tabs-provider"

type UseWorkspaceTabTitleOptions = {
  cachedSearch?: string
  closable?: boolean
}

export function useWorkspaceTabTitle(
  pathname: string,
  title: string,
  options?: UseWorkspaceTabTitleOptions,
) {
  const { updateTabMeta } = useWorkspaceTabs()

  React.useEffect(() => {
    updateTabMeta(pathname, {
      title,
      cachedSearch: options?.cachedSearch,
      closable: options?.closable,
    })
  }, [options?.cachedSearch, options?.closable, pathname, title, updateTabMeta])
}

