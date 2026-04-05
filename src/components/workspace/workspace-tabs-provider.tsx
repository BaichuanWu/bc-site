"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  buildWorkspaceHref,
  createDefaultWorkspaceState,
  ensureWorkspaceDefaults,
  getWorkspaceTitleFallback,
  isDashboardPath,
  loadWorkspaceTabsState,
  removeWorkspaceTab,
  saveWorkspaceTabsState,
  type WorkspaceTab,
  type WorkspaceTabsState,
  updateWorkspaceTabMeta,
  upsertWorkspaceTab,
} from "@/lib/workspace-tabs"

type WorkspaceNavigateOptions = {
  title?: string
  closable?: boolean
}

type WorkspaceTabsContextValue = {
  tabs: WorkspaceTab[]
  activeTabKey: string
  currentPathname: string
  currentSearch: string
  openTab: (input: {
    pathname: string
    search?: string
    title?: string
    closable?: boolean
  }) => void
  activateTab: (pathname: string) => void
  closeTab: (pathname: string) => void
  updateTabMeta: (
    pathname: string,
    patch: Partial<Pick<WorkspaceTab, "title" | "closable" | "cachedSearch">>,
  ) => void
  navigateToDashboard: (
    pathname: string,
    search?: string,
    options?: WorkspaceNavigateOptions,
  ) => void
}

const WorkspaceTabsContext =
  React.createContext<WorkspaceTabsContextValue | null>(null)

export function WorkspaceTabsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const [state, setState] = React.useState<WorkspaceTabsState>(() =>
    createDefaultWorkspaceState(),
  )
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const loaded = loadWorkspaceTabsState()
    setState(loaded)
    setHydrated(true)
    if (pathname === "/dashboard" && loaded.activeTabKey !== "/dashboard") {
      const activeTab = loaded.tabs.find((tab) => tab.key === loaded.activeTabKey)
      if (activeTab) {
        router.replace(buildWorkspaceHref(activeTab.pathname, activeTab.cachedSearch))
      }
    }
  }, [pathname, router])

  React.useEffect(() => {
    if (!hydrated || !isDashboardPath(pathname)) return
    setState((prev) =>
      upsertWorkspaceTab(prev, {
        pathname,
        search,
        title:
          prev.tabs.find((tab) => tab.pathname === pathname)?.title ||
          getWorkspaceTitleFallback(pathname),
      }),
    )
  }, [hydrated, pathname, search])

  React.useEffect(() => {
    if (!hydrated) return
    saveWorkspaceTabsState(ensureWorkspaceDefaults(state))
  }, [hydrated, state])

  const openTab = React.useCallback<WorkspaceTabsContextValue["openTab"]>((input) => {
    setState((prev) => upsertWorkspaceTab(prev, input))
  }, [])

  const activateTab = React.useCallback<WorkspaceTabsContextValue["activateTab"]>(
    (targetPathname) => {
      const now = Date.now()
      setState((prev) =>
        ensureWorkspaceDefaults({
          ...prev,
          tabs: prev.tabs.map((tab) =>
            tab.pathname === targetPathname
              ? {
                  ...tab,
                  lastVisitedAt: now,
                }
              : tab,
          ),
          activeTabKey: targetPathname,
        }),
      )
      const target = state.tabs.find((tab) => tab.pathname === targetPathname)
      router.push(buildWorkspaceHref(targetPathname, target?.cachedSearch))
    },
    [router, state.tabs],
  )

  const closeTab = React.useCallback<WorkspaceTabsContextValue["closeTab"]>(
    (targetPathname) => {
      const { state: nextState, nextActiveKey } = removeWorkspaceTab(state, targetPathname)
      setState(nextState)
      if (state.activeTabKey === targetPathname) {
        const nextTab = nextState.tabs.find((tab) => tab.key === nextActiveKey)
        if (nextTab) {
          router.push(buildWorkspaceHref(nextTab.pathname, nextTab.cachedSearch))
        }
      }
    },
    [router, state],
  )

  const updateTabMetaHandler = React.useCallback<
    WorkspaceTabsContextValue["updateTabMeta"]
  >((targetPathname, patch) => {
    setState((prev) => updateWorkspaceTabMeta(prev, targetPathname, patch))
  }, [])

  const navigateToDashboard = React.useCallback<
    WorkspaceTabsContextValue["navigateToDashboard"]
  >(
    (targetPathname, targetSearch, options) => {
      const normalizedPath = targetPathname.startsWith("/dashboard")
        ? targetPathname
        : `/dashboard${targetPathname.startsWith("/") ? "" : "/"}${targetPathname}`
      setState((prev) =>
        upsertWorkspaceTab(prev, {
          pathname: normalizedPath,
          search: targetSearch,
          title: options?.title,
          closable: options?.closable,
        }),
      )
      router.push(buildWorkspaceHref(normalizedPath, targetSearch))
    },
    [router],
  )

  const value = React.useMemo<WorkspaceTabsContextValue>(
    () => ({
      tabs: ensureWorkspaceDefaults(state).tabs,
      activeTabKey: ensureWorkspaceDefaults(state).activeTabKey,
      currentPathname: pathname,
      currentSearch: search,
      openTab,
      activateTab,
      closeTab,
      updateTabMeta: updateTabMetaHandler,
      navigateToDashboard,
    }),
    [
      activateTab,
      closeTab,
      navigateToDashboard,
      openTab,
      pathname,
      search,
      state,
      updateTabMetaHandler,
    ],
  )

  return (
    <WorkspaceTabsContext.Provider value={value}>
      {children}
    </WorkspaceTabsContext.Provider>
  )
}

export function useWorkspaceTabs() {
  const context = React.useContext(WorkspaceTabsContext)
  if (!context) {
    throw new Error("useWorkspaceTabs must be used within WorkspaceTabsProvider")
  }
  return context
}
