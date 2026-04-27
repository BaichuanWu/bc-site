"use client"

import * as React from "react"

import { useWorkspaceTabs } from "@/components/workspace/workspace-tabs-provider"
import { buildWorkspaceTabKey } from "@/lib/workspace-tabs"

export function WorkspaceHost({ children }: { children: React.ReactNode }) {
  const { tabs, activeTabKey, currentPathname } = useWorkspaceTabs()
  const [cache, setCache] = React.useState<Record<string, React.ReactNode>>({})
  const lastTabKeyRef = React.useRef<string | null>(null)
  const currentTabKey = React.useMemo(
    () => buildWorkspaceTabKey(currentPathname),
    [currentPathname],
  )

  React.useEffect(() => {
    if (!currentPathname || !currentTabKey) return
    if (lastTabKeyRef.current === currentTabKey) {
      setCache((prev) => ({
        ...prev,
        [currentTabKey]: children,
      }))
      return
    }
    setCache((prev) => ({
      ...prev,
      [currentTabKey]: children,
    }))
    lastTabKeyRef.current = currentTabKey
  }, [children, currentPathname, currentTabKey])

  React.useEffect(() => {
    setCache((prev) => {
      const allowed = new Set(tabs.map((tab) => tab.key))
      const nextEntries = Object.entries(prev).filter(([key]) => allowed.has(key))
      return Object.fromEntries(nextEntries)
    })
  }, [tabs])

  return (
    <div className="min-h-full flex-1">
      {tabs.map((tab) => (
        <div
          key={tab.key}
          className={
            tab.key === activeTabKey
              ? "min-h-full"
              : "hidden min-h-full"
          }
        >
          {tab.key === currentTabKey
            ? children
            : tab.key === activeTabKey
              ? cache[tab.key] ?? null
              : cache[tab.key] ?? null}
        </div>
      ))}
    </div>
  )
}
