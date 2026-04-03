"use client"

import * as React from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DefaultCanvasProps = {
  title: string
  description?: string
  toolbar?: React.ReactNode
  canvas: React.ReactNode
  drawerOpen: boolean
  onDrawerOpenChange: (open: boolean) => void
  drawerTitle?: string
  drawerDescription?: string
  drawerContent?: React.ReactNode
  canvasHeightClassName?: string
}

export function DefaultCanvas({
  title,
  description,
  toolbar,
  canvas,
  drawerOpen,
  onDrawerOpenChange,
  drawerTitle,
  drawerDescription,
  drawerContent,
  canvasHeightClassName = "h-[72vh] min-h-[680px]",
}: DefaultCanvasProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border bg-muted/10">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-background/70 px-4 py-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {description ? (
            <div className="text-xs text-muted-foreground">{description}</div>
          ) : null}
        </div>
        {toolbar ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {toolbar}
          </div>
        ) : null}
      </div>
      <div className={cn("relative", canvasHeightClassName)}>
        <div className="h-full w-full">{canvas}</div>
        <aside
          aria-hidden={!drawerOpen}
          className={cn(
            "absolute top-0 right-0 z-20 h-full w-[440px] max-w-[92vw] border-l bg-background shadow-xl transition-transform duration-200 ease-out",
            drawerOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
          )}
        >
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-start justify-between gap-3 border-b px-4 py-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{drawerTitle || "Inspector"}</div>
                {drawerDescription ? (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {drawerDescription}
                  </div>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onDrawerOpenChange(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              {drawerContent}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
