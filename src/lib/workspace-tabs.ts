"use client"

export type WorkspaceTab = {
  key: string
  pathname: string
  title: string
  closable: boolean
  cachedSearch?: string
  lastVisitedAt: number
}

export type WorkspaceTabsState = {
  tabs: WorkspaceTab[]
  activeTabKey: string
}

const STORAGE_KEY = "bc:workspace-tabs:v1"
const DASHBOARD_ROOT = "/dashboard"

export function buildWorkspaceTabKey(pathname: string) {
  if (!isDashboardPath(pathname) || pathname === DASHBOARD_ROOT) {
    return pathname
  }

  const segments = pathname.split("/").filter(Boolean)
  const lastSegment = segments[segments.length - 1]

  if (segments.length >= 3 && (lastSegment === "new" || /^\d+$/.test(lastSegment))) {
    return `/${segments.slice(0, -1).join("/")}/$detail`
  }

  return pathname
}

export function buildWorkspaceHref(pathname: string, search?: string) {
  const normalizedSearch = (search || "").replace(/^\?/, "")
  return normalizedSearch ? `${pathname}?${normalizedSearch}` : pathname
}

function normalizeWorkspaceTab(tab: WorkspaceTab): WorkspaceTab {
  const isRoot = tab.pathname === DASHBOARD_ROOT
  return {
    ...tab,
    key: buildWorkspaceTabKey(tab.pathname),
    title: tab.title || getWorkspaceTitleFallback(tab.pathname),
    closable: isRoot ? false : true,
    lastVisitedAt: Number(tab.lastVisitedAt) || Date.now(),
  }
}

function dedupeWorkspaceTabs(tabs: WorkspaceTab[]) {
  const byKey = new Map<string, WorkspaceTab>()

  for (const tab of tabs) {
    const existing = byKey.get(tab.key)
    if (!existing || tab.lastVisitedAt >= existing.lastVisitedAt) {
      byKey.set(tab.key, tab)
    }
  }

  return Array.from(byKey.values())
}

export function isDashboardPath(pathname: string) {
  return pathname === DASHBOARD_ROOT || pathname.startsWith(`${DASHBOARD_ROOT}/`)
}

export function getWorkspaceTitleFallback(pathname: string) {
  if (pathname === "/dashboard") return "Overview"
  if (pathname === "/dashboard/agent") return "Agents"
  if (pathname === "/dashboard/agent/new") return "New Agent"
  if (/^\/dashboard\/agent\/[^/]+$/.test(pathname)) return "Agent"
  if (pathname === "/dashboard/workflow") return "Workflow"
  if (pathname === "/dashboard/workflow/new") return "New Workflow"
  if (/^\/dashboard\/workflow\/[^/]+$/.test(pathname)) return "Workflow"
  if (pathname === "/dashboard/knowledge") return "Knowledge"
  if (pathname === "/dashboard/sys-task") return "System Tasks"
  if (/^\/dashboard\/sys-task\/[^/]+$/.test(pathname)) return "Task"
  if (pathname === "/dashboard/wqb/alpha") return "Alpha"
  if (pathname === "/dashboard/wqb/alpha/analysis") {
    return "Alpha Analysis"
  }
  return "Workspace"
}

export function createDefaultWorkspaceState(): WorkspaceTabsState {
  return {
    tabs: [
      {
        key: buildWorkspaceTabKey(DASHBOARD_ROOT),
        pathname: DASHBOARD_ROOT,
        title: getWorkspaceTitleFallback(DASHBOARD_ROOT),
        closable: false,
        lastVisitedAt: Date.now(),
      },
    ],
    activeTabKey: buildWorkspaceTabKey(DASHBOARD_ROOT),
  }
}

export function ensureWorkspaceDefaults(
  state: WorkspaceTabsState | null | undefined,
): WorkspaceTabsState {
  const base = state && Array.isArray(state.tabs) ? state : createDefaultWorkspaceState()
  const rootKey = buildWorkspaceTabKey(DASHBOARD_ROOT)
  const rootExisting = base.tabs.find((tab) => tab.key === rootKey)
  const tabs = rootExisting
    ? base.tabs.map((tab) =>
        tab.key === rootKey
          ? normalizeWorkspaceTab({
              ...tab,
              pathname: DASHBOARD_ROOT,
              title: tab.title || getWorkspaceTitleFallback(DASHBOARD_ROOT),
              closable: false,
            })
          : normalizeWorkspaceTab(tab),
      )
    : [
        normalizeWorkspaceTab({
          key: rootKey,
          pathname: DASHBOARD_ROOT,
          title: getWorkspaceTitleFallback(DASHBOARD_ROOT),
          closable: false,
          lastVisitedAt: Date.now(),
        }),
        ...base.tabs.map((tab) => normalizeWorkspaceTab(tab)),
      ]
  const uniqueTabs = dedupeWorkspaceTabs(tabs)
  const activeExists = uniqueTabs.some((tab) => tab.key === base.activeTabKey)
  return {
    tabs: uniqueTabs,
    activeTabKey: activeExists ? base.activeTabKey : rootKey,
  }
}

export function loadWorkspaceTabsState(): WorkspaceTabsState {
  if (typeof window === "undefined") return createDefaultWorkspaceState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultWorkspaceState()
    return ensureWorkspaceDefaults(JSON.parse(raw) as WorkspaceTabsState)
  } catch {
    return createDefaultWorkspaceState()
  }
}

export function saveWorkspaceTabsState(state: WorkspaceTabsState) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage failures
  }
}

export function upsertWorkspaceTab(
  state: WorkspaceTabsState,
  payload: {
    pathname: string
    search?: string
    title?: string
    closable?: boolean
  },
): WorkspaceTabsState {
  const key = buildWorkspaceTabKey(payload.pathname)
  const now = Date.now()
  const nextTab: WorkspaceTab = {
    key,
    pathname: payload.pathname,
    title: payload.title || getWorkspaceTitleFallback(payload.pathname),
    closable: payload.pathname === DASHBOARD_ROOT ? false : true,
    cachedSearch: payload.search || undefined,
    lastVisitedAt: now,
  }
  const existingIndex = state.tabs.findIndex((tab) => tab.key === key)
  const tabs =
    existingIndex >= 0
      ? state.tabs.map((tab, index) =>
          index === existingIndex
            ? {
                ...normalizeWorkspaceTab({
                  ...tab,
                  ...nextTab,
                }),
                title: payload.title || tab.title || nextTab.title,
                cachedSearch: payload.search ?? tab.cachedSearch,
              }
            : tab,
        )
      : [...state.tabs, nextTab]
  return ensureWorkspaceDefaults({
    tabs,
    activeTabKey: key,
  })
}

export function updateWorkspaceTabMeta(
  state: WorkspaceTabsState,
  pathname: string,
  patch: Partial<Pick<WorkspaceTab, "title" | "closable" | "cachedSearch">>,
): WorkspaceTabsState {
  const key = buildWorkspaceTabKey(pathname)
  return ensureWorkspaceDefaults({
    ...state,
    tabs: state.tabs.map((tab) =>
      tab.key === key
        ? normalizeWorkspaceTab({
            ...tab,
            ...patch,
          } as WorkspaceTab)
        : tab,
    ),
  })
}

export function resolveNextActiveTabOnClose(
  tabs: WorkspaceTab[],
  closingKey: string,
) {
  const fallback = tabs
    .filter((tab) => tab.key !== closingKey)
    .sort((a, b) => b.lastVisitedAt - a.lastVisitedAt)[0]
  return fallback?.key || buildWorkspaceTabKey(DASHBOARD_ROOT)
}

export function removeWorkspaceTab(
  state: WorkspaceTabsState,
  pathname: string,
): { state: WorkspaceTabsState; nextActiveKey: string } {
  const key = buildWorkspaceTabKey(pathname)
  const target = state.tabs.find((tab) => tab.key === key)
  if (!target || !target.closable) {
    return {
      state: ensureWorkspaceDefaults(state),
      nextActiveKey: ensureWorkspaceDefaults(state).activeTabKey,
    }
  }
  const nextActiveKey =
    state.activeTabKey === key
      ? resolveNextActiveTabOnClose(state.tabs, key)
      : state.activeTabKey
  const tabs = state.tabs.filter((tab) => tab.key !== key)
  return {
    state: ensureWorkspaceDefaults({
      tabs,
      activeTabKey: nextActiveKey,
    }),
    nextActiveKey,
  }
}
