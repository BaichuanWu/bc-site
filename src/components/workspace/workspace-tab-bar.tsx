"use client"

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useWorkspaceTabs } from "@/components/workspace/workspace-tabs-provider"

export function WorkspaceTabBar() {
  const { tabs, activeTabKey, activateTab, closeTab } = useWorkspaceTabs()

  return (
    <div className="border-b bg-background/95">
      <div className="flex min-h-11 items-end gap-1 overflow-x-auto px-2 pt-2">
        {tabs.map((tab) => {
          const active = tab.key === activeTabKey
          return (
            <div
              key={tab.key}
              className={cn(
                "group flex min-w-[160px] max-w-[260px] items-center gap-2 rounded-t-xl border border-b-0 px-3 py-2 text-sm",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70",
              )}
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left"
                onClick={() => activateTab(tab.pathname)}
              >
                {tab.title}
              </button>
              {tab.closable ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0 opacity-60 hover:opacity-100"
                  onClick={() => closeTab(tab.pathname)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
