"use client"

import * as React from "react"

import { useWorkspaceTabs } from "@/components/workspace/workspace-tabs-provider"

export function WorkspaceHost({ children }: { children: React.ReactNode }) {
  const { tabs, activeTabKey, currentPathname } = useWorkspaceTabs()
  const [cache, setCache] = React.useState<Record<string, React.ReactNode>>({})
  const lastPathnameRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!currentPathname) return
    if (lastPathnameRef.current === currentPathname) return
    setCache((prev) => ({
      ...prev,
      [currentPathname]: children,
    }))
    lastPathnameRef.current = currentPathname
  }, [children, currentPathname])

  React.useEffect(() => {
    setCache((prev) => {
      const allowed = new Set(tabs.map((tab) => tab.key))
      const nextEntries = Object.entries(prev).filter(([key]) => allowed.has(key))
      return Object.fromEntries(nextEntries)
    })
  }, [tabs])

  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      {tabs.map((tab) => (
        <div
          key={tab.key}
          className={tab.key === activeTabKey ? "h-full" : "hidden h-full"}
        >
          {tab.key === activeTabKey ? children : cache[tab.key] ?? null}
        </div>
      ))}
    </div>
  )
}
